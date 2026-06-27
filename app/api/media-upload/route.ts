import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedUploadExtensions = new Set([".jpg", ".jpeg", ".png", ".mp4", ".webm", ".ogg", ".mov"]);
const allowedUploadMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime"
]);

function mimeTypeForFilename(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".mp4") return "video/mp4";
  if (extension === ".webm") return "video/webm";
  if (extension === ".ogg") return "video/ogg";
  if (extension === ".mov") return "video/quicktime";
  return "application/octet-stream";
}

function isAllowedUpload(file: File) {
  const extension = path.extname(file.name).toLowerCase();
  const mimeType = file.type?.toLowerCase() || mimeTypeForFilename(file.name);
  return allowedUploadExtensions.has(extension) && allowedUploadMimeTypes.has(mimeType);
}

function safeUploadFilename(fileName: string, prefix?: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  return `${Date.now()}-${prefix ? `${prefix}-` : ""}${safeName}`;
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const prefix = formData.get("prefix");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Dosya secilemedi." }, { status: 400 });
    }

    if (!isAllowedUpload(file)) {
      return NextResponse.json({ error: "Sadece JPG, PNG ve video dosyalari yukleyin." }, { status: 400 });
    }

    if (file.size > 80 * 1024 * 1024) {
      return NextResponse.json({ error: "Dosya boyutu 80MB ustunde olamaz." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const filename = safeUploadFilename(file.name, typeof prefix === "string" ? prefix : undefined);
    const media = await prisma.mediaAsset.create({
      data: {
        title: typeof title === "string" && title.trim() ? title.trim() : file.name,
        url: "",
        filename,
        mimeType: file.type || mimeTypeForFilename(file.name),
        size: file.size,
        content: new Uint8Array(bytes)
      }
    });
    const url = `/api/media/${media.id}/${encodeURIComponent(filename)}`;
    await prisma.mediaAsset.update({
      where: { id: media.id },
      data: { url }
    });

    return NextResponse.json({
      id: media.id,
      title: media.title,
      filename,
      mimeType: media.mimeType,
      size: media.size,
      url
    });
  } catch (error) {
    console.error("media upload failed", error);
    return NextResponse.json({ error: "Medya yuklenirken hata olustu." }, { status: 500 });
  }
}
