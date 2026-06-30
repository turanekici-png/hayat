"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { defaultIbanLabels, serializeBankAccountsContent, type BankAccount } from "@/lib/bank-accounts";

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function textValues(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => typeof value === "string" ? value.trim() : "");
}

export async function saveBankAccountsPage(formData: FormData) {
  const title = textValue(formData, "title") || "Banka havalesi ile bağış";
  const note = textValue(formData, "note");
  const isActive = formData.get("isActive") === "on";

  const banks = textValues(formData, "bank");
  const sortOrders = textValues(formData, "sortOrder");
  const logoUrls = textValues(formData, "logoUrl");
  const branches = textValues(formData, "branch");
  const accountNames = textValues(formData, "accountName");
  const tlIbans = textValues(formData, "tlIban");
  const dolarIbans = textValues(formData, "dolarIban");
  const euroIbans = textValues(formData, "euroIban");
  const types = textValues(formData, "type");
  const descriptions = textValues(formData, "description");

  const accounts: BankAccount[] = banks.map((bank, index) => ({
    bank,
    sortOrder: Number(sortOrders[index]) || 0,
    logoUrl: logoUrls[index] || "",
    branch: branches[index] || "",
    accountName: accountNames[index] || "",
    type: types[index] || "",
    description: descriptions[index] || "",
    ibans: [
      { label: defaultIbanLabels[0], iban: tlIbans[index] || "" },
      { label: defaultIbanLabels[1], iban: dolarIbans[index] || "" },
      { label: defaultIbanLabels[2], iban: euroIbans[index] || "" }
    ]
  })).filter((account) => account.bank || account.ibans.some((iban) => iban.iban) || account.type || account.description);

  const content = serializeBankAccountsContent({ note, accounts });

  const existingPage = await prisma.policyPage.findFirst({
    where: {
      OR: [
        { type: "BANK_ACCOUNTS" },
        { slug: "hesap-numaralarimiz" }
      ]
    },
    select: { id: true }
  });

  if (existingPage) {
    await prisma.policyPage.update({
      where: { id: existingPage.id },
      data: {
        type: "BANK_ACCOUNTS",
        slug: "hesap-numaralarimiz",
        title,
        content,
        isActive
      }
    });
  } else {
    await prisma.policyPage.create({
      data: {
        type: "BANK_ACCOUNTS",
        slug: "hesap-numaralarimiz",
        title,
        content,
        isActive
      }
    });
  }

  revalidatePath("/admin/hesaplar");
  revalidatePath("/hesap-numaralarimiz");
  revalidatePath("/");
  redirect("/admin/hesaplar");
}
