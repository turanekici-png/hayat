import { NextResponse } from "next/server";
import { resolvePublicFilePath } from "@/lib/public-files";
import { serveFile } from "@/lib/serve-media";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(request: Request, { params }: { params: Promise<{ root: string; path: string[] }> }) {
  const { root, path: parts } = await params;
  const filePath = await resolvePublicFilePath(root, parts || []);
  if (!filePath) return new NextResponse("Not found", { status: 404 });
  return serveFile(request, filePath);
}

export const GET = handle;
export const HEAD = handle;
