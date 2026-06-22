"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveBankAccountsPage(formData: FormData) {
  const title = textValue(formData, "title") || "Hesap Numaralarımız";
  const content = textValue(formData, "content");
  const isActive = formData.get("isActive") === "on";

  await prisma.policyPage.upsert({
    where: { type: "BANK_ACCOUNTS" },
    create: {
      type: "BANK_ACCOUNTS",
      slug: "hesap-numaralarimiz",
      title,
      content,
      isActive
    },
    update: {
      title,
      content,
      isActive
    }
  });

  revalidatePath("/admin/hesaplar");
  revalidatePath("/hesap-numaralarimiz");
  revalidatePath("/");
  redirect("/admin/hesaplar");
}
