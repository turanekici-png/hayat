import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CopyIbanButton } from "@/components/CopyIbanButton";
import { prisma } from "@/lib/prisma";
import { defaultBankAccounts, parseBankAccountsContent } from "@/lib/bank-accounts";
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
    title: "Hesap Numaralarımız",
    label: "Banka ve Hesap Bilgileri",
    content: "Banka hesap bilgileri yönetim panelinden güncellenebilir."
  }
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const bankAccounts = bankContent?.accounts.length ? bankContent.accounts : defaultBankAccounts;
  const displayContent = isBankPage ? bankContent?.note : content;

  return (
    <>
      <Header />
      <main className="bg-hayat-soft px-3 py-12 sm:px-4 lg:px-4">
        <article className="mx-auto max-w-[1840px]">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[13px] font-black uppercase text-hayat-green">{label}</p>
              <h1 className="mt-3 max-w-4xl text-[34px] font-black leading-tight text-hayat-dark sm:text-[44px] md:text-[52px]">{title}</h1>
            </div>
            {isBankPage && (
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[14px] bg-hayat-mint text-hayat-green">
                <Building2 size={26} />
              </div>
            )}
          </div>

          {displayContent && (
            <div className="mt-8 rounded-[20px] border border-hayat-border bg-white p-6 text-base font-semibold leading-8 text-[#5d6b70] shadow-stk sm:p-8">
              <p className="whitespace-pre-line">{displayContent}</p>
            </div>
          )}

          {isBankPage && (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {bankAccounts.map((account, accountIndex) => {
                const logoUrl = normalizeMediaUrl(account.logoUrl) || account.logoUrl;
                return (
                  <section key={`${account.bank}-${accountIndex}`} className="overflow-hidden rounded-[20px] border border-hayat-border bg-white shadow-stk">
                    <div className="flex flex-col gap-4 border-b border-hayat-border p-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        {logoUrl ? (
                          <img src={logoUrl} alt={account.bank} loading="lazy" decoding="async" className="h-14 w-14 rounded-[14px] border border-hayat-border bg-white object-contain p-2" />
                        ) : (
                          <div className="grid h-14 w-14 place-items-center rounded-[14px] bg-hayat-mint text-hayat-green">
                            <Building2 size={24} />
                          </div>
                        )}
                        <div>
                          <h2 className="text-2xl font-black text-hayat-dark">{account.bank || "Banka Bilgisi"}</h2>
                          {account.type && <p className="mt-1 text-sm font-black uppercase text-hayat-green">{account.type}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-6">
                      {(account.accountName || account.branch || account.description) && (
                        <div className="grid gap-3 rounded-[14px] bg-hayat-soft p-4 text-sm font-bold text-[#5d6b70] sm:grid-cols-2">
                          {account.accountName && <p><span className="block text-[11px] font-black uppercase text-hayat-dark">Hesap Adı</span>{account.accountName}</p>}
                          {account.branch && <p><span className="block text-[11px] font-black uppercase text-hayat-dark">Şube</span>{account.branch}</p>}
                          {account.description && <p className="sm:col-span-2"><span className="block text-[11px] font-black uppercase text-hayat-dark">Açıklama</span>{account.description}</p>}
                        </div>
                      )}

                      {account.ibans.map((iban, ibanIndex) => (
                        <div key={`${account.bank}-${iban.label}-${ibanIndex}`} className="flex flex-col gap-3 rounded-[14px] border border-hayat-border p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase text-hayat-green">{iban.label}</p>
                            <p className="mt-1 break-all font-black text-hayat-dark">{iban.iban || "Henüz eklenmedi"}</p>
                          </div>
                          {iban.iban && <CopyIbanButton value={iban.iban} />}
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
