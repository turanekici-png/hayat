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
      <main className="bg-hayat-soft px-3 py-14 sm:px-4 lg:px-4">
        <article className="mx-auto max-w-5xl rounded-[2rem] bg-white p-6 shadow-soft md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-black uppercase tracking-[.22em] text-hayat-green">{label}</p>
              <h1 className="mt-3 text-4xl font-black text-hayat-dark md:text-6xl">{title}</h1>
            </div>
            {isBankPage && (
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-hayat-mint text-hayat-green">
                <Building2 size={32} />
              </div>
            )}
          </div>
          <div className="mt-8 whitespace-pre-line rounded-[1.5rem] bg-slate-50 p-6 text-lg font-semibold leading-9 text-slate-700 md:p-8">
            {content}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
