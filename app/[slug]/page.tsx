import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CopyIbanButton } from "@/components/CopyIbanButton";
import { PolicyAcceptButton } from "@/components/PolicyAcceptButton";
import { prisma } from "@/lib/prisma";
import { bankAccountFromRecord, defaultBankAccounts, parseBankAccountsContent, type BankAccount } from "@/lib/bank-accounts";
import { normalizeMediaUrl } from "@/lib/media-url";
import { optimizedImageSrc } from "@/lib/image-src";
import { DollarSign, Euro, Info, ShieldCheck } from "lucide-react";
import { unstable_cache } from "next/cache";
import type { CSSProperties } from "react";

const fallbackPolicies: Record<string, { title: string; content: string; label?: string }> = {
  kvkk: {
    title: "KVKK Aydınlatma Metni",
    content: "Bu alan yönetim panelinden kurumunuzun resmi KVKK Aydınlatma Metni ile güncellenmelidir. Bağışçı ve başvuru sahibi kişisel verileri, ilgili mevzuat kapsamında yalnızca dernek faaliyetlerinin yürütülmesi amacıyla işlenir."
  },
  "kullanim-kosullari-ve-gizlilik-politikasi": {
    title: "Kullanım Koşulları ve Gizlilik Politikası",
    content: "Bu alan yönetim panelinden kurumunuzun resmi kullanım koşulları ve gizlilik politikası ile güncellenmelidir. Site kullanımı, bağış işlemleri ve kişisel veri güvenliği esasları burada açıklanır."
  },
  "iade-politikasi": {
    title: "İade Politikası",
    content: "Bu alan yönetim panelinden kurumunuzun resmi iade politikası ile güncellenmelidir. Hatalı veya mükerrer bağış talepleri kurum incelemesi sonrasında değerlendirilir."
  },
  "cerez-politikasi": {
    title: "Çerez Politikası",
    content: "Bu alan yönetim panelinden kurumunuzun resmi çerez politikası ile güncellenmelidir. Site deneyimini iyileştirmek ve güvenliği sağlamak amacıyla zorunlu çerezler kullanılabilir."
  },
  "hesap-numaralarimiz": {
    title: "Banka havalesi ile bağış",
    label: "Hesap Numaralarımız",
    content: "Hesap sahibi tüm hesaplarda Hayat Ağacı Derneği'dir. Açıklama kısmına bağış türünü yazmanız yeterlidir."
  }
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function visibleIbans(account: BankAccount) {
  return account.ibans.filter((iban) => iban.iban.trim().length > 0);
}

function ibanCurrencyLabel(label: string, isSingle: boolean) {
  return (isSingle ? "IBAN" : label.replace(" IBAN", "")).toLocaleUpperCase("tr-TR");
}

function CurrencyIcon({ label }: { label: string }) {
  const key = label.toLocaleLowerCase("tr-TR");
  if (key.includes("dolar") || key.includes("usd")) return <DollarSign size={28} strokeWidth={2.8} />;
  if (key.includes("euro") || key.includes("eur")) return <Euro size={28} strokeWidth={2.8} />;
  return <span className="text-[24px] font-black leading-none sm:text-[30px]">₺</span>;
}

type BankTheme = {
  primary: string;
  secondary: string;
  accent: string;
  soft: string;
  card: string;
  row: string;
  text: string;
};

const defaultBankTheme: BankTheme = {
  primary: "#0b4f7a",
  secondary: "#1593cf",
  accent: "#6fae2e",
  soft: "#eef7fb",
  card: "linear-gradient(145deg, #ffffff 0%, #f4f9fc 100%)",
  row: "linear-gradient(145deg, #ffffff 0%, #f3f9fc 100%)",
  text: "#061b55"
};

const bankThemes: Array<{ keys: string[]; theme: BankTheme }> = [
  {
    keys: ["vakıf katılım", "vakif katilim", "vakif katılım", "vakıf katilim"],
    theme: {
      primary: "#0057a8",
      secondary: "#e4007f",
      accent: "#00a6ce",
      soft: "#eef6ff",
      card: "linear-gradient(145deg, #ffffff 0%, #eef6ff 52%, #fff0f8 100%)",
      row: "linear-gradient(145deg, #ffffff 0%, #f1f7ff 100%)",
      text: "#002b66"
    }
  },
  {
    keys: ["vakıfbank", "vakifbank"],
    theme: {
      primary: "#f6c800",
      secondary: "#003b79",
      accent: "#005baa",
      soft: "#fff8d8",
      card: "linear-gradient(145deg, #ffffff 0%, #fff7d7 58%, #eef5ff 100%)",
      row: "linear-gradient(145deg, #ffffff 0%, #fff9df 100%)",
      text: "#062d63"
    }
  },
  {
    keys: ["ziraat katılım", "ziraat katilim", "ziraat bankası", "ziraat bankasi", "ziraat"],
    theme: {
      primary: "#e30613",
      secondary: "#b40000",
      accent: "#ffffff",
      soft: "#fff0f0",
      card: "linear-gradient(145deg, #ffffff 0%, #fff1f1 58%, #f9fbff 100%)",
      row: "linear-gradient(145deg, #ffffff 0%, #fff4f4 100%)",
      text: "#6e0000"
    }
  },
  {
    keys: ["albaraka"],
    theme: {
      primary: "#009a44",
      secondary: "#cf142b",
      accent: "#8cc63f",
      soft: "#eefbf4",
      card: "linear-gradient(145deg, #ffffff 0%, #eefbf4 58%, #fff2f4 100%)",
      row: "linear-gradient(145deg, #ffffff 0%, #f0fbf5 100%)",
      text: "#004b2a"
    }
  },
  {
    keys: ["kuveyt türk", "kuveyt turk", "kuveyttürk", "kuveytturk"],
    theme: {
      primary: "#007a3d",
      secondary: "#005b2e",
      accent: "#d7a900",
      soft: "#edf9f2",
      card: "linear-gradient(145deg, #ffffff 0%, #eefaf3 58%, #fff9de 100%)",
      row: "linear-gradient(145deg, #ffffff 0%, #f0faf4 100%)",
      text: "#003c24"
    }
  },
  {
    keys: ["emlak katılım", "emlak katilim"],
    theme: {
      primary: "#00a6a6",
      secondary: "#e30613",
      accent: "#006b7a",
      soft: "#edfafa",
      card: "linear-gradient(145deg, #ffffff 0%, #effafa 58%, #fff1f1 100%)",
      row: "linear-gradient(145deg, #ffffff 0%, #effafa 100%)",
      text: "#003c46"
    }
  },
  {
    keys: ["halkbank", "halk bank"],
    theme: {
      primary: "#005baa",
      secondary: "#00a0df",
      accent: "#f58220",
      soft: "#eef7ff",
      card: "linear-gradient(145deg, #ffffff 0%, #eef7ff 58%, #fff4e8 100%)",
      row: "linear-gradient(145deg, #ffffff 0%, #f0f8ff 100%)",
      text: "#003c73"
    }
  }
];

function bankTheme(bankName: string): BankTheme {
  const normalized = bankName.toLocaleLowerCase("tr-TR");
  return bankThemes.find((entry) => entry.keys.some((key) => normalized.includes(key)))?.theme || defaultBankTheme;
}

function bankCardStyle(theme: BankTheme): CSSProperties {
  return {
    "--bank-primary": theme.primary,
    "--bank-secondary": theme.secondary,
    "--bank-accent": theme.accent,
    "--bank-soft": theme.soft,
    "--bank-text": theme.text,
    background: theme.card
  } as CSSProperties;
}

type BankAccountRecord = Parameters<typeof bankAccountFromRecord>[0];
type PublicPolicyRecord = {
  title: string;
  content: string;
  isActive: boolean;
} | null;

async function loadActiveBankAccountRows() {
  const bankAccountClient = (prisma as unknown as {
    bankAccount?: {
      findMany: (args: unknown) => Promise<BankAccountRecord[]>;
    };
  }).bankAccount;

  if (!bankAccountClient) return [];

  return bankAccountClient.findMany({
    where: { isActive: true },
    select: {
      id: true,
      bank: true,
      sortOrder: true,
      logoUrl: true,
      branch: true,
      accountName: true,
      type: true,
      description: true,
      tlIban: true,
      dolarIban: true,
      euroIban: true,
      isActive: true
    },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" }
    ]
  }).catch(() => []);
}

