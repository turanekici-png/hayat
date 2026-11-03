import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";

// Requires npm run build. Starts Next directly, never startup migrations or
// bootstrap scripts. The unreachable local database cannot affect real data.
test("production homepage renders through a database outage", { timeout: 30000 }, async (t) => {
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));

  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)], {
    env: {
      ...process.env,
      DATABASE_URL: "postgresql://probe:probe@127.0.0.1:1/health?connect_timeout=1&pool_timeout=1",
      NEXT_TELEMETRY_DISABLED: "1"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  const collect = (chunk) => { logs = (logs + chunk).slice(-12000); };
  server.stdout.on("data", collect);
  server.stderr.on("data", collect);
  const exited = once(server, "exit");
  t.after(async () => {
    if (server.exitCode === null) server.kill();
    await exited;
  });

  const base = `http://127.0.0.1:${port}`;
  let listening = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const live = await fetch(`${base}/api/health/live`, { signal: AbortSignal.timeout(500) });
      listening = live.ok;
      await live.body?.cancel();
      if (listening) break;
    } catch {
      assert.equal(server.exitCode, null, "Next stopped before listening");
    }
    await delay(100);
  }
  assert.ok(listening, "Next did not start");

  const response = await fetch(`${base}/`, { signal: AbortSignal.timeout(15000) });
  const html = await response.text();
  assert.equal(response.status, 200);
  // Streaming can return 200 even when a page throws later. Check actual
  // rendered content as well, so that failure cannot pass as a healthy page.
  assert.match(html, /Hızlı Bağış/, "homepage failed to render its donation card");
  assert.match(html, /İletişim Sayfası/, "homepage footer was not rendered");
  assert.doesNotMatch(html, /Bir şeyler ters gitti/);

  const readiness = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(5000) });
  assert.equal(readiness.status, 503, "database monitoring must still report the outage");
  assert.equal((await readiness.json()).checks.database, "unavailable");
  assert.match(logs, /home_widget_unavailable/, "optional widgets did not exercise their failure path");
});
