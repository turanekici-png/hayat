import path from "path";
import { NextResponse } from "next/server";
import { resolvePublicFilePath } from "@/lib/public-files";
import { serveFile } from "@/lib/serve-media";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedExtensions = new Set([".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"]);

async function handle(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const filePath = await resolvePublicFilePath("brand", parts || []);
  if (!filePath) return new NextResponse("Not found", { status: 404 });
  const ext = path.extname(filePath).toLowerCase();
  return serveFile(request, filePath, { contentType: allowedExtensions.has(ext) ? undefined : "application/octet-stream" });
}

export const GET = handle;
export const HEAD = handle;
