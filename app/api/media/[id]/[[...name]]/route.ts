import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; name?: string[] }> }) {
  const { id } = await params;
  const media = await prisma.mediaAsset.findUnique({
    where: { id },
    select: {
      content: true,
      filename: true,
      mimeType: true
    }
  }).catch(() => null);

  if (!media?.content) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(Buffer.from(media.content), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${encodeURIComponent(media.filename)}"`,
      "Content-Type": media.mimeType || "application/octet-stream"
    }
  });
}
