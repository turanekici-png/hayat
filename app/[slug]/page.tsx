import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CopyIbanButton } from "@/components/CopyIbanButton";
import { prisma } from "@/lib/prisma";
import { defaultBankAccounts, parseBankAccountsContent, type BankAccount } from "@/lib/bank-accounts";
import { normalizeMediaUrl } from "@/lib/media-url";

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

          <section className="px-3 py-10 sm:px-4 lg:px-4">
            <div className="mx-auto grid max-w-[1840px] gap-5 md:grid-cols-2 xl:grid-cols-3">
              {bankAccounts.map((account, accountIndex) => {
                const logoUrl = normalizeMediaUrl(account.logoUrl) || account.logoUrl;
                const ibans = visibleIbans(account);

                return (
                  <article key={`${account.bank}-${accountIndex}`} className="rounded-[20px] border border-hayat-border bg-white p-6 shadow-stk">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        {logoUrl && (
                          <img src={logoUrl} alt={account.bank || "Banka logosu"} loading="lazy" decoding="async" className="h-12 w-12 shrink-0 rounded-[12px] border border-hayat-border bg-white object-contain p-1.5" />
                        )}
                        <div className="min-w-0">
                          <h2 className="text-xl font-black leading-tight text-hayat-dark">{account.bank || "Banka Bilgisi"}</h2>
                          {account.branch && <p className="mt-1 text-sm font-semibold text-[#334b5f]">{account.branch}</p>}
                        </div>
                      </div>
                      {account.type && (
                        <span className="shrink-0 rounded-full bg-hayat-mint px-3 py-2 text-xs font-black text-hayat-green">
                          {account.type}
                        </span>
                      )}
                    </div>

                    {account.description && (
                      <p className="mt-4 rounded-[14px] bg-hayat-soft px-4 py-3 text-sm font-semibold leading-6 text-[#5d6b70]">
                        {account.description}
                      </p>
                    )}

                    <div className="mt-5 space-y-3">
                      {ibans.map((iban, ibanIndex) => (
                        <div key={`${account.bank}-${iban.label}-${ibanIndex}`} className="rounded-[14px] border border-hayat-border bg-hayat-soft p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-[#8a928f]">{ibans.length === 1 ? "IBAN" : iban.label.replace(" IBAN", "")}</p>
                          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="min-w-0 break-all font-mono text-sm font-black tracking-wide text-hayat-dark sm:text-base">{iban.iban}</p>
                            <CopyIbanButton value={iban.iban} label="IBAN Kopyala" className="w-full justify-center py-3 text-sm sm:w-auto sm:px-5" />
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
