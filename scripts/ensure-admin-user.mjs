import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

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
