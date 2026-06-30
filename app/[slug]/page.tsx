import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CopyIbanButton } from "@/components/CopyIbanButton";
import { prisma } from "@/lib/prisma";
import { defaultBankAccounts, parseBankAccountsContent, type BankAccount } from "@/lib/bank-accounts";
import { normalizeMediaUrl } from "@/lib/media-url";
import { DollarSign, Euro } from "lucide-react";
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
  return <span className="text-[30px] font-black leading-none">₺</span>;
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

function bankRowStyle(theme: BankTheme): CSSProperties {
  return {
    background: theme.row,
    borderColor: `${theme.primary}33`
  };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dbPolicy = await prisma.policyPage.findUnique({ where: { slug } }).catch(() => null);
  const fallback = fallbackPolicies[slug];
  if (!dbPolicy && !fallback) notFound();
  if (dbPolicy && !dbPolicy.isActive) notFound();

  const title = dbPolicy?.title || fallback?.title || "Hayat Ağacı Derneği";
  const content = dbPolicy?.content || fallback?.content || "";
  const label = fallback?.label || "Hayat Ağacı Derneği";
  const isBankPage = slug === "hesap-numaralarimiz";
  const bankContent = isBankPage ? parseBankAccountsContent(content) : null;
  const bankAccounts = (bankContent?.accounts.length ? bankContent.accounts : defaultBankAccounts)
    .filter((account) => visibleIbans(account).length > 0);
  const displayContent = isBankPage ? bankContent?.note : content;

  if (isBankPage) {
    return (
      <>
        <Header />
        <main className="bg-white">
          <section className="bg-hayat-soft px-3 py-8 sm:px-4 lg:px-4">
            <div className="mx-auto max-w-[1840px]">
              <h1 className="text-[34px] font-black leading-tight text-hayat-dark sm:text-[44px] md:text-[52px]">Hesap Numaralarımız</h1>
            </div>
          </section>

          <section className="bg-[#f5f9fc] px-3 py-8 sm:px-4 lg:px-4">
            <div className="mx-auto grid max-w-[1840px] gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {bankAccounts.map((account, accountIndex) => {
                const logoUrl = normalizeMediaUrl(account.logoUrl) || account.logoUrl;
                const ibans = visibleIbans(account);
                const theme = bankTheme(account.bank);

                return (
                  <article key={`${account.bank}-${accountIndex}`} className="rounded-[22px] border border-[color:var(--bank-primary)]/25 p-5 shadow-[0_18px_48px_rgba(10,58,85,0.1)] ring-1 ring-white" style={bankCardStyle(theme)}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        {logoUrl && (
                          <img src={logoUrl} alt={account.bank || "Banka logosu"} loading="lazy" decoding="async" className="h-14 w-14 shrink-0 rounded-[14px] border border-[color:var(--bank-primary)]/25 bg-white object-contain p-2 shadow-[0_10px_24px_rgba(10,58,85,0.08)]" />
                        )}
                        <div className="min-w-0 flex-1">
                          <h2 className="text-xl font-black leading-tight text-[color:var(--bank-text)] sm:text-2xl">{account.bank || "Banka Bilgisi"}</h2>
                          {account.branch && <p className="mt-1 text-sm font-semibold text-[#334b5f]">{account.branch}</p>}
                        </div>
                      </div>
                      {account.type && (
                        <span className="w-fit shrink-0 rounded-full bg-[color:var(--bank-soft)] px-3 py-1.5 text-xs font-black text-[color:var(--bank-primary)] ring-1 ring-[color:var(--bank-primary)]/15">
                          {account.type}
                        </span>
                      )}
                    </div>

                    {account.description && (
                      <p className="mt-4 rounded-[14px] bg-[color:var(--bank-primary)] px-4 py-3 text-center text-base font-black uppercase leading-6 tracking-wide text-white shadow-[0_14px_28px_rgba(10,58,85,0.16)]">
                        {account.description}
                      </p>
                    )}

                    <div className="mt-3 space-y-2">
                      {ibans.map((iban, ibanIndex) => (
                        <div key={`${account.bank}-${iban.label}-${ibanIndex}`} className="flex min-w-0 flex-col rounded-[16px] border px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_24px_rgba(10,58,85,0.05)]" style={bankRowStyle(theme)}>
                          <div className="flex items-center gap-3">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[color:var(--bank-primary)] text-white shadow-[0_0_0_6px_var(--bank-soft)]">
                              <CurrencyIcon label={iban.label} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-black tracking-wide text-[color:var(--bank-text)]">{ibanCurrencyLabel(iban.label, ibans.length === 1)}</p>
                              <span className="mt-2 block h-px w-full bg-[color:var(--bank-primary)]/20" />
                            </div>
                          </div>
                          <div className="mt-2.5 flex min-w-0 items-center gap-2">
                            <p className="min-w-0 flex-1 whitespace-nowrap font-mono text-[14px] font-black leading-6 tracking-wide text-[#06122e]">{iban.iban}</p>
                            <CopyIbanButton value={iban.iban} label="IBAN Kopyala" iconOnly className="h-9 w-9 justify-center rounded-[10px] bg-[color:var(--bank-primary)] p-0 shadow-[0_10px_18px_rgba(10,58,85,0.16)] hover:bg-[color:var(--bank-secondary)] [&_svg]:h-4 [&_svg]:w-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
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
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
