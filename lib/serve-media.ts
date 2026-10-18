import { createReadStream } from "fs";
import { mkdir, rename, stat, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { Readable } from "stream";
import { NextResponse } from "next/server";

const contentTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".ogg": "video/ogg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webm": "video/webm",
  ".webp": "image/webp"
};

export function contentTypeFromFilename(filename: string) {
  return contentTypes[path.extname(filename).toLowerCase()] || "application/octet-stream";
}

type ByteRange = { start: number; end: number };

// "bytes=START-END" basligini cozer. Gecersizse null, karsilanamazsa "unsatisfiable" doner.
function parseRange(header: string | null, size: number): ByteRange | null | "unsatisfiable" {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const [, startText, endText] = match;
  if (!startText && !endText) return null;

  let start: number;
  let end: number;
  if (!startText) {
    const suffix = Number(endText);
    if (!suffix) return "unsatisfiable";
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else {
    start = Number(startText);
    end = endText ? Math.min(Number(endText), size - 1) : size - 1;
  }

  if (start >= size || start > end) return "unsatisfiable";
  return { start, end };
}

/**
 * Diskteki bir dosyayi akis (stream) olarak gonderir. Range destegi sayesinde
 * videolar tamami inmeden oynatilabilir ve ileri sarilabilir (Safari/iPhone icin sart).
 */
export async function serveFile(
  request: Request,
  filePath: string,
  options: { contentType?: string; filename?: string; inline?: boolean } = {}
) {
  const info = await stat(filePath).catch(() => null);
  if (!info?.isFile()) return new NextResponse("Not found", { status: 404 });

  const size = info.size;
  const etag = `"${size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": options.contentType || contentTypeFromFilename(filePath),
    ETag: etag,
    "Last-Modified": info.mtime.toUTCString()
  });
  if (options.inline && options.filename) {
    headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(options.filename)}"`);
  }

  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers });
  }

  const range = parseRange(request.headers.get("range"), size);
  if (range === "unsatisfiable") {
    headers.set("Content-Range", `bytes */${size}`);
    return new NextResponse(null, { status: 416, headers });
  }

  if (request.method === "HEAD") {
    headers.set("Content-Length", String(size));
    return new NextResponse(null, { status: 200, headers });
  }

  if (range) {
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
    headers.set("Content-Length", String(range.end - range.start + 1));
    const stream = createReadStream(filePath, { start: range.start, end: range.end });
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, { status: 206, headers });
  }

  headers.set("Content-Length", String(size));
  const stream = createReadStream(filePath);
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, { status: 200, headers });
}

const mediaCacheDir = path.join(process.env.HAYAT_MEDIA_CACHE_DIR?.trim() || os.tmpdir(), "hayat-media-cache");
const pendingWrites = new Map<string, Promise<string | null>>();

function cacheFilePath(id: string) {
  return path.join(mediaCacheDir, id.replace(/[^a-zA-Z0-9_-]/g, "_"));
}

/** Veritabanindaki medya icerigi daha once diske yazildiysa yolunu dondurur. */
export async function cachedMediaPath(id: string) {
  const filePath = cacheFilePath(id);
  const info = await stat(filePath).catch(() => null);
  return info?.isFile() ? filePath : null;
}

/**
 * DB'deki medya icerigini bir kez diske yazar; sonraki istekler veritabanina
 * gitmeden diskten (Range destekli) sunulur. Yazilamazsa null doner.
 */
export async function writeMediaCache(id: string, content: Uint8Array) {
  const existing = pendingWrites.get(id);
  if (existing) return existing;

  const task = (async () => {
    try {
      await mkdir(mediaCacheDir, { recursive: true });
      const filePath = cacheFilePath(id);
      const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(tempPath, content);
      await rename(tempPath, filePath);
      return filePath;
    } catch (error) {
      console.error("media cache write failed", error);
      return null;
    } finally {
      pendingWrites.delete(id);
    }
  })();

  pendingWrites.set(id, task);
  return task;
}
