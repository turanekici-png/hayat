import { existsSync } from "fs";
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
