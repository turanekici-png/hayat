import { existsSync } from "fs";
import { readdir } from "fs/promises";
import path from "path";

const allowedPublicRoots = new Set(["uploads", "brand"]);

function publicRootCandidates() {
  const configured = process.env.HAYAT_PUBLIC_DIR?.trim();
  const cwd = process.cwd();
  return [
    configured,
    path.resolve(cwd, "public"),
    path.resolve(cwd, "..", "public"),
    path.resolve(cwd, "..", "..", "public"),
    path.resolve(cwd, ".next", "standalone", "public")
  ].filter((value): value is string => Boolean(value));
}

export function publicRoot() {
  const candidates = publicRootCandidates();
  return candidates.find((candidate) => existsSync(candidate)) || candidates[0] || path.resolve(process.cwd(), "public");
}

export function publicPath(...parts: string[]) {
  return path.join(publicRoot(), ...parts);
}

export function safePublicFilePath(rootName: string, parts: string[]) {
  if (!allowedPublicRoots.has(rootName)) return null;
  if (parts.some((part) => !part || part === "." || part === ".." || part.includes("\\") || part.includes("/"))) {
    return null;
  }

  const root = path.resolve(publicRoot(), rootName);
  const target = path.resolve(root, ...parts);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) return null;
  return target;
}

function uploadSafeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

async function findByFilename(root: string, requestedName: string) {
  const safeName = uploadSafeName(requestedName);
  const requestedLower = requestedName.toLowerCase();
  const stack = [root];

  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;

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

export async function resolvePublicFilePath(rootName: string, parts: string[]) {
  const filePath = safePublicFilePath(rootName, parts);
  if (!filePath) return null;
  if (existsSync(filePath)) return filePath;

  const requestedName = parts[parts.length - 1];
  if (!requestedName) return null;
  const root = path.resolve(publicRoot(), rootName);
  return findByFilename(root, requestedName);
}
