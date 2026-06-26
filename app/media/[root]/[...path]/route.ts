import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { resolvePublicFilePath } from "@/lib/public-files";

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

export async function GET(_request: Request, { params }: { params: Promise<{ root: string; path: string[] }> }) {
  const { root, path: parts } = await params;
  const filePath = await resolvePublicFilePath(root, parts || []);
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
