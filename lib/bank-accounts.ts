export type BankIban = {
  label: string;
  iban: string;
};

export type BankAccount = {
  bank: string;
  sortOrder?: number;
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

export const defaultIbanLabels = ["TL IBAN", "Dolar IBAN", "Euro IBAN"];

export const defaultBankAccounts: BankAccount[] = [
  {
    bank: "T.C. Ziraat Bankası",
    branch: "Sivas Merkez Şubesi",
    accountName: "Hayat Ağacı Derneği",
    type: "Genel Bağış",
    ibans: [
      { label: "TL IBAN", iban: "TR12 0001 0000 0000 0000 0000 01" }
    ]
  },
  {
    bank: "VakıfBank",
    branch: "Sivas Şubesi",
    accountName: "Hayat Ağacı Derneği",
    type: "Zekat & Fitre",
    ibans: [
      { label: "TL IBAN", iban: "TR34 0001 5000 0000 0000 0000 02" }
    ]
  },
  {
    bank: "Halkbank",
    branch: "Sivas Şubesi",
    accountName: "Hayat Ağacı Derneği",
    type: "Kurban",
    ibans: [
      { label: "TL IBAN", iban: "TR56 0001 2000 0000 0000 0000 03" }
    ]
  }
];

const defaultNote = "Hesap sahibi tüm hesaplarda Hayat Ağacı Derneği'dir. Açıklama kısmına bağış türünü yazmanız yeterlidir.";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanSortOrder(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(clean(value));
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0;
}

function ibanKey(label: string) {
  const value = label.toLocaleLowerCase("tr-TR");
  if (value.includes("dolar") || value.includes("usd") || value.includes("$")) return "dolar";
  if (value.includes("euro") || value.includes("eur") || value.includes("€")) return "euro";
  return "tl";
}

function normalizeIbans(value: unknown, legacyIban = ""): BankIban[] {
  const parsed = Array.isArray(value)
    ? value.map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return { label: clean(record.label), iban: clean(record.iban) };
    }).filter(Boolean) as BankIban[]
    : [];

  const source = parsed.length ? parsed : (legacyIban ? [{ label: "TL IBAN", iban: legacyIban }] : []);
  const byKey = new Map<string, BankIban>();
  source.forEach((item, index) => {
    const fallbackKey = index === 1 ? "dolar" : index === 2 ? "euro" : "tl";
    const key = item.label ? ibanKey(item.label) : fallbackKey;
    if (!byKey.has(key)) byKey.set(key, item);
  });

  return defaultIbanLabels.map((label) => {
    const sourceItem = byKey.get(ibanKey(label));
    return {
      label,
      iban: sourceItem?.iban || ""
    };
  });
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
    sortOrder: cleanSortOrder(record.sortOrder),
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

export function sortBankAccounts(accounts: BankAccount[]) {
  return accounts
    .map((account, index) => ({ account, index }))
    .sort((a, b) => {
      const aOrder = a.account.sortOrder || 0;
      const bOrder = b.account.sortOrder || 0;
      if (aOrder && bOrder && aOrder !== bOrder) return aOrder - bOrder;
      if (aOrder && !bOrder) return -1;
      if (!aOrder && bOrder) return 1;
      return a.index - b.index;
    })
    .map((item) => item.account);
}

export function parseBankAccountsContent(content?: string | null): BankAccountsContent {
  if (!content?.trim()) return { note: defaultNote, accounts: [] };

  try {
    const parsed = JSON.parse(content) as unknown;
    if (Array.isArray(parsed)) {
      return { note: defaultNote, accounts: sortBankAccounts(parsed.map(normalizeAccount).filter(Boolean) as BankAccount[]) };
    }
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const accounts = Array.isArray(record.accounts) ? record.accounts.map(normalizeAccount).filter(Boolean) as BankAccount[] : [];
      return { note: clean(record.note) || defaultNote, accounts: sortBankAccounts(accounts) };
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
        sortOrder: account.sortOrder || 0,
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
