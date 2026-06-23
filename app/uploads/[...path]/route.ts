import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

function safeUploadPath(parts: string[]) {
  if (parts.some((part) => !part || part === "." || part === ".." || part.includes("\\") || part.includes("/"))) {
    return null;
  }

  const root = path.resolve(process.cwd(), "public", "uploads");
  const target = path.resolve(root, ...parts);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) return null;
  return target;
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const filePath = safeUploadPath(parts || []);
  if (!filePath) return new NextResponse("Not found", { status: 404 });

  try {
    const file = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new NextResponse(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentTypes[ext] || "application/octet-stream"
      }
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
