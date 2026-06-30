import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CopyIbanButton } from "@/components/CopyIbanButton";
import { prisma } from "@/lib/prisma";
import { defaultBankAccounts, parseBankAccountsContent, type BankAccount } from "@/lib/bank-accounts";
import { normalizeMediaUrl } from "@/lib/media-url";
import { DollarSign, Euro } from "lucide-react";

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
          <section className="bg-hayat-soft px-3 py-14 sm:px-4 lg:px-4 lg:py-20">
            <div className="mx-auto max-w-[1840px]">
              <p className="text-[13px] font-black uppercase tracking-wider text-hayat-green">{label}</p>
              <h1 className="mt-4 max-w-4xl text-[34px] font-black leading-tight text-hayat-dark sm:text-[44px] md:text-[52px]">{title}</h1>
              {displayContent && (
                <p className="mt-5 max-w-3xl whitespace-pre-line text-lg font-semibold leading-9 text-[#5d6b70]">
                  {displayContent}
                </p>
              )}
            </div>
          </section>

          <section className="bg-[#f5f9fc] px-3 py-10 sm:px-4 lg:px-4">
            <div className="mx-auto grid max-w-[1840px] gap-5 md:grid-cols-2 xl:grid-cols-3">
              {bankAccounts.map((account, accountIndex) => {
                const logoUrl = normalizeMediaUrl(account.logoUrl) || account.logoUrl;
                const ibans = visibleIbans(account);

                return (
                  <article key={`${account.bank}-${accountIndex}`} className="rounded-[22px] border border-[#d6e1ec] bg-white p-5 shadow-[0_18px_48px_rgba(10,58,85,0.1)]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        {logoUrl && (
                          <img src={logoUrl} alt={account.bank || "Banka logosu"} loading="lazy" decoding="async" className="h-14 w-14 shrink-0 rounded-[14px] border border-[#d6e1ec] bg-white object-contain p-2 shadow-[0_10px_24px_rgba(10,58,85,0.08)]" />
                        )}
                        <div className="min-w-0 flex-1">
                          <h2 className="text-xl font-black leading-tight text-[#061b55] sm:text-2xl">{account.bank || "Banka Bilgisi"}</h2>
                          {account.branch && <p className="mt-1 text-sm font-semibold text-[#334b5f]">{account.branch}</p>}
                        </div>
                      </div>
                      {account.type && (
                        <span className="w-fit shrink-0 rounded-full bg-hayat-mint px-3 py-1.5 text-xs font-black text-hayat-green">
                          {account.type}
                        </span>
                      )}
                    </div>

                    {account.description && (
                      <p className="mt-4 rounded-[14px] bg-hayat-soft px-4 py-3 text-sm font-semibold leading-6 text-[#5d6b70]">
                        {account.description}
                      </p>
                    )}

                    <div className="mt-4 space-y-2.5">
                      {ibans.map((iban, ibanIndex) => (
                        <div key={`${account.bank}-${iban.label}-${ibanIndex}`} className="flex min-w-0 flex-col rounded-[16px] border border-[#d6e1ec] bg-white px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                          <div className="flex items-center gap-3">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#061b55] text-white shadow-[0_0_0_6px_#eef3f7]">
                              <CurrencyIcon label={iban.label} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-black tracking-wide text-[#061b55]">{ibanCurrencyLabel(iban.label, ibans.length === 1)}</p>
                              <span className="mt-2 block h-px w-full bg-[#d6e1ec]" />
                            </div>
                          </div>
                          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="min-w-0 break-all font-mono text-[15px] font-black leading-6 tracking-wide text-[#06122e]">{iban.iban}</p>
                            <CopyIbanButton value={iban.iban} label="IBAN Kopyala" className="min-h-10 w-full justify-center rounded-[12px] bg-gradient-to-br from-[#1977dc] to-[#0747ad] px-4 text-xs shadow-[0_10px_18px_rgba(25,119,220,0.16)] hover:from-hayat-green hover:to-hayat-green sm:w-auto sm:min-w-[132px]" />
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
