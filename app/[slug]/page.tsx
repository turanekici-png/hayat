import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { prisma } from "@/lib/prisma";

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
    content: "Bu alan yönetim panelindeki KVKK / Politikalar bölümünden banka adı, hesap adı, IBAN ve açıklama bilgileriyle güncellenmelidir."
  }
};

const fallbackBankAccounts = [
  { bank: "T.C. Ziraat Bankası", branch: "Sivas Merkez Şubesi", iban: "TR12 0001 0000 0000 0000 0000 01", type: "Genel Bağış" },
  { bank: "VakıfBank", branch: "Sivas Şubesi", iban: "TR34 0001 5000 0000 0000 0000 02", type: "Zekat & Fitre" },
  { bank: "Halkbank", branch: "Sivas Şubesi", iban: "TR56 0001 2000 0000 0000 0000 03", type: "Kurban" }
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dbPolicy = await prisma.policyPage.findUnique({ where: { slug } }).catch(() => null);
  const fallback = fallbackPolicies[slug];
  if (!dbPolicy && !fallback) notFound();
  if (dbPolicy && !dbPolicy.isActive) notFound();

  const title = dbPolicy?.title || fallback.title;
  const content = dbPolicy?.content || fallback.content;
  const label = fallback?.label || "Hayat Ağacı Derneği";
  const isBankPage = slug === "hesap-numaralarimiz";

  return (
    <>
      <Header />
      <main className="bg-hayat-soft px-4 py-12 sm:px-6">
        <article className="mx-auto max-w-[1180px]">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[13px] font-black uppercase text-hayat-green">{label}</p>
              <h1 className="mt-3 max-w-4xl text-[34px] font-black leading-tight text-hayat-dark sm:text-[44px] md:text-[52px]">{title}</h1>
            </div>
            {isBankPage && (
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[14px] bg-hayat-mint text-hayat-green">
                <Building2 size={32} />
              </div>
            )}
          </div>

          {isBankPage && (
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {fallbackBankAccounts.map((account) => (
                <div key={account.iban} className="rounded-[20px] border border-hayat-border bg-white p-6 shadow-stk">
                  <p className="text-xs font-black uppercase text-hayat-green">{account.type}</p>
                  <h2 className="mt-3 text-xl font-black text-hayat-dark">{account.bank}</h2>
                  <p className="mt-1 text-sm font-bold text-[#5d6b70]">{account.branch}</p>
                  <div className="mt-5 rounded-[14px] border border-hayat-border bg-hayat-soft p-4">
                    <p className="text-xs font-black uppercase text-[#5d6b70]">IBAN</p>
                    <p className="mt-2 break-words font-black leading-7 text-hayat-dark">{account.iban}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 whitespace-pre-line rounded-[20px] border border-hayat-border bg-white p-6 text-base font-semibold leading-8 text-[#5d6b70] shadow-stk md:p-8">
            {content}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
