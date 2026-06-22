import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

function normalizeUsername(value?: string) {
  return value?.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, "");
}

function normalizeEmail(value?: string) {
  return value?.trim().toLocaleLowerCase("tr-TR");
}

function passwordHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function ensureEnvAdminUser() {
  const username = normalizeUsername(process.env.ADMIN_USERNAME || "tekici");
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!username || !password) return null;

  const existing = await prisma.adminUser.findFirst({ where: { username } });
  if (existing) return existing;

  const email = normalizeEmail(process.env.ADMIN_EMAIL) || `${username}@local.admin`;
  const fullName = process.env.ADMIN_FULL_NAME?.trim() || username;

  try {
    return await prisma.adminUser.create({
      data: {
        fullName,
        username,
        email,
        role: "ADMIN",
        passwordHash: passwordHash(password),
        isActive: true
      }
    });
  } catch {
    return prisma.adminUser.findFirst({ where: { username } });
  }
}
