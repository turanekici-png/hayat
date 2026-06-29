export type BankIban = {
  label: string;
  iban: string;
};

export type BankAccount = {
  bank: string;
  logoUrl?: string;
  branch?: string;
  accountName?: string;
  type?: string;
  description?: string;
  ibans: BankIban[];
};

export type BankAccountsContent = {
  note: string;
  accounts: BankAccount[];
};

export const defaultIbanLabels = ["TL Hesabı", "Euro Hesabı", "Dolar Hesabı"];

export const defaultBankAccounts: BankAccount[] = [
  {
    bank: "T.C. Ziraat Bankası",
    branch: "Sivas Merkez Şubesi",
    accountName: "Hayat Ağacı Derneği",
    type: "Genel Bağış",
    ibans: [
      { label: "TL Hesabı", iban: "TR12 0001 0000 0000 0000 0000 01" },
      { label: "Euro Hesabı", iban: "TR12 0001 0000 0000 0000 0000 02" },
      { label: "Dolar Hesabı", iban: "TR12 0001 0000 0000 0000 0000 03" }
    ]
  },
  {
    bank: "VakıfBank",
    branch: "Sivas Şubesi",
    accountName: "Hayat Ağacı Derneği",
    type: "Zekat & Fitre",
    ibans: [
      { label: "TL Hesabı", iban: "TR34 0001 5000 0000 0000 0000 01" },
      { label: "Euro Hesabı", iban: "TR34 0001 5000 0000 0000 0000 02" },
      { label: "Dolar Hesabı", iban: "TR34 0001 5000 0000 0000 0000 03" }
    ]
  },
  {
    bank: "Halkbank",
    branch: "Sivas Şubesi",
    accountName: "Hayat Ağacı Derneği",
    type: "Kurban",
    ibans: [
      { label: "TL Hesabı", iban: "TR56 0001 2000 0000 0000 0000 01" },
      { label: "Euro Hesabı", iban: "TR56 0001 2000 0000 0000 0000 02" },
      { label: "Dolar Hesabı", iban: "TR56 0001 2000 0000 0000 0000 03" }
    ]
  }
];

const defaultNote = "Banka hesap bilgileriniz yönetim panelinden güncellenebilir.";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeIbans(value: unknown, legacyIban = ""): BankIban[] {
  const parsed = Array.isArray(value)
    ? value.map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return { label: clean(record.label), iban: clean(record.iban) };
    }).filter(Boolean) as BankIban[]
    : [];

  const source = parsed.length ? parsed : (legacyIban ? [{ label: "TL Hesabı", iban: legacyIban }] : []);
  return defaultIbanLabels.map((label, index) => ({
    label: source[index]?.label || label,
    iban: source[index]?.iban || ""
  }));
}

function normalizeAccount(value: unknown): BankAccount | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const bank = clean(record.bank);
  const legacyIban = clean(record.iban);
  const ibans = normalizeIbans(record.ibans, legacyIban);
  if (!bank && !ibans.some((item) => item.iban)) return null;

  return {
    bank,
    logoUrl: clean(record.logoUrl),
    branch: clean(record.branch),
    accountName: clean(record.accountName),
    type: clean(record.type),
    description: clean(record.description),
    ibans
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
        logoUrl: account.logoUrl?.trim() || "",
        branch: account.branch?.trim() || "",
        accountName: account.accountName?.trim() || "",
        type: account.type?.trim() || "",
        description: account.description?.trim() || "",
        ibans: normalizeIbans(account.ibans).map((item) => ({
          label: item.label.trim(),
          iban: item.iban.trim()
        }))
      }))
    },
    null,
    2
  );
}
