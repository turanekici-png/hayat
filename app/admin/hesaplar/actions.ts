"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeBankAccountsContent, type BankAccount } from "@/lib/bank-accounts";

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function textValues(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => typeof value === "string" ? value.trim() : "");
}

export async function saveBankAccountsPage(formData: FormData) {
  const title = textValue(formData, "title") || "Hesap Numaralarımız";
  const note = textValue(formData, "note");
  const isActive = formData.get("isActive") === "on";

  const banks = textValues(formData, "bank");
  const branches = textValues(formData, "branch");
  const accountNames = textValues(formData, "accountName");
  const ibans = textValues(formData, "iban");
  const types = textValues(formData, "type");
  const descriptions = textValues(formData, "description");

  const accounts: BankAccount[] = banks.map((bank, index) => ({
    bank,
    branch: branches[index] || "",
    accountName: accountNames[index] || "",
    iban: ibans[index] || "",
    type: types[index] || "",
    description: descriptions[index] || ""
  })).filter((account) => account.bank || account.iban || account.type || account.description);

  const content = serializeBankAccountsContent({ note, accounts });

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
      slug: "hesap-numaralarimiz",
      content,
      isActive
    }
  });

  revalidatePath("/admin/hesaplar");
  revalidatePath("/hesap-numaralarimiz");
  revalidatePath("/");
  redirect("/admin/hesaplar");
}
