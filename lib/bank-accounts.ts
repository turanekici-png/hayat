export type BankAccount = {
  bank: string;
  branch?: string;
  accountName?: string;
  iban: string;
  type?: string;
  description?: string;
};

export type BankAccountsContent = {
  note: string;
  accounts: BankAccount[];
};

export const defaultBankAccounts: BankAccount[] = [
  { bank: "T.C. Ziraat Bankası", branch: "Sivas Merkez Şubesi", accountName: "Hayat Ağacı Derneği", iban: "TR12 0001 0000 0000 0000 0000 01", type: "Genel Bağış" },
  { bank: "VakıfBank", branch: "Sivas Şubesi", accountName: "Hayat Ağacı Derneği", iban: "TR34 0001 5000 0000 0000 0000 02", type: "Zekat & Fitre" },
  { bank: "Halkbank", branch: "Sivas Şubesi", accountName: "Hayat Ağacı Derneği", iban: "TR56 0001 2000 0000 0000 0000 03", type: "Kurban" }
];

const defaultNote = "Banka hesap bilgileriniz yönetim panelinden güncellenebilir.";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAccount(value: unknown): BankAccount | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const bank = clean(record.bank);
  const iban = clean(record.iban);
  if (!bank && !iban) return null;

  return {
    bank,
    branch: clean(record.branch),
    accountName: clean(record.accountName),
    iban,
    type: clean(record.type),
    description: clean(record.description)
  };
}

function parseLegacyContent(content: string): BankAccountsContent {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const data: Record<string, string> = {};

  for (const line of lines) {
    const [key, ...rest] = line.split(":");
    if (!key || !rest.length) continue;
    const normalizedKey = key.toLocaleLowerCase("tr-TR");
    data[normalizedKey] = rest.join(":").trim();
  }

  const account = normalizeAccount({
    bank: data["banka adı"] || data["banka adi"] || "",
    accountName: data["hesap adı"] || data["hesap adi"] || "",
    iban: data["iban"] || "",
    description: data["açıklama"] || data["aciklama"] || ""
  });

  return {
    note: content || defaultNote,
    accounts: account ? [account] : []
  };
}

export function parseBankAccountsContent(content?: string | null): BankAccountsContent {
  if (!content?.trim()) return { note: defaultNote, accounts: [] };

  try {
    const parsed = JSON.parse(content) as unknown;
    if (Array.isArray(parsed)) {
      return { note: defaultNote, accounts: parsed.map(normalizeAccount).filter(Boolean) as BankAccount[] };
    }
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const accounts = Array.isArray(record.accounts) ? record.accounts.map(normalizeAccount).filter(Boolean) as BankAccount[] : [];
      return { note: clean(record.note) || defaultNote, accounts };
    }
  } catch {
    return parseLegacyContent(content);
  }

  return parseLegacyContent(content);
}

export function serializeBankAccountsContent(input: BankAccountsContent) {
  return JSON.stringify(
    {
      note: input.note.trim(),
      accounts: input.accounts.map((account) => ({
        bank: account.bank.trim(),
        branch: account.branch?.trim() || "",
        accountName: account.accountName?.trim() || "",
        iban: account.iban.trim(),
        type: account.type?.trim() || "",
        description: account.description?.trim() || ""
      }))
    },
    null,
    2
  );
}
