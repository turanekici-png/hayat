import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ClipboardCheck, HeartHandshake, Lock, SearchCheck } from "lucide-react";
import { ApplicationForm } from "@/components/ApplicationForm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { areApplicationsOpen, getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

function pointsToThisPage(url: string) {
  try {
    return new URL(url, "http://site.local").pathname.replace(/\/+$/, "") === "/basvuru";
  } catch {
    return false;
  }
}

export default async function ApplicationPage() {
  // Acik/kapali bilgisi onbellege takilmadan okunur: admin kapattigi anda form kapanir.
  const [isOpen, settings] = await Promise.all([areApplicationsOpen(), getSiteSettings()]);

  if (!isOpen) {
    return (
      <>
        <Header />
        <main className="bg-hayat-soft px-3 py-16 sm:px-4 lg:py-24">
          <section className="mx-auto max-w-2xl rounded-[24px] border border-hayat-border bg-white p-8 text-center shadow-stk sm:p-12">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-hayat-dark"><Lock size={30} /></span>
            <h1 className="mt-6 text-3xl font-black text-hayat-dark sm:text-4xl">Online yardım başvuruları şu an kapalı</h1>
            <p className="mt-4 text-lg leading-8 text-[#5d6b70]">Başvuru dönemi açıldığında bu sayfadan ve sitemizdeki duyurulardan başvuru yapabilirsiniz.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/basvuru-takip" className="inline-flex h-12 items-center gap-2 rounded-xl bg-hayat-dark px-6 font-black text-white"><SearchCheck size={18} /> Mevcut Başvurumu Sorgula</Link>
              <Link href="/iletisim" className="inline-flex h-12 items-center rounded-xl border-2 border-hayat-dark px-6 font-black text-hayat-dark">İletişim</Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  // Admin harici bir basvuru linki verdiyse butonlar zaten oraya gider; bu adrese gelen de yonlendirilir.
  // (Link sitenin kendi /basvuru adresiyse yonlendirme yapilmaz; aksi halde sonsuz dongu olur.)
  if (settings.applicationUrl && !pointsToThisPage(settings.applicationUrl)) {
    redirect(settings.applicationUrl);
  }

  return (
    <>
      <Header />
      <main className="bg-hayat-soft">
        <section className="relative overflow-hidden bg-hayat-dark px-3 py-20 text-white sm:px-4 lg:px-4">
          <div className="relative mx-auto grid max-w-[1840px] items-center gap-10 md:grid-cols-[1fr_.8fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-[.18em] text-hayat-gold"><HeartHandshake size={18} /> Online başvuru</p>
              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight md:text-6xl">Yardım başvurunuzu güvenli şekilde bize ulaştırın.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">Formu doldurduğunuzda başvurunuz kayıt altına alınır ve dernek yetkililerimiz tarafından incelenir. Gerekli durumlarda sizinle telefonla iletişime geçilir.</p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-white/80">
                <span className="rounded-full bg-white/10 px-4 py-2">Başvuru kaydı</span>
                <span className="rounded-full bg-white/10 px-4 py-2">Durum takibi</span>
                <span className="rounded-full bg-white/10 px-4 py-2">Yetkili inceleme</span>
              </div>
            </div>
            <div className="rounded-[20px] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <SearchCheck className="text-hayat-gold" size={44} />
              <h2 className="mt-5 text-2xl font-black">Başvurunuzu takip edin</h2>
              <p className="mt-3 leading-7 text-white/70">Başvurunuz tamamlandığında size bir başvuru numarası verilir. Bu numara ile başvurunuzun durumunu dilediğiniz zaman sorgulayabilirsiniz.</p>
              <Link href="/basvuru-takip" className="mt-6 inline-flex rounded-[14px] bg-hayat-gold px-5 py-3 font-black text-hayat-dark">Başvuru Durumu Sorgula</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1840px] gap-8 px-3 py-14 sm:px-4 lg:grid-cols-[.75fr_1.25fr] lg:px-4">
          <aside className="h-fit rounded-[20px] border border-hayat-border bg-white p-7 shadow-stk lg:sticky lg:top-24">
            <ClipboardCheck className="text-hayat-green" size={42} />
            <h2 className="mt-5 text-2xl font-black text-hayat-dark">Başvuru Bilgilendirmesi</h2>
            <p className="mt-3 leading-7 text-[#5d6b70]">Lütfen iletişim bilgilerini doğru girin. Yetkililerimiz gerekirse telefonla dönüş yapacaktır.</p>
            <div className="mt-6 space-y-3 text-sm font-bold text-[#5d6b70]">
              <div className="rounded-[14px] border border-hayat-border bg-hayat-soft p-4">1. Bilgiler forma girilir.</div>
              <div className="rounded-[14px] border border-hayat-border bg-hayat-soft p-4">2. Başvurunuz kaydedilir, size başvuru numarası verilir.</div>
              <div className="rounded-[14px] border border-hayat-border bg-hayat-soft p-4">3. Yetkililerimiz başvurunuzu inceler.</div>
            </div>
          </aside>

          <ApplicationForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
