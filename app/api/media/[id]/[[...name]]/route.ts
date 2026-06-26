import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";
import { resolvePublicFilePath } from "@/lib/public-files";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function responseFromBuffer(content: Buffer | Uint8Array, filename: string, mimeType?: string | null) {
  return new NextResponse(Buffer.from(content), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
      "Content-Type": mimeType || "application/octet-stream"
    }
  });
}

function contentTypeFromFilename(filename: string) {
  const ext = path.extname(filename).toLowerCase();
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
  return contentTypes[ext] || "application/octet-stream";
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; name?: string[] }> }) {
  const { id, name } = await params;
  const media = await prisma.mediaAsset.findUnique({
    where: { id },
    select: {
      content: true,
      filename: true,
      mimeType: true
    }
  }).catch(() => null);

  if (!media?.content) {
    const requestedName = name?.[name.length - 1] || media?.filename;
    if (requestedName) {
      const filePath =
        await resolvePublicFilePath("uploads", [requestedName]) ||
        await resolvePublicFilePath("brand", [requestedName]);

      if (filePath) {
        const file = await readFile(filePath).catch(() => null);
        if (file) {
          const filename = path.basename(filePath);
          return responseFromBuffer(file, filename, contentTypeFromFilename(filename));
        }
      }
    }

    return new NextResponse("Not found", { status: 404 });
  }

  return responseFromBuffer(media.content, media.filename, media.mimeType);
}
