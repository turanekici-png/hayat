import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ClipboardCheck, HeartHandshake, ShieldCheck } from "lucide-react";
import { ApplicationForm } from "@/components/ApplicationForm";
import Link from "next/link";


export default function ApplicationPage() {
  return (
    <>
      <Header />
      <main className="bg-hayat-soft">
        <section className="relative overflow-hidden bg-hayat-dark px-3 py-20 text-white sm:px-4 lg:px-4">
          <div className="relative mx-auto grid max-w-[1840px] items-center gap-10 md:grid-cols-[1fr_.8fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-[.18em] text-hayat-gold"><HeartHandshake size={18} /> Online başvuru</p>
              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight md:text-6xl">Yardım başvurunuzu güvenli şekilde bize ulaştırın.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">Formu doldurduğunuzda bilgileriniz veritabanına kaydedilir ve dernek yetkilileri başvurunuzu yönetim panelinden takip eder.</p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-white/80">
                <span className="rounded-full bg-white/10 px-4 py-2">Başvuru kaydı</span>
                <span className="rounded-full bg-white/10 px-4 py-2">Durum takibi</span>
                <span className="rounded-full bg-white/10 px-4 py-2">Admin inceleme</span>
              </div>
            </div>
            <div className="rounded-[20px] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <ShieldCheck className="text-hayat-gold" size={44} />
              <h2 className="mt-5 text-2xl font-black">Başvurular tek yerde toplanır</h2>
              <p className="mt-3 leading-7 text-white/70">Ad soyad, telefon, adres, hane bilgisi, gelir durumu, yardım türü ve açıklama alanları kayıt altına alınır.</p>
              <Link href="/admin/basvurular" className="mt-6 inline-flex rounded-[14px] bg-hayat-gold px-5 py-3 font-black text-hayat-dark">Başvuruları Yönet</Link>
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
              <div className="rounded-[14px] border border-hayat-border bg-hayat-soft p-4">2. Başvuru veritabanına kaydedilir.</div>
              <div className="rounded-[14px] border border-hayat-border bg-hayat-soft p-4">3. Admin panelde incelenir.</div>
            </div>
          </aside>

          <ApplicationForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
