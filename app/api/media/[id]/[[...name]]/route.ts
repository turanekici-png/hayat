import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { resolvePublicFilePath } from "@/lib/public-files";
import { cachedMediaPath, contentTypeFromFilename, serveFile, writeMediaCache } from "@/lib/serve-media";

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

async function handle(request: Request, { params }: { params: Promise<{ id: string; name?: string[] }> }) {
  const { id, name } = await params;

  // Once sadece kucuk alanlar okunur; buyuk "content" alani her istekte cekilmez.
  const media = await prisma.mediaAsset.findUnique({
    where: { id },
    select: {
      filename: true,
      mimeType: true,
      size: true
    }
  }).catch(() => null);

  if (media) {
    const cacheKey = `${id}-${media.size}`;
    const cachedPath = await cachedMediaPath(cacheKey);
    if (cachedPath) {
      return serveFile(request, cachedPath, { contentType: media.mimeType, filename: media.filename, inline: true });
    }

    const row = await prisma.mediaAsset.findUnique({ where: { id }, select: { content: true } }).catch(() => null);
    if (row?.content) {
      const writtenPath = await writeMediaCache(cacheKey, row.content);
      if (writtenPath) {
        return serveFile(request, writtenPath, { contentType: media.mimeType, filename: media.filename, inline: true });
      }
      return responseFromBuffer(row.content, media.filename, media.mimeType);
    }
  }

  const requestedName = name?.[name.length - 1] || media?.filename;
  if (requestedName) {
    const filePath =
      await resolvePublicFilePath("uploads", [requestedName]) ||
      await resolvePublicFilePath("brand", [requestedName]);

    if (filePath) {
      const filename = path.basename(filePath);
      return serveFile(request, filePath, { contentType: contentTypeFromFilename(filename), filename, inline: true });
    }
  }

  return new NextResponse("Not found", { status: 404 });
}

export const GET = handle;
export const HEAD = handle;
