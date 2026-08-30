"use server";

import { prisma } from "@/lib/prisma";

export async function recordVisit(path: string) {
  const safePath = typeof path === "string" && path.trim() ? path.trim().slice(0, 300) : "/";
  await prisma.siteVisit.create({ data: { path: safePath } }).catch(() => null);
}