const getActiveBankAccountRows = unstable_cache(loadActiveBankAccountRows, ["active-bank-accounts"], {
  revalidate: 300,
  tags: ["bank-accounts"]
});

const getPublicPolicyPage = unstable_cache(async (slug: string): Promise<PublicPolicyRecord> => {
  return prisma.policyPage.findUnique({
    where: { slug },
    select: {
      title: true,
      content: true,
      isActive: true
    }
  }).catch(() => null);
}, ["public-policy-page"], {
  revalidate: 300,
  tags: ["policy-pages"]
});

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const isBankPage = slug === "hesap-numaralarimiz";
  const dbPolicy = await getPublicPolicyPage(slug);
  const fallback = fallbackPolicies[slug];
  if (!dbPolicy && !fallback) notFound();
  if (dbPolicy && !dbPolicy.isActive && !isBankPage) notFound();

  const title = dbPolicy?.title || fallback?.title || "Hayat Ağacı Derneği";
  const content = dbPolicy?.content || fallback?.content || "";
  const label = fallback?.label || "Hayat Ağacı Derneği";
  const bankContent = isBankPage ? parseBankAccountsContent(content) : null;
  const bankRows = isBankPage ? await getActiveBankAccountRows() : [];
  const bankAccounts = (bankRows.length ? bankRows.map(bankAccountFromRecord) : bankContent?.accounts.length ? bankContent.accounts : defaultBankAccounts)
    .filter((account) => visibleIbans(account).length > 0);
  const displayContent = isBankPage ? bankContent?.note : content;

  if (isBankPage) {
    const bankNote = displayContent?.trim() || fallback?.content || "";

    return (
      <>
        <Header />
        <main className="bg-[#f4f7fa]">
          <section className="border-b border-[#e3eaf0] bg-white px-4 py-8 sm:py-12">
            <div className="mx-auto flex max-w-[1500px] flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-hayat-green">Bağış Hesapları</p>
                <h1 className="mt-3 text-[32px] font-black leading-tight text-hayat-dark sm:text-[44px] md:text-[52px]">Hesap Numaralarımız</h1>
                {bankNote && <p className="mt-4 max-w-2xl whitespace-pre-line text-base font-semibold leading-7 text-[#4f6370] sm:text-lg sm:leading-8">{bankNote}</p>}
              </div>
              <div className="flex w-full items-center gap-4 rounded-[18px] border border-[#dbe6ee] bg-[#f7fafc] px-5 py-4 sm:w-auto">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-hayat-dark text-white">
                  <ShieldCheck size={24} />
                </span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6b7f8c]">Alıcı / Hesap Sahibi</p>
                  <p className="mt-0.5 text-lg font-black text-hayat-dark">Hayat Ağacı Derneği</p>
                </div>
              </div>
            </div>
          </section>

          <section className="px-4 py-8 sm:py-12">
            <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
              {bankAccounts.map((account, accountIndex) => {
                const logoUrl = normalizeMediaUrl(account.logoUrl) || account.logoUrl;
                const ibans = visibleIbans(account);
                const theme = bankTheme(account.bank);

                return (
                  <article key={`${account.bank}-${accountIndex}`} className="relative flex flex-col overflow-hidden rounded-[20px] border border-[#e1e8ee] bg-white shadow-[0_12px_32px_rgba(10,58,85,0.07)]" style={{ ...bankCardStyle(theme), background: "#ffffff" }}>
                    <span className="h-1.5 w-full bg-[color:var(--bank-primary)]" aria-hidden="true" />
                    <div className="flex flex-1 flex-col p-4 sm:p-6">
                      <div className="flex items-center gap-4">
                        {logoUrl && (
                          <img src={optimizedImageSrc(logoUrl, 128)} alt={account.bank || "Banka logosu"} loading="lazy" decoding="async" className="h-14 w-14 shrink-0 rounded-[14px] border border-[#e1e8ee] bg-white object-contain p-2" />
                        )}
                        <div className="min-w-0 flex-1">
                          <h2 className="text-xl font-black leading-tight text-hayat-dark sm:text-[22px]">{account.bank || "Banka Bilgisi"}</h2>
                          {account.branch && <p className="mt-1 text-sm font-semibold text-[#5d6f7b]">{account.branch}</p>}
                        </div>
                        {account.type && (
                          <span className="shrink-0 rounded-full bg-[color:var(--bank-soft)] px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-[color:var(--bank-text)] ring-1 ring-[color:var(--bank-primary)]/20">
                            {account.type}
                          </span>
                        )}
                      </div>

                      {account.description && (
                        <p className="mt-4 rounded-[12px] border border-[color:var(--bank-primary)]/25 bg-[color:var(--bank-soft)] px-4 py-2.5 text-center text-sm font-black uppercase tracking-wide text-[color:var(--bank-text)]">
                          {account.description}
                        </p>
                      )}

                      <div className="mt-5 divide-y divide-[#edf1f4] rounded-[16px] border border-[#e6edf2] bg-[#fafcfd]">
                        {ibans.map((iban, ibanIndex) => (
                          <div key={`${account.bank}-${iban.label}-${ibanIndex}`} className="px-3.5 py-3.5 sm:px-4">
                            <div className="flex items-center gap-3">
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--bank-primary)] text-white [&_span]:!text-[17px] [&_svg]:h-[18px] [&_svg]:w-[18px]">
                                <CurrencyIcon label={iban.label} />
                              </span>
                              <p className="flex-1 text-xs font-black uppercase tracking-[0.14em] text-[#5d6f7b]">{ibanCurrencyLabel(iban.label, ibans.length === 1)}</p>
                              <CopyIbanButton value={iban.iban} label={`${ibanCurrencyLabel(iban.label, ibans.length === 1)} IBAN'ını kopyala`} />
                            </div>
                            <p className="mt-2 overflow-x-auto whitespace-nowrap font-mono text-[15px] font-bold min-[380px]:text-[16px] tabular-nums leading-8 tracking-[-0.02em] text-[#0b1f33] [scrollbar-width:none] sm:text-[18px] sm:tracking-normal [&::-webkit-scrollbar]:hidden">{iban.iban}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mx-auto mt-8 flex max-w-[1500px] items-start gap-4 rounded-[18px] border border-[#dbe6ee] bg-white px-5 py-5 sm:px-6">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-hayat-mint text-hayat-green">
                <Info size={20} />
              </span>
              <p className="text-sm font-semibold leading-7 text-[#4f6370] sm:text-base">
                Havale / EFT yaparken açıklama kısmına <strong className="font-black text-hayat-dark">bağış türünü</strong> (Zekat, Fitre, Kurban vb.) ve <strong className="font-black text-hayat-dark">adınızı</strong> yazmanız, bağışınızın doğru kaydedilmesi için yeterlidir.
              </p>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-hayat-soft px-3 py-12 sm:px-4 lg:px-4">
        <article className="mx-auto max-w-[1840px]">
          <p className="text-[13px] font-black uppercase text-hayat-green">{label}</p>
          <h1 className="mt-3 max-w-4xl text-[34px] font-black leading-tight text-hayat-dark sm:text-[44px] md:text-[52px]">{title}</h1>
          {displayContent && (
            <div className="mt-8 rounded-[20px] border border-hayat-border bg-white p-6 text-base font-semibold leading-8 text-[#5d6b70] shadow-stk sm:p-8">
              <p className="whitespace-pre-line">{displayContent}</p>
              {["kvkk", "kullanim-kosullari-ve-gizlilik-politikasi", "iade-politikasi"].includes(slug) && (
                <div className="mt-8 border-t border-[#d9e5ec] pt-6">
                  <PolicyAcceptButton />
                </div>
              )}
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
