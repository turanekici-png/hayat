"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function nullableText(formData: FormData, key: string, maxLength = 500) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed ? trimmed : null;
}

function safeUrl(formData: FormData, key: string) {
  const value = nullableText(formData, key, 300);
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value; // site ici adres (orn. /basvuru)
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export async function saveSiteSettings(formData: FormData) {
  const impactAmounts = formData.getAll("impactAmount").map((value) => (typeof value === "string" ? value.replace(/[^\d]/g, "") : ""));
  const impactTexts = formData.getAll("impactText").map((value) => (typeof value === "string" ? value.trim().slice(0, 160) : ""));
  const donationImpacts = impactAmounts
    .map((amount, index) => (amount && impactTexts[index] ? `${amount}|${impactTexts[index]}` : null))
    .filter((line): line is string => Boolean(line))
    .join("\n");

  const data = {
    registryNo: nullableText(formData, "registryNo", 80),
    affiliationNote: nullableText(formData, "affiliationNote", 120),
    phone: nullableText(formData, "phone", 40),
    email: nullableText(formData, "email", 120),
    address: nullableText(formData, "address", 240),
    footerAbout: nullableText(formData, "footerAbout", 600),
    facebookUrl: safeUrl(formData, "facebookUrl"),
    instagramUrl: safeUrl(formData, "instagramUrl"),
    twitterUrl: safeUrl(formData, "twitterUrl"),
    youtubeUrl: safeUrl(formData, "youtubeUrl"),
    donationImpacts: donationImpacts || null,
    applicationsEnabled: formData.get("applicationsEnabled") === "on",
    applicationUrl: safeUrl(formData, "applicationUrl")
  };

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data
  });

  revalidateTag("site-settings");
  revalidatePath("/basvuru");
  revalidatePath("/admin/basvurular");
  revalidatePath("/", "layout");
  redirect(`/admin/ayarlar?kaydedildi=${Date.now()}`);
}
