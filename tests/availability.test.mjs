import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";
import { checkHealth } from "../scripts/healthcheck.mjs";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));

// Load the actual route/stream implementation without starting Next or needing
// a database. Only the Prisma dependency is replaced in health route tests.
async function loadTypeScript(relativePath, replacements = {}) {
  const filename = path.join(root, relativePath);
  const source = await readFile(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  });
  const loadedModule = { exports: {} };
  const localRequire = (id) => Object.hasOwn(replacements, id) ? replacements[id] : require(id);
  new Function("require", "module", "exports", outputText)(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

test("optional home widgets isolate database failures and recover", async (t) => {
  const logs = [];
  t.mock.method(console, "error", (line) => { logs.push(line); });
  const labels = [{ id: "label", type: "NEWS", label: "Haberler" }];
  const announcements = [{ id: "announcement", title: "Duyuru" }];
  const popup = { id: "popup", title: "Bilgilendirme" };

  for (const failingWidget of ["labels", "announcements", "popup"]) {
    let unavailable = true;
    const read = (widget, value) => async () => {
      if (unavailable && widget === failingWidget) {
        throw Object.assign(new Error("secret database connection details"), { code: "P1001" });
      }
      return value;
    };
    const prisma = {
      sectionGroupLabel: { findMany: read("labels", labels) },
      announcement: { findMany: read("announcements", announcements) },
      popupSetting: { findFirst: read("popup", popup) }
    };
    const widgets = await loadTypeScript("lib/home-widgets.ts", {
      "@/lib/prisma": { prisma },
      "next/cache": { unstable_cache: (load) => load }
    });
    const load = () => Promise.all([widgets.getHomeGroupLabels(), widgets.getHomeAnnouncements(), widgets.getHomePopup()]);
    assert.deepEqual(await load(), [
      failingWidget === "labels" ? [] : labels,
      failingWidget === "announcements" ? [] : announcements,
      failingWidget === "popup" ? null : popup
    ]);
    unavailable = false;
    assert.deepEqual(await load(), [labels, announcements, popup]);
  }
  assert.equal(logs.length, 3);
  assert.ok(logs.every((line) => JSON.parse(line).event === "home_widget_unavailable"));
  assert.doesNotMatch(logs.join("\n"), /secret/);
});

test("home widgets tolerate a complete database outage", async (t) => {
  t.mock.method(console, "error", () => {});
  const reject = async () => { throw new Error("database down"); };
  const widgets = await loadTypeScript("lib/home-widgets.ts", {
    "@/lib/prisma": { prisma: {
      sectionGroupLabel: { findMany: reject },
      announcement: { findMany: reject },
      popupSetting: { findFirst: reject }
    } },
    "next/cache": { unstable_cache: (load) => load }
  });
  assert.deepEqual(await Promise.all([
    widgets.getHomeGroupLabels(), widgets.getHomeAnnouncements(), widgets.getHomePopup()
  ]), [[], [], null]);
});

test("media preserves complete downloads, byte ranges, HEAD and cancellation", async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), "hayat-media-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const filename = path.join(dir, "video.mp4");
  const content = Buffer.alloc(1024 * 1024);
  for (let index = 0; index < content.length; index++) content[index] = index % 251;
  await writeFile(filename, content);
  const { serveFile } = await loadTypeScript("lib/serve-media.ts");
  const url = "http://localhost/media/video.mp4";

  const full = await serveFile(new Request(url), filename);
  assert.equal(full.status, 200);
  assert.deepEqual(Buffer.from(await full.arrayBuffer()), content);

  for (const [range, start, end] of [["bytes=20-119", 20, 120], ["bytes=-25", content.length - 25, content.length]]) {
    const response = await serveFile(new Request(url, { headers: { range } }), filename);
    assert.equal(response.status, 206);
    assert.equal(response.headers.get("content-range"), `bytes ${start}-${end - 1}/${content.length}`);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), content.subarray(start, end));
  }

  const head = await serveFile(new Request(url, { method: "HEAD" }), filename);
  assert.equal(head.status, 200);
  assert.equal(head.body, null);
  assert.equal(head.headers.get("content-length"), String(content.length));
  const notModified = await serveFile(new Request(url, { headers: { "if-none-match": full.headers.get("etag") } }), filename);
  assert.equal(notModified.status, 304);
  const unsatisfiable = await serveFile(new Request(url, { headers: { range: `bytes=${content.length}-` } }), filename);
  assert.equal(unsatisfiable.status, 416);

  // Browser video seeks/navigation can cancel an outstanding read. Uncaught
  // stream errors fail the test runner, and open file handles fail cleanup.
  for (let index = 0; index < 100; index++) {
    const response = await serveFile(new Request(url, index % 2 ? { headers: { range: "bytes=0-" } } : {}), filename);
    const reader = response.body.getReader();
    await reader.read();
    const pending = reader.read();
    await reader.cancel("browser disconnected");
    await pending;
    reader.releaseLock();
  }
});

test("liveness succeeds without a database and cannot be cached", async () => {
  const { GET } = await loadTypeScript("app/api/health/live/route.ts");
  const response = GET();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal((await response.json()).status, "ok");
});

test("readiness reports database failures without exposing connection details", async () => {
  for (const available of [true, false]) {
    const prisma = { $queryRaw: () => available ? Promise.resolve([{ value: 1 }]) : Promise.reject(new Error("secret database URL")) };
    const { GET } = await loadTypeScript("app/api/health/route.ts", { "@/lib/prisma": { prisma } });
    const response = await GET();
    assert.equal(response.status, available ? 200 : 503);
    assert.match(response.headers.get("cache-control"), /no-store/);
    const body = await response.json();
    assert.equal(body.checks.database, available ? "ok" : "unavailable");
    assert.doesNotMatch(JSON.stringify(body), /secret/);
  }
});

test("readiness times out and shares a pending probe instead of filling the pool", async () => {
  let resolveProbe;
  let calls = 0;
  const blocked = new Promise((resolve) => { resolveProbe = resolve; });
  const prisma = { $queryRaw: () => { calls++; return calls === 1 ? blocked : Promise.resolve([]); } };
  const { GET } = await loadTypeScript("app/api/health/route.ts", { "@/lib/prisma": { prisma } });
  const started = performance.now();
  const responses = await Promise.all([GET(), GET()]);
  assert.deepEqual(responses.map((response) => response.status), [503, 503]);
  assert.equal(calls, 1);
  assert.ok(performance.now() - started < 5000);
  resolveProbe([]);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal((await GET()).status, 200);
  assert.equal(calls, 2);
});

test("container probe detects HTTP failures, invalid payloads and a stalled server", async (t) => {
  const server = createServer((request, response) => {
    if (request.url === "/stall") return;
    response.setHeader("content-type", "application/json");
    if (request.url === "/failure") response.statusCode = 503;
    response.end(request.url === "/invalid" ? "not json" : JSON.stringify({ status: "ok" }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal(await checkHealth(`${base}/ok`), true);
  assert.equal(await checkHealth(`${base}/failure`), false);
  assert.equal(await checkHealth(`${base}/invalid`), false);
  assert.equal(await checkHealth(`${base}/stall`, 100), false);
});
