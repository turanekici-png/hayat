import { existsSync, readFileSync, statSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function loadLocalEnv() {
  if (!existsSync(".env")) return;

  const lines = readFileSync(".env", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadLocalEnv();

const prisma = new PrismaClient();
const allowedRoots = new Set(["uploads", "brand"]);
const mimeTypes = new Map([
  [".avif", "image/avif"],
  [".gif", "image/gif"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".mp4", "video/mp4"],
  [".mov", "video/quicktime"],
  [".ogg", "video/ogg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webm", "video/webm"],
  [".webp", "image/webp"]
]);

function publicRootCandidates() {
  const cwd = process.cwd();
  return [
    process.env.HAYAT_PUBLIC_DIR?.trim(),
    path.resolve(cwd, "public"),
    path.resolve(cwd, "..", "public"),
    path.resolve(cwd, "..", "..", "public"),
    path.resolve(cwd, ".next", "standalone", "public")
  ].filter(Boolean);
}

function publicRoot() {
  const candidates = publicRootCandidates();
  return candidates.find((candidate) => existsSync(candidate)) || candidates[0] || path.resolve(process.cwd(), "public");
}

function uploadSafeName(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

function mediaUrl(id, filename) {
  return `/api/media/${id}/${encodeURIComponent(filename)}`;
}

function parsePublicReference(value) {
  if (!value || value.startsWith("/api/media/") || value.startsWith("data:") || value.startsWith("blob:")) return null;
  let url = value.trim().replace(/\\/g, "/").replace(/^\.\//, "");

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      url = new URL(url).pathname;
    } catch {
      return null;
    }
  }

  url = decodeURIComponent(url).replace(/^\/+/, "");
  if (url.startsWith("media/")) url = url.slice("media/".length);

  const parts = url.split("/").filter(Boolean);
  if (parts.length >= 2 && allowedRoots.has(parts[0])) {
    return { rootName: parts[0], parts: parts.slice(1) };
  }

  if (parts.length === 1 && /\.(avif|gif|jpe?g|mp4|mov|ogg|png|svg|webm|webp)$/i.test(parts[0])) {
    return { rootName: "uploads", parts };
  }

  return null;
}

async function findByFilename(root, requestedName) {
  const safeName = uploadSafeName(requestedName);
  const requestedLower = requestedName.toLowerCase();
  const stack = [root];

  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      const entryLower = entry.name.toLowerCase();
      if (
        entryLower === requestedLower ||
        entryLower.endsWith(`-${requestedLower}`) ||
        entryLower === safeName ||
        entryLower.endsWith(`-${safeName}`)
      ) {
        return fullPath;
      }
    }
  }

  return null;
}

async function resolvePublicFile(value) {
  const reference = parsePublicReference(value);
  if (!reference) return null;

  const root = path.resolve(publicRoot(), reference.rootName);
  const target = path.resolve(root, ...reference.parts);
  if (target !== root && target.startsWith(`${root}${path.sep}`) && existsSync(target)) return target;

  const requestedName = reference.parts[reference.parts.length - 1];
  return requestedName ? findByFilename(root, requestedName) : null;
}

const createdByPath = new Map();

async function createMediaFromFile(filePath, title) {
  const realPath = path.resolve(filePath);
  if (createdByPath.has(realPath)) return createdByPath.get(realPath);

  const content = await readFile(realPath);
  const filename = path.basename(realPath);
  const size = statSync(realPath).size;
  const mimeType = mimeTypes.get(path.extname(realPath).toLowerCase()) || "application/octet-stream";

  const media = await prisma.mediaAsset.create({
    data: {
      title,
      url: "",
      filename,
      mimeType,
      size,
      content
    }
  });
  const url = mediaUrl(media.id, filename);
  await prisma.mediaAsset.update({ where: { id: media.id }, data: { url } });
  createdByPath.set(realPath, url);
  return url;
}

async function backfillUrl(value, title) {
  const filePath = await resolvePublicFile(value);
  if (!filePath) return null;
  return createMediaFromFile(filePath, title);
}

async function main() {
  let updated = 0;
  let missing = 0;

  const mediaAssets = await prisma.mediaAsset.findMany({
    where: { content: null },
    select: { id: true, title: true, url: true, filename: true }
  });
  for (const asset of mediaAssets) {
    const filePath = await resolvePublicFile(asset.url || asset.filename);
    if (!filePath) {
      missing += 1;
      continue;
    }

    const content = await readFile(filePath);
    const filename = path.basename(filePath);
    const mimeType = mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
    const size = statSync(filePath).size;
    const url = mediaUrl(asset.id, filename);
    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { content, filename, mimeType, size, url }
    });
    createdByPath.set(path.resolve(filePath), url);
    updated += 1;
  }

  const sections = await prisma.siteSection.findMany({
    select: { id: true, title: true, imageUrl: true }
  });
  for (const section of sections) {
    if (!section.imageUrl || section.imageUrl.startsWith("/api/media/")) continue;
    const url = await backfillUrl(section.imageUrl, section.title);
    if (!url) {
      missing += 1;
      continue;
    }
    await prisma.siteSection.update({ where: { id: section.id }, data: { imageUrl: url } });
    updated += 1;
  }

  const sectionImages = await prisma.siteSectionImage.findMany({
    select: { id: true, url: true, alt: true }
  });
  for (const image of sectionImages) {
    if (!image.url || image.url.startsWith("/api/media/")) continue;
    const url = await backfillUrl(image.url, image.alt);
    if (!url) {
      missing += 1;
      continue;
    }
    await prisma.siteSectionImage.update({ where: { id: image.id }, data: { url } });
    updated += 1;
  }

  const popups = await prisma.popupSetting.findMany({
    select: { id: true, title: true, imageUrl: true }
  });
  for (const popup of popups) {
    if (!popup.imageUrl || popup.imageUrl.startsWith("/api/media/")) continue;
    const url = await backfillUrl(popup.imageUrl, popup.title);
    if (!url) {
      missing += 1;
      continue;
    }
    await prisma.popupSetting.update({ where: { id: popup.id }, data: { imageUrl: url } });
    updated += 1;
  }

  console.log(`Medya DB aktarimi tamamlandi. Guncellenen kayit: ${updated}, dosyasi bulunamayan referans: ${missing}`);
}

main()
  .catch((error) => {
    console.error("Medya DB aktarimi basarisiz:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
