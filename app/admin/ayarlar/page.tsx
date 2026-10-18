import Link from "next/link";
import { BadgeCheck, Building2, ClipboardList, Eye, HandCoins, Phone, Save, Share2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "../AdminShell";
import { saveSiteSettings } from "./actions";
import { defaultSiteSettings, parseDonationImpacts } from "@/lib/site-settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[15px] font-semibold text-slate-800 outline-none transition focus:border-hayat-blue focus:ring-4 focus:ring-hayat-blue/10";
const labelClass = "block text-sm font-bold text-slate-600";
const defaultImpactAmounts = [100, 250, 500, 1000];

function Card({ icon: Icon, title, description, children }: { icon: typeof Building2; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-hayat-dark text-white"><Icon size={19} /></span>
        <div>
          <h2 className="text-lg font-black text-hayat-dark">{title}</h2>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default async function SiteSettingsPage({ searchParams }: { searchParams: Promise<{ kaydedildi?: string }> }) {
  const params = await searchParams;
  const row = await prisma.siteSettings.findUnique({ where: { id: "default" } }).catch(() => null);
  const value = (key: keyof typeof defaultSiteSettings) => (row?.[key] ?? defaultSiteSettings[key] ?? "") as string;
  const impacts = parseDonationImpacts(row?.donationImpacts);
  const impactRows = [...new Set([...defaultImpactAmounts, ...Object.keys(impacts).map(Number)])].sort((a, b) => a - b).slice(0, 6);

  return (
    <AdminShell activePath="/admin/ayarlar" contentClassName="max-w-5xl">
      <div className="mb-6 rounded-2xl bg-hayat-dark p-6 text-white shadow-soft">
        <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[#a9d47a]">
          <Building2 size={17} /> Site Ayarları
        </p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Kurumsal bilgiler</h1>
        <p className="mt-2 max-w-2xl text-white/75">Üst bilgi şeridi, footer, iletişim bilgileri, sosyal medya bağlantıları ve Hızlı Bağış kutusundaki tutar açıklamaları buradan yönetilir.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/admin" className="rounded-xl bg-white/10 px-5 py-3 font-black">Admin Panele Dön</Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-hayat-dark">
            <Eye size={16} /> Siteyi Gör
          </Link>
        </div>
      </div>

      {params.kaydedildi && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-black text-green-800" role="status">
          <BadgeCheck size={18} /> Ayarlar kaydedildi. Değişiklikler sitede birkaç saniye içinde görünür.
        </div>
      )}

      <form action={saveSiteSettings} className="grid gap-5">
        <Card icon={ClipboardList} title="Online Yardım Başvurusu" description="Açıkken sitede belirgin bir “Yardım Başvurusu” butonu görünür. Kapalıyken butonlar gizlenir, başvuru sayfası kapalı mesajı gösterir ve hiçbir şekilde başvuru alınmaz.">
          <div className="grid gap-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <input type="checkbox" name="applicationsEnabled" defaultChecked={row?.applicationsEnabled ?? true} className="mt-1 h-5 w-5 accent-hayat-green" />
              <span>
                <span className="block font-black text-hayat-dark">Online başvuru açık</span>
                <span className="mt-0.5 block text-sm font-semibold text-slate-500">İşareti kaldırıp kaydederseniz başvurular hemen kapanır.</span>
              </span>
            </label>
            <label className={labelClass}>Başvuru Linki (opsiyonel)
              <input name="applicationUrl" defaultValue={row?.applicationUrl || ""} placeholder="Örn: https://forms.gle/... veya https://hayatder.org.tr/basvuru" className={inputClass} />
              <span className="mt-1.5 block text-xs font-semibold text-slate-500">Boş bırakılırsa sitedeki başvuru formu (/basvuru) kullanılır. Doluysa tüm “Yardım Başvurusu” butonları bu linke gider.</span>
            </label>
          </div>
        </Card>

        <Card icon={Building2} title="Kurum Bilgileri" description="Sitenin en üstündeki ince bilgi şeridinde görünür.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>Dernek Kütük No
              <input name="registryNo" defaultValue={value("registryNo")} placeholder="Örn: 58-000-000" className={inputClass} />
            </label>
            <label className={labelClass}>İştirak / Kurum Notu
              <input name="affiliationNote" defaultValue={value("affiliationNote")} placeholder="Örn: Sivas Belediyesi İştirakidir" className={inputClass} />
            </label>
          </div>
        </Card>

        <Card icon={Phone} title="İletişim" description="Üst şerit ve footer'daki iletişim bilgileri.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>Telefon
              <input name="phone" defaultValue={value("phone")} className={inputClass} />
            </label>
            <label className={labelClass}>E-posta
              <input name="email" type="email" defaultValue={value("email")} className={inputClass} />
            </label>
            <label className={`${labelClass} md:col-span-2`}>Adres
              <input name="address" defaultValue={value("address")} className={inputClass} />
            </label>
            <label className={`${labelClass} md:col-span-2`}>Footer Tanıtım Metni
              <textarea name="footerAbout" defaultValue={value("footerAbout")} rows={3} className={`${inputClass} leading-relaxed`} />
            </label>
          </div>
        </Card>

        <Card icon={Share2} title="Sosyal Medya" description="Boş bırakılan hesabın ikonu footer'da gösterilmez.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>Facebook<input name="facebookUrl" defaultValue={value("facebookUrl")} placeholder="https://facebook.com/..." className={inputClass} /></label>
            <label className={labelClass}>Instagram<input name="instagramUrl" defaultValue={value("instagramUrl")} placeholder="https://instagram.com/..." className={inputClass} /></label>
            <label className={labelClass}>X (Twitter)<input name="twitterUrl" defaultValue={value("twitterUrl")} placeholder="https://x.com/..." className={inputClass} /></label>
            <label className={labelClass}>YouTube<input name="youtubeUrl" defaultValue={value("youtubeUrl")} placeholder="https://youtube.com/@..." className={inputClass} /></label>
          </div>
        </Card>

        <Card icon={HandCoins} title="Hızlı Bağış – Tutar Karşılıkları" description="Ana sayfadaki bağış kutusunda tutar seçilince altında görünen açıklama. Örn: 500 ₺ → “bir ailenin aylık gıda kolisi”. Boş bırakılan satır gösterilmez.">
          <div className="grid gap-3">
            {impactRows.map((amount, index) => (
              <div key={`${amount}-${index}`} className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                <label className={labelClass}>Tutar (₺)
                  <input name="impactAmount" inputMode="numeric" defaultValue={amount} className={inputClass} />
                </label>
                <label className={labelClass}>Karşılığı
                  <input name="impactText" defaultValue={impacts[amount] || ""} placeholder="Örn: bir ailenin aylık gıda kolisi" className={inputClass} />
                </label>
              </div>
            ))}
          </div>
        </Card>

        <div className="sticky bottom-3 z-10 flex justify-end">
          <button className="inline-flex items-center gap-2 rounded-xl bg-hayat-green px-7 py-3.5 font-black text-white shadow-green transition hover:bg-hayat-blue">
            <Save size={18} /> Ayarları Kaydet
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
