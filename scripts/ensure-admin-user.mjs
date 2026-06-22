import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
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

function normalizeUsername(value) {
  return value?.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, "");
}

function normalizeEmail(value) {
  return value?.trim().toLocaleLowerCase("tr-TR");
}

function passwordHash(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function main() {
  const username = normalizeUsername(process.env.ADMIN_USERNAME || "tekici");
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!username || !password) {
    console.log("ADMIN_USERNAME veya ADMIN_PASSWORD eksik, admin kullanicisi olusturulmadi.");
    return;
  }

  const existing = await prisma.adminUser.findFirst({ where: { username } });
  if (existing) {
    console.log(`Admin kullanicisi zaten var: ${username}`);
    return;
  }

  const email = normalizeEmail(process.env.ADMIN_EMAIL) || `${username}@local.admin`;
  const fullName = process.env.ADMIN_FULL_NAME?.trim() || username;

  await prisma.adminUser.create({
    data: {
      fullName,
      username,
      email,
      role: "ADMIN",
      passwordHash: passwordHash(password),
      isActive: true
    }
  });

  console.log(`Admin kullanicisi olusturuldu: ${username}`);
}

main()
  .catch((error) => {
    console.error("Admin kullanicisi olusturulamadi:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
