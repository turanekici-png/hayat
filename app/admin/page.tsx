import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  createSection,
  createAdminUser,
  createDonationType,
  deleteAdminUser,
  deleteMedia,
  deleteDonationType,
  deleteSection,
  duplicateSection,
  ensureHomepageManagedSections,
  saveGroupLabel,
  savePopupSetting,
  saveStatsSection,
  seedDonationTypes,
  updateDonationType,
  updateDonationTypesBulk,
  updateAdminUser,
  updateSection,
  uploadMedia
} from "./actions";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MediaField } from "./MediaField";
import {
  Building2,
  Bell,
  Copy,
  CreditCard,
  Eye,
  FileText,
  Heart,
  ImagePlus,
  LayoutDashboard,
  ListOrdered,
  LibraryBig,
  Megaphone,
  Pencil,
  PlusCircle,
  Save,
  Settings2,
  Trash2,
  UploadCloud,
  UserCog,
  Users,
  Video,
  X
} from "lucide-react";
import type { AdminUser, DonationType, MediaAsset, SiteSection, SiteSectionImage } from "@prisma/client";

const sectionTypes = [
  ["CAMPAIGN", "Proje / kampanya"],
  ["VIDEO", "Video blog"],
  ["NEWS", "Haber kartı"],
  ["BLOG", "Blog yazısı"],
  ["STORY", "İyilik hikayesi"],
  ["ABOUT", "Kurumsal bilgi"],
  ["FEATURE", "Hızlı bağış / kısa yol / özellik"],
  ["ACTIVITY", "Faaliyet kartı"],
  ["CTA", "Bağış çağrısı"],
  ["GALLERY", "Galeri"],
  ["CUSTOM", "Özel alan"]
];

const layouts = [
  ["SPLIT", "Görsel ve Metin Yan Yana (Split)"],
  ["BANNER", "Geniş Afiş / Kayan Resim (Banner)"],
  ["MINIMAL", "Sade Başlık Alanı (Minimal)"],
  ["CARD", "Standart İçerik Kartı (Card)"],
  ["GRID", "Kutu Gösterimi (Grid)"]
];
const themes = [["LIGHT", "Beyaz"], ["SOFT", "Açık zemin"], ["DARK", "Mavi"], ["GREEN", "Yeşil"]];
const aligns = [["left", "Sola hizalı"], ["center", "Ortala"], ["right", "Sağa hizalı"], ["justify", "İki yana yasla"]];
const widths = [["narrow", "Dar"], ["normal", "Normal"], ["wide", "Geniş"], ["full", "Tam genişlik"]];
const cardWidths = [["third", "Üçte bir"], ["half", "Yarım"], ["normal", "Normal"], ["wide", "Geniş"], ["full", "Tam satır"]];

const groups = [
  { type: "NEWS", title: "1. Ana Sayfa Haber Kartları", desc: "Ana sayfadaki güncel haber kartları.", icon: Bell },
  { type: "VIDEO", title: "2. Video Blog", desc: "Kapak görseli, video dosyası veya video linkiyle video kartları.", icon: Video },
  { type: "CAMPAIGN", title: "3. Projeler / Kampanyalar", desc: "Ana sayfadaki proje ve kampanya kartları.", icon: Megaphone },
  { type: "BLOG", title: "4. Blog Yazıları", desc: "Ana sayfadaki blog içerikleri.", icon: FileText },
  { type: "STORY", title: "5. İyilik Hikayeleri", desc: "Ana sayfadaki hikaye kartları.", icon: LibraryBig },
  { type: "CTA", title: "6. Bağış Çağrısı", desc: "Ana sayfanın altındaki büyük çağrı alanı.", icon: Bell },
  { type: "ABOUT", title: "7. Kurumsal Bilgiler", desc: "Hakkımızda, misyon, vizyon veya kurumsal metinler.", icon: FileText },
  { type: "FEATURE", title: "8. Hızlı Bağış ve Kısa Yollar", desc: "Hızlı bağış bandı, bağış kısa yolları ve güven kartları.", icon: LibraryBig },
  { type: "ACTIVITY", title: "9. Faaliyetler", desc: "Yardım ve faaliyet kartları.", icon: Megaphone },
  { type: "GALLERY", title: "10. Galeri", desc: "Görsel veya video medya kartları.", icon: LibraryBig },
  { type: "CUSTOM", title: "11. Özel Alanlar", desc: "İhtiyaca göre kullanılabilecek serbest alanlar.", icon: Settings2 }
];

const adminPages = [
  { key: "anasayfa", title: "Ana sayfa alanları", desc: "Haberler, projeler ve diğer ana sayfa bölümleri.", icon: LayoutDashboard },
  { key: "istatistik", title: "Bugüne Kadar", desc: "Ana sayfadaki yeşil istatistik bandını yönet.", icon: ListOrdered },
  { key: "bagis", title: "Online bağış ayarları", desc: "Bağış formundaki türleri ekle, sırala ve aktif/pasif yap.", icon: Heart },
  { key: "kullanicilar", title: "Kullanıcılar", desc: "Admin panel kullanıcılarını ekle, rol ve durumlarını yönet.", icon: UserCog },
  { key: "popup", title: "Popup ayarları", desc: "İlk açılış popup metni, görseli ve butonunu yönet.", icon: Settings2 },
  { key: "medya", title: "Resim / video", desc: "Panelde kullanılacak medya dosyalarını yükle ve sil.", icon: UploadCloud }
];

const otherAdminPages = [
  { href: "/admin/duyurular", title: "Duyurular", icon: Bell },
  { href: "/admin/basvurular", title: "Yardım Başvuruları", icon: Users },
  { href: "/admin/bagislar", title: "Bağış Listesi", icon: ListOrdered },
  { href: "/admin/kurban", title: "Kurban Organizasyonu", icon: Heart },
  { href: "/admin/hesaplar", title: "Hesap Bilgileri", icon: Building2 },
  { href: "/admin/politikalar", title: "KVKK / Politikalar", icon: FileText }
];

function SelectOptions({ items }: { items: string[][] }) {
  return <>{items.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</>;
}

function TypeBadge({ type }: { type: string }) {
  const label = sectionTypes.find(([value]) => value === type)?.[1] || type;
  return <span className="rounded-full bg-hayat-soft px-3 py-1 text-xs font-black text-hayat-blue">{label}</span>;
}

function isVideoMedia(url: string, mimeType?: string | null) {
  return Boolean(mimeType?.startsWith("video/") || /\.(mp4|webm|ogg|mov)$/i.test(url));
}

type PickerMedia = Pick<MediaAsset, "id" | "title" | "url" | "filename" | "mimeType">;
type SiteSectionWithImages = SiteSection & { images: SiteSectionImage[] };

function SectionEditor({ section, media }: { section: SiteSectionWithImages; media: PickerMedia[] }) {
  const isCard = section.layout === "CARD" || section.layout === "GRID";
  const isMediaOnly = section.type === "GALLERY" || section.type === "VIDEO";
  return (
    <details className="group mb-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition-all open:border-hayat-blue/30 open:shadow-md">
      <summary className="flex cursor-pointer list-none flex-col gap-4 border-b border-transparent p-5 transition-colors hover:bg-slate-50 group-open:border-slate-100 group-open:bg-slate-50/50 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-hayat-soft text-xs font-black text-hayat-blue">{section.sortOrder}</span>
            <span className={`rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${isCard ? "bg-slate-100 text-slate-600" : "bg-hayat-blue/10 text-hayat-blue"}`}>
              {isCard ? "İçerik Kartı" : "Ana Afiş / Blok"}
            </span>
            <TypeBadge type={section.type} />
          </div>
          <h3 className="text-xl font-black text-slate-800 group-open:text-hayat-blue">{section.title || "İsimsiz İçerik Bloğu"}</h3>
          {!isMediaOnly && section.customTitle && <p className="mt-1 text-sm font-semibold text-slate-500">Sitede Görünür Başlık: {section.customTitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {section.isActive ? <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-black text-green-700">Aktif</span> : <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-black text-red-700">Pasif</span>}
          <div className="rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-black text-slate-700 transition-colors group-hover:bg-hayat-blue group-hover:text-white group-open:bg-hayat-dark group-open:text-white">Düzenle</div>
        </div>
      </summary>

      <div className="bg-white p-6">
        <form action={updateSection} className="space-y-8">
          <input type="hidden" name="id" value={section.id} />
          <input type="hidden" name="type" value={section.type} />
          
          {/* 1. Temel İçerik Bilgileri */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <h4 className="mb-4 flex items-center gap-2 font-black text-hayat-dark"><FileText className="text-hayat-blue" size={20} /> 1. Temel Bilgiler</h4>
            <div className="grid gap-4 md:grid-cols-12">
              <label className="text-sm font-bold text-slate-600 md:col-span-6">Paneldeki İsim (Sadece siz görürsünüz)<input name="title" defaultValue={section.title} className="mt-1 w-full rounded-xl border border-slate-200 p-3" /></label>
              <label className="text-sm font-bold text-slate-600 md:col-span-6">Sıra Numarası<input name="sortOrder" type="number" defaultValue={section.sortOrder} className="mt-1 w-full rounded-xl border border-slate-200 p-3" /></label>
              {!isMediaOnly && (
                <>
                  <label className="text-sm font-bold text-slate-600 md:col-span-4">Sitedeki Görünür Başlık<input name="customTitle" defaultValue={section.customTitle || ""} className="mt-1 w-full rounded-xl border border-slate-200 p-3" /></label>
                  <label className="text-sm font-bold text-slate-600 md:col-span-4">Üst Başlık (Subtitle)<input name="subtitle" defaultValue={section.subtitle || ""} className="mt-1 w-full rounded-xl border border-slate-200 p-3" /></label>
                  <label className="text-sm font-bold text-slate-600 md:col-span-4">Rozet / Vurgu Metni<input name="badge" defaultValue={section.badge || ""} className="mt-1 w-full rounded-xl border border-slate-200 p-3" /></label>
                  <label className="text-sm font-bold text-slate-600 md:col-span-12">İçerik Metni (Açıklama)<textarea name="body" defaultValue={section.body || ""} className="mt-1 min-h-[120px] w-full rounded-xl border border-slate-200 p-3 leading-relaxed" /></label>
                </>
              )}
            </div>
          </div>

          {/* 2. Medya ve Butonlar */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <h4 className="mb-4 flex items-center gap-2 font-black text-hayat-dark"><ImagePlus className="text-hayat-green" size={20} /> 2. Medya</h4>
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-6">
                <label className="text-sm font-bold text-slate-600">Ana Medya Yolu (Resim veya Video)<MediaField name="imageUrl" defaultValue={section.imageUrl || ""} media={media} inputClassName="mt-1 w-full rounded-xl border border-slate-200 p-3" /></label>
              </div>
              <label className="text-sm font-bold text-slate-600 md:col-span-6">Görsel Açıklaması (Alt Metin)<input name="imageAlt" defaultValue={section.imageAlt || ""} className="mt-1 w-full rounded-xl border border-slate-200 p-3" /></label>
              {!isMediaOnly && (
                <>
                  <label className="text-sm font-bold text-slate-600 md:col-span-3">1. Buton Yazısı<input name="buttonLabel" defaultValue={section.buttonLabel || ""} className="mt-1 w-full rounded-xl border border-slate-200 p-3" /></label>
                  <label className="text-sm font-bold text-slate-600 md:col-span-3">1. Buton Linki / URL<input name="href" defaultValue={section.href || ""} placeholder="Örn: /bagis" className="mt-1 w-full rounded-xl border border-slate-200 p-3" /></label>
                  <label className="text-sm font-bold text-slate-600 md:col-span-3">2. Buton Yazısı<input name="secondaryButtonLabel" defaultValue={section.secondaryButtonLabel || ""} className="mt-1 w-full rounded-xl border border-slate-200 p-3" /></label>
                  <label className="text-sm font-bold text-slate-600 md:col-span-3">2. Buton Linki / URL<input name="secondaryHref" defaultValue={section.secondaryHref || ""} className="mt-1 w-full rounded-xl border border-slate-200 p-3" /></label>
                </>
              )}
            </div>
          </div>

          {/* 3. Slider Ayarları */}
          <details className="group/slider rounded-2xl border border-slate-100 bg-slate-50">
            <summary className="flex cursor-pointer items-center justify-between p-5 font-black text-hayat-dark outline-none">
              <span className="flex items-center gap-2"><LibraryBig className="text-hayat-blue" size={20} /> 3. Medya Ekleme</span>
              <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500 shadow-sm">{section.images.length} medya</span>
            </summary>
            <div className="space-y-3 border-t border-slate-100 p-5 pt-4">
            {section.images.map((image) => (
              <div key={image.id} className="grid gap-3 rounded-xl bg-slate-50 p-3 md:grid-cols-12">
                <input type="hidden" name="sectionImageId" value={image.id} />
                <div className="md:col-span-2">
                  {isVideoMedia(image.url) ? (
                    <video src={image.url} className="h-24 w-full rounded-xl object-cover" muted preload="metadata" />
                  ) : (
                    <img src={image.url} alt={image.alt || section.title} loading="lazy" decoding="async" className="h-24 w-full rounded-xl object-cover" />
                  )}
                </div>
                <label className="text-sm font-bold text-slate-600 md:col-span-4">Medya yolu<MediaField name="sectionImageUrl" defaultValue={image.url} placeholder="/uploads/medya.jpg" media={media} /></label>
                <label className="text-sm font-bold text-slate-600 md:col-span-3">Alt metin<input name="sectionImageAlt" defaultValue={image.alt || ""} className="mt-1 w-full rounded-xl border p-3" /></label>
                <label className="text-sm font-bold text-slate-600 md:col-span-1">Sıra<input name="sectionImageSortOrder" type="number" defaultValue={image.sortOrder} className="mt-1 w-full rounded-xl border p-3" /></label>
                <label className="mt-6 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-3 font-bold text-red-700 md:col-span-2"><input name="sectionImageDeleteId" type="checkbox" value={image.id} /> Sil</label>
              </div>
            ))}
            <label className="block rounded-xl border-2 border-dashed border-hayat-green/30 bg-hayat-soft p-4 font-bold text-slate-700">
              Bu alanın kendi medya kütüphanesine resim/video yükle
              <input name="newSectionImageFiles" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png,video/mp4,video/webm,video/ogg,video/quicktime" multiple className="mt-3 w-full rounded-xl bg-white p-3 font-normal" />
              <span className="mt-2 block text-xs font-normal text-slate-500">Seçilen dosyalar sadece bu alanın medya listesine kaydedilir.</span>
            </label>
            {!isMediaOnly && [0, 1, 2].map((index) => (
              <div key={`new-image-${section.id}-${index}`} className="grid gap-3 rounded-xl border border-dashed border-slate-200 bg-white p-3 md:grid-cols-12">
                <label className="text-sm font-bold text-slate-600 md:col-span-5">Yeni medya yolu<MediaField name="newSectionImageUrl" placeholder="/uploads/medya.jpg" media={media} /></label>
                <label className="text-sm font-bold text-slate-600 md:col-span-5">Alt metin<input name="newSectionImageAlt" className="mt-1 w-full rounded-xl border p-3" /></label>
                <label className="text-sm font-bold text-slate-600 md:col-span-2">Sıra<input name="newSectionImageSortOrder" type="number" defaultValue={section.images.length + index + 1} className="mt-1 w-full rounded-xl border p-3" /></label>
              </div>
            ))}
            </div>
          </details>

          {/* 4. Tasarım Ayarları (Kapalı Gelir) */}
          <details className="rounded-2xl border border-slate-100 bg-white transition-all open:bg-slate-50">
            <summary className="flex cursor-pointer items-center gap-2 p-5 font-black text-hayat-dark outline-none"><Settings2 className="text-slate-400" size={20} /> 4. Gelişmiş Görünüm ve Tasarım Ayarları</summary>
            <div className="space-y-6 border-t border-slate-100 p-5 pt-4">
            <div>
              <div className="grid gap-3 md:grid-cols-12 mb-4">
                <label className="text-sm font-bold text-slate-600 md:col-span-6">Görünüm Şablonu<select name="layout" defaultValue={section.layout} className="mt-1 w-full rounded-xl border border-slate-200 p-3"><SelectOptions items={layouts} /></select></label>
                <label className="text-sm font-bold text-slate-600 md:col-span-6">Renk Teması<select name="theme" defaultValue={section.theme} className="mt-1 w-full rounded-xl border border-slate-200 p-3"><SelectOptions items={themes} /></select></label>
              </div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Alan ve Resim Boyutları</h4>
            <div className="grid gap-3 md:grid-cols-12">
              <label className="text-sm font-bold text-slate-600 md:col-span-3">İçerik Genişliği<select name="contentWidth" defaultValue={section.contentWidth || "normal"} className="mt-1 w-full rounded-xl border p-3"><SelectOptions items={widths} /></select></label>
              <label className="text-sm font-bold text-slate-600 md:col-span-3">Kart Genişliği<select name="cardWidth" defaultValue={section.cardWidth || "normal"} className="mt-1 w-full rounded-xl border p-3"><SelectOptions items={cardWidths} /></select></label>
              <label className="text-sm font-bold text-slate-600 md:col-span-3">Minimum Yükseklik (px)<input name="minHeight" type="number" min="0" max="900" defaultValue={section.minHeight || ""} className="mt-1 w-full rounded-xl border p-3" /></label>
              <label className="text-sm font-bold text-slate-600 md:col-span-3">İç Boşluk (px)<input name="cardPadding" type="number" min="8" max="96" defaultValue={section.cardPadding || 32} className="mt-1 w-full rounded-xl border p-3" /></label>
              <label className="text-sm font-bold text-slate-600 md:col-span-3">Dış Üst Boşluk (px)<input name="marginTop" type="number" min="0" max="160" defaultValue={section.marginTop || 0} className="mt-1 w-full rounded-xl border p-3" /></label>
              <label className="text-sm font-bold text-slate-600 md:col-span-3">Dış Alt Boşluk (px)<input name="marginBottom" type="number" min="0" max="160" defaultValue={section.marginBottom || 0} className="mt-1 w-full rounded-xl border p-3" /></label>
              <label className="text-sm font-bold text-slate-600 md:col-span-3">Alan Dikey Boşluk (px)<input name="paddingY" type="number" min="20" max="160" defaultValue={section.paddingY || 56} className="mt-1 w-full rounded-xl border p-3" /></label>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Metin ve Hizalama</h4>
            <div className="grid gap-3 md:grid-cols-12">
              <label className="text-sm font-bold text-slate-600 md:col-span-2">Başlık (px)<input name="titleSize" type="number" min="14" max="96" defaultValue={section.titleSize || 32} className="mt-1 w-full rounded-xl border p-3" /></label>
              <label className="text-sm font-bold text-slate-600 md:col-span-2">Üst Başlık (px)<input name="subtitleSize" type="number" min="10" max="48" defaultValue={section.subtitleSize || 14} className="mt-1 w-full rounded-xl border p-3" /></label>
              <label className="text-sm font-bold text-slate-600 md:col-span-2">Metin (px)<input name="bodySize" type="number" min="10" max="36" defaultValue={section.bodySize || 16} className="mt-1 w-full rounded-xl border p-3" /></label>
              <label className="text-sm font-bold text-slate-600 md:col-span-3">Hizalama<select name="textAlign" defaultValue={section.textAlign || "left"} className="mt-1 w-full rounded-xl border p-3"><SelectOptions items={aligns} /></select></label>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Renk ve Görünüm</h4>
            <div className="grid gap-3 md:grid-cols-12">
              <label className="text-sm font-bold text-slate-600 md:col-span-2">Başlık Renk<input name="titleColor" type="color" defaultValue={section.titleColor || "#005D91"} className="mt-1 h-12 w-full rounded-xl border p-1" /></label>
              <label className="text-sm font-bold text-slate-600 md:col-span-2">Üst Başlık Renk<input name="subtitleColor" type="color" defaultValue={section.subtitleColor || "#6FB744"} className="mt-1 h-12 w-full rounded-xl border p-1" /></label>
              <label className="text-sm font-bold text-slate-600 md:col-span-2">Metin Renk<input name="bodyColor" type="color" defaultValue={section.bodyColor || "#475569"} className="mt-1 h-12 w-full rounded-xl border p-1" /></label>
              <label className="text-sm font-bold text-slate-600 md:col-span-2">Arka Plan Rengi<input name="backgroundColor" type="color" defaultValue={section.backgroundColor || "#ffffff"} className="mt-1 h-12 w-full rounded-xl border p-1" /></label>
              <label className="text-sm font-bold text-slate-600 md:col-span-2">Kenarlık Rengi<input name="borderColor" type="color" defaultValue={section.borderColor || "#dbeafe"} className="mt-1 h-12 w-full rounded-xl border p-1" /></label>
              <label className="text-sm font-bold text-slate-600 md:col-span-2">Köşe (px)<input name="borderRadius" type="number" min="0" max="64" defaultValue={section.borderRadius || 32} className="mt-1 w-full rounded-xl border p-3" /></label>
            </div>
          </div>
            </div>
          </details>

          {/* Alt Kayıt Çubuğu */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
             <label className="flex items-center gap-3 font-black text-hayat-dark"><input name="isActive" type="checkbox" defaultChecked={section.isActive} className="h-5 w-5 rounded text-hayat-green" /> Sitede Göster (Aktif)</label>
             <div className="flex gap-2">
                <button formAction={deleteSection} className="flex items-center gap-2 rounded-xl bg-red-50 px-5 py-3.5 font-black text-red-600 transition hover:bg-red-100"><Trash2 size={16} /> Sil</button>
                <button formAction={duplicateSection} className="flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-3.5 font-black text-slate-700 transition hover:bg-slate-200"><Copy size={16} /> Kopyala</button>
                <button className="flex items-center gap-2 rounded-xl bg-hayat-green px-8 py-3.5 font-black text-white transition hover:bg-hayat-dark"><Save size={18} /> Kaydet</button>
             </div>
          </div>
        </form>
      </div>
    </details>
  );
}

function DonationTypeEditor({ type }: { type: DonationType }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-12">
      <input type="hidden" name="id" value={type.id} />
      <label className="text-sm font-bold text-slate-600 md:col-span-2">Kod<input name="code" defaultValue={type.code} className="mt-1 w-full rounded-xl border p-3 font-mono text-xs" /></label>
      <label className="text-sm font-bold text-slate-600 md:col-span-3">Bağış türü adı<input name="label" defaultValue={type.label} className="mt-1 w-full rounded-xl border p-3" /></label>
      <label className="text-sm font-bold text-slate-600 md:col-span-4">Açıklama<input name="description" defaultValue={type.description || ""} className="mt-1 w-full rounded-xl border p-3" /></label>
      <label className="text-sm font-bold text-slate-600 md:col-span-1">Sıra<input name="sortOrder" type="number" defaultValue={type.sortOrder} className="mt-1 w-full rounded-xl border p-3" /></label>
      <label className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-bold md:col-span-1"><input name="isActive" type="checkbox" value={type.id} defaultChecked={type.isActive} /> Aktif</label>
      <label className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 font-bold text-red-700 md:col-span-1"><input name="deleteId" type="checkbox" value={type.id} /> Sil</label>
    </div>
  );
}

function AdminUserEditor({ user }: { user: AdminUser }) {
  return (
    <form action={updateAdminUser} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.1fr_.9fr_1.25fr_.75fr_1fr_auto] lg:items-end">
      <input type="hidden" name="id" value={user.id} />
      <label className="min-w-0 text-sm font-bold text-slate-600">
        Ad soyad
        <input name="fullName" defaultValue={user.fullName} className="mt-1 h-10 w-full min-w-0 rounded-xl border px-3 py-2 text-sm" />
      </label>
      <label className="min-w-0 text-sm font-bold text-slate-600">
        Kullanici adi
        <input name="username" defaultValue={user.username || ""} className="mt-1 h-10 w-full min-w-0 rounded-xl border px-3 py-2 text-sm" />
      </label>
      <label className="min-w-0 text-sm font-bold text-slate-600">
        E-posta
        <input name="email" type="email" defaultValue={user.email} className="mt-1 h-10 w-full min-w-0 rounded-xl border px-3 py-2 text-sm" />
      </label>
      <label className="min-w-0 text-sm font-bold text-slate-600">
        Rol
        <select name="role" defaultValue={user.role} className="mt-1 h-10 w-full min-w-0 rounded-xl border px-3 py-2 text-sm">
          <option value="ADMIN">Admin</option>
          <option value="EDITOR">Editör</option>
          <option value="VIEWER">Görüntüleyici</option>
        </select>
      </label>
      <label className="min-w-0 text-sm font-bold text-slate-600">
        Yeni şifre
        <input name="password" type="password" autoComplete="new-password" placeholder="Degismeyecekse bos" className="mt-1 h-10 w-full min-w-0 rounded-xl border px-3 py-2 text-sm" />
      </label>
      <div className="flex min-w-max items-center justify-end gap-2">
        <details className="relative">
          <summary className="flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 hover:bg-slate-200">
            <span className={`inline-block w-2 h-2 rounded-full ${user.isActive ? "bg-hayat-green" : "bg-red-500"}`}></span>
            <span className="text-sm font-bold text-slate-700">{user.isActive ? "Aktif" : "Pasif"}</span>
            <svg width="10" height="10" viewBox="0 0 20 20" fill="none" className="ml-1"><path d="M6 8l4 4 4-4" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </summary>
          <div className="absolute right-0 mt-2 w-44 rounded-md bg-white p-3 shadow-lg z-20">
            <p className="text-sm mb-2">Kullanıcı şu an <strong>{user.isActive ? "Aktif" : "Pasif"}</strong>.</p>
            <div className="flex gap-2">
              <button type="submit" name="isActive" value="on" className="flex-1 rounded-md bg-hayat-green px-2 py-2 text-sm font-black text-white">Aktif Yap</button>
              <button type="submit" name="isActive" value="off" className="flex-1 rounded-md bg-red-50 px-2 py-2 text-sm font-black text-red-600">Pasif Yap</button>
            </div>
          </div>
        </details>
        <button type="submit" className="h-10 rounded-xl bg-hayat-green px-4 text-sm font-black text-white">Kaydet</button>
        <button formAction={deleteAdminUser} className="h-10 rounded-xl bg-red-50 px-3 text-sm font-black text-red-600">Sil</button>
      </div>
      <p className="text-xs font-semibold text-slate-500 lg:col-span-6">
        Son giriş: {user.lastLoginAt ? user.lastLoginAt.toLocaleString("tr-TR") : "Henüz giriş yok"} · Oluşturulma: {user.createdAt.toLocaleDateString("tr-TR")}
      </p>
    </form>
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminSearchParams = Promise<{ alan?: string | string[]; sayfa?: string | string[] }>;

function tabHref(type: string) {
  return `?sayfa=anasayfa&alan=${type}#anasayfa-alanlari`;
}

function adminPageHref(page: string) {
  return `/admin?sayfa=${page}`;
}

export default async function AdminPage({ searchParams }: { searchParams: AdminSearchParams }) {
  const params = await searchParams;
  const rawSelectedAdminPage = Array.isArray(params.sayfa) ? params.sayfa[0] : params.sayfa;
  const selectedAdminPage = adminPages.find((page) => page.key === rawSelectedAdminPage) || adminPages[0];
  const SelectedAdminPageIcon = selectedAdminPage.icon;
  const rawSelectedGroupType = Array.isArray(params.alan) ? params.alan[0] : params.alan;
  const selectedGroup = groups.find((group) => group.type === rawSelectedGroupType) || groups[0];

  const [sections, media, donationTypes, adminUsers, totals, popup, groupLabels] = await Promise.all([
    prisma.siteSection.findMany({
      include: {
        images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    }),
    prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 24 }),
    prisma.donationType.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] }),
    prisma.adminUser.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "desc" }] }),
    prisma.$transaction([
      prisma.siteSection.count(),
      prisma.siteSection.count({ where: { isActive: true } }),
      prisma.mediaAsset.count(),
      prisma.donation.count(),
      prisma.aidApplication.count(),
      prisma.aidApplication.count({ where: { status: "NEW" } }),
      prisma.sacrificeOrder.count(),
      prisma.announcement.count()
    ]),
    prisma.popupSetting.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.sectionGroupLabel.findMany()
  ]);
  const [sectionCount, activeSectionCount, mediaCount, donationCount, applicationCount, newApplicationCount, sacrificeCount, announcementCount] = totals;
  const selectedGroupItems = sections.filter((section) => section.type === selectedGroup.type);
  const selectedGroupLabel = groupLabels.find((label) => label.type === selectedGroup.type)?.label || selectedGroup.title;
  const posProvider = process.env.POS_PROVIDER || "demo";
  const vakifRequiredSettings = [
    "VAKIF_POS_MERCHANT_ID",
    "VAKIF_POS_CUSTOMER_ID",
    "VAKIF_POS_USERNAME",
    "VAKIF_POS_HASH_PASSWORD"
  ];
  const missingVakifSettings = vakifRequiredSettings.filter((setting) => !process.env[setting]);
  const SelectedGroupIcon = selectedGroup.icon;
  const statsSection = sections.find((section) => section.type === "CUSTOM" && section.customTitle === "Bugüne Kadar");
  const statsValues = (statsSection?.body?.split("\n").map((line) => line.split("|")).filter((parts) => parts.length === 2) || [
    ["12.450+", "Ulaşılan aile"],
    ["7/24", "Online bağış"],
    ["%100", "Kayıtlı süreç"],
    ["Güvenli", "Başvuru takibi"]
  ]);
  const statsSlots = Array.from({ length: Math.max(6, statsValues.length + 2) }, (_, index) => statsValues[index] || ["", ""]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-100 py-4">
        <div className="mx-auto w-full px-3 md:px-5 xl:px-6">
          <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_280px]">
            <aside className="admin-sidebar-scroll sticky top-3 max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-[1.4rem] bg-hayat-blue p-4 text-white shadow-soft">
              <div className="rounded-[1.1rem] bg-white/10 p-4">
                <p className="flex items-center gap-2 font-black uppercase tracking-[.18em] text-white/80"><LayoutDashboard size={18} /> Yönetim Paneli</p>
                <h1 className="mt-2 text-2xl font-black leading-tight">İçerik yönetimi</h1>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white/10 p-3"><b className="block text-xl text-white">{sectionCount}</b>Alan</div>
                <div className="rounded-xl bg-white/10 p-3"><b className="block text-xl text-white">{activeSectionCount}</b>Aktif</div>
                <div className="rounded-xl bg-white/10 p-3"><b className="block text-xl text-white">{mediaCount}</b>Medya</div>
                <div className="rounded-xl bg-white/10 p-3"><b className="block text-xl text-white">{announcementCount}</b>Duyuru</div>
                <div className="rounded-xl bg-white/10 p-3"><b className="block text-xl text-white">{applicationCount}</b>Başvuru</div>
                <div className="rounded-xl bg-white/10 p-3"><b className="block text-xl text-white">{newApplicationCount}</b>Yeni</div>
                <div className="rounded-xl bg-white/10 p-3"><b className="block text-xl text-white">{donationCount}</b>Bağış</div>
                <div className="rounded-xl bg-white/10 p-3"><b className="block text-xl text-white">{sacrificeCount}</b>Kurban</div>
              </div>

              <nav className="mt-4 space-y-2 text-sm font-black">
                <Link href="/" className="flex items-center justify-center gap-2 rounded-xl bg-hayat-green px-4 py-3 text-white"><Eye size={18} /> Siteyi Gör</Link>
                <Link href="/admin/duyurular" className="block rounded-xl bg-white/10 px-4 py-2.5">Duyurular</Link>
                <Link href="/admin/basvurular" className="block rounded-xl bg-white/10 px-4 py-2.5">Yardım Başvuruları</Link>
                <Link href="/admin/bagislar" className="block rounded-xl bg-white/10 px-4 py-2.5">Bağış Listesi</Link>
                <Link href="/admin/kurban" className="block rounded-xl bg-white/10 px-4 py-2.5">Kurban Organizasyonu</Link>
                <Link href="/admin/hesaplar" className="block rounded-xl bg-white/10 px-4 py-2.5">Hesap / Banka Bilgileri</Link>
                <Link href="/admin/politikalar" className="block rounded-xl bg-white/10 px-4 py-2.5">KVKK / Politikalar</Link>
              </nav>
            </aside>

            <div className="space-y-4">
              <section className="rounded-[1.4rem] bg-white p-4 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[.16em] text-hayat-green">
                  {selectedAdminPage.key === "anasayfa" ? <SelectedGroupIcon size={18} /> : <SelectedAdminPageIcon size={18} />} Çalışma Alanı
                </p>
                <h2 className="mt-2 text-2xl font-black text-hayat-dark">{selectedAdminPage.key === "anasayfa" ? selectedGroupLabel : selectedAdminPage.title}</h2>
                  </div>
                  {selectedAdminPage.key === "anasayfa" && (
                    <form action={ensureHomepageManagedSections}>
                      <button className="inline-flex items-center gap-2 rounded-2xl bg-hayat-dark px-6 py-3 font-black text-white">
                        <PlusCircle size={18} /> Eksik alanları oluştur
                      </button>
                    </form>
                  )}
                  {selectedAdminPage.key === "bagis" && (
                    <form action={seedDonationTypes}>
                      <button className="rounded-2xl bg-hayat-dark px-5 py-3 text-sm font-black text-white">Varsayılanları oluştur</button>
                    </form>
                  )}
                </div>
              </section>

              {selectedAdminPage.key === "anasayfa" && (
                <>
              <section className="rounded-[1.4rem] bg-white p-4 shadow-sm">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-2xl font-black text-hayat-dark">{selectedGroupLabel}</h2>
                    <p className="mt-2 text-sm font-semibold text-slate-500">Bu alanın ana sayfada görünen başlığını buradan belirleyebilirsiniz.</p>
                  </div>
                </div>
                <form action={saveGroupLabel} className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                  <input type="hidden" name="type" value={selectedGroup.type} />
                  <label className="grid gap-2 text-sm font-black text-slate-600">
                    Alan başlığı
                    <input
                      name="label"
                      defaultValue={selectedGroupLabel}
                      className="rounded-xl border border-slate-200 bg-white p-3 font-semibold text-hayat-dark"
                    />
                  </label>
                  <div className="flex items-end">
                    <button className="h-[50px] rounded-xl bg-hayat-green px-7 font-black text-white">Başlığı Kaydet</button>
                  </div>
                </form>
              </section>

              {/* Listeleme ve Düzenleme Alanı */}
              <div>
                {selectedGroupItems.length > 0 ? (
                  selectedGroupItems.map((section) => <SectionEditor key={section.id} section={section} media={media} />)
                ) : (
                  <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-white p-10 text-center">
                     <LayoutDashboard className="text-slate-300 mb-3" size={48} />
                     <p className="text-lg font-black text-slate-600">Bu bölümde henüz içerik yok.</p>
                     <p className="mt-2 text-sm font-semibold text-slate-500">Aşağıdaki butonu kullanarak yeni bir içerik bloğu ekleyebilirsiniz.</p>
                  </div>
                )}
              </div>

              {/* Hızlı Yeni Ekleme Kutusu */}
              <section className="rounded-[1.5rem] border border-hayat-blue/20 bg-hayat-blue/5 p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-xl font-black text-hayat-blue"><PlusCircle /> Yeni İçerik Bloğu Ekle</h2>
                <p className="mt-2 text-sm font-semibold text-hayat-blue/80">Sadece temel ayarları seçip ekleyin, detayları yukarıda oluşan karttan doldurabilirsiniz.</p>
                <form action={createSection} className="mt-5 grid gap-4 md:grid-cols-12">
                  <input name="title" placeholder="Paneldeki Adı (Örn: Hakkımızda Kartı 1)" required className="rounded-xl border border-white bg-white p-3 md:col-span-5 shadow-sm" />
                  <select name="type" defaultValue={selectedGroup.type} className="rounded-2xl border p-3 md:col-span-2"><SelectOptions items={sectionTypes} /></select>
                  <select name="layout" defaultValue="CARD" className="rounded-xl border border-white bg-white p-3 md:col-span-4 shadow-sm"><SelectOptions items={layouts} /></select>
                  <div className="hidden">
                    <select name="theme" defaultValue="LIGHT"><SelectOptions items={themes} /></select>
                    <input name="sortOrder" type="number" defaultValue="50" />
                    <input name="isActive" type="checkbox" defaultChecked />
                  </div>
                  <button className="rounded-xl bg-hayat-green px-6 py-3 font-black text-white md:col-span-3 shadow-md hover:bg-hayat-dark transition-colors">Ekle</button>
                </form>
              </section>
              </>
              )}

              {selectedAdminPage.key === "istatistik" && (
              <section id="bugune-kadar" className="rounded-[1.4rem] bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-100 pb-4">
                  <h2 className="flex items-center gap-2 text-2xl font-black text-hayat-dark"><ListOrdered className="text-hayat-green" /> Bugüne Kadar alanı</h2>
                  <p className="text-sm font-semibold text-slate-500">Ana sayfadaki yeşil istatistik bandının başlığını, rozetini ve kutularını buradan yönetin. Boş bırakılan kutular yayınlanmaz.</p>
                </div>
                <form action={saveStatsSection} className="mt-5 grid gap-4 md:grid-cols-12">
                  {statsSection?.id && <input type="hidden" name="id" defaultValue={statsSection.id} />}
                  <label className="grid gap-2 text-sm font-black text-slate-600 md:col-span-6">
                    Küçük başlık
                    <input name="badge" defaultValue={statsSection?.badge || "Bugüne Kadar"} className="rounded-xl border p-3 font-semibold" />
                  </label>
                  <label className="grid gap-2 text-sm font-black text-slate-600 md:col-span-6">
                    Arka plan rengi
                    <input name="backgroundColor" type="color" defaultValue={statsSection?.backgroundColor || "#6FB744"} className="h-[50px] rounded-xl border bg-white p-2" />
                  </label>
                  <label className="grid gap-2 text-sm font-black text-slate-600 md:col-span-12">
                    Ana başlık
                    <input name="title" defaultValue={statsSection?.title || "Desteklerinizle büyüyen iyilik ağı"} className="rounded-xl border p-3 text-xl font-black text-hayat-dark" />
                  </label>
                  {statsSlots.map((stat, slotIndex) => {
                    const index = slotIndex + 1;
                    return (
                      <div key={index} className="min-w-0 grid gap-3 rounded-[1.1rem] border border-hayat-green/20 bg-hayat-soft p-3 md:col-span-6">
                        <p className="text-xs font-black uppercase tracking-widest text-hayat-green">{index}. kutu</p>
                        <input name="statValue" defaultValue={stat[0]} placeholder="Değer" className="min-w-0 rounded-xl border bg-white p-3 text-xl font-black text-hayat-dark" />
                        <input name="statLabel" defaultValue={stat[1]} placeholder="Etiket" className="min-w-0 rounded-xl border bg-white p-3 text-sm font-bold text-slate-600" />
                      </div>
                    );
                  })}
                  <div className="min-w-0 overflow-hidden rounded-[1.1rem] bg-hayat-green p-5 text-white md:col-span-12">
                    <p className="text-[11px] font-black uppercase tracking-widest text-white/75">{statsSection?.badge || "Bugüne Kadar"}</p>
                    <div className="mt-2 flex min-w-0 flex-col gap-4">
                      <h3 className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-3xl font-black leading-tight lg:text-4xl">{statsSection?.title || "Desteklerinizle büyüyen iyilik ağı"}</h3>
                      <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
                        {statsValues.map(([value, label]) => (
                          <div key={`${value}-${label}`} className="min-w-0 border border-white/25 p-3">
                            <b className="block break-words text-xl font-black">{value}</b>
                            <span className="mt-1 block text-[10px] font-black uppercase text-white/80">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button className="rounded-xl bg-hayat-green px-6 py-3 font-black text-white md:col-span-3">Kaydet</button>
                </form>
              </section>
              )}

              {selectedAdminPage.key === "bagis" && (
              <section id="bagis-turleri" className="rounded-[1.4rem] bg-white p-4 shadow-sm">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <h2 className="flex items-center gap-2 text-2xl font-black text-hayat-dark"><Heart className="text-hayat-green" /> Online bağış türleri</h2>
                    <p className="mt-2 text-slate-500">Bağış formundaki türleri buradan ekleyebilir, sıralayabilir, pasif yapabilir veya silebilirsiniz.</p>
                  </div>
                  <form action={seedDonationTypes}>
                    <button className="rounded-2xl bg-hayat-dark px-5 py-3 text-sm font-black text-white">Varsayılanları oluştur</button>
                  </form>
                </div>

                <div className="mt-4 grid gap-3 rounded-[1.2rem] border border-hayat-blue/10 bg-hayat-soft p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-hayat-blue"><CreditCard /></span>
                  <div>
                    <h3 className="font-black text-hayat-dark">Hızlı ödeme / Sanal POS durumu</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      Aktif sağlayıcı: <b className="text-hayat-blue">{posProvider}</b>
                      {posProvider === "vakifkatilim" && missingVakifSettings.length > 0 && (
                        <span className="text-red-600"> - eksik ayar: {missingVakifSettings.join(", ")}</span>
                      )}
                      {posProvider === "vakifkatilim" && missingVakifSettings.length === 0 && (
                        <span className="text-hayat-green"> - Vakıf Katılım ayarları hazır görünüyor.</span>
                      )}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">Banka kullanıcı adı, müşteri no, mağaza no ve hash şifresi güvenlik için .env dosyasından okunur.</p>
                  </div>
                  <span className={`rounded-2xl px-4 py-2 text-sm font-black ${posProvider === "demo" ? "bg-amber-50 text-amber-700" : "bg-hayat-green text-white"}`}>
                    {posProvider === "demo" ? "Demo mod" : "Canlı ayar"}
                  </span>
                </div>

                <form action={createDonationType} className="mt-4 grid gap-3 rounded-[1.2rem] border border-hayat-green/20 bg-hayat-soft p-4 md:grid-cols-12">
                  <input name="code" placeholder="Kod: ORN_GIDA" className="rounded-xl border p-3 font-mono text-sm md:col-span-2" />
                  <input name="label" placeholder="Bağış türü adı" className="rounded-xl border p-3 md:col-span-3" />
                  <input name="description" placeholder="Açıklama" className="rounded-xl border p-3 md:col-span-4" />
                  <input name="sortOrder" type="number" defaultValue="50" className="rounded-xl border p-3 md:col-span-1" />
                  <label className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-bold md:col-span-2"><input name="isActive" type="checkbox" defaultChecked /> Aktif</label>
                  <button className="rounded-xl bg-hayat-green px-5 py-3 font-black text-white md:col-span-3">Yeni tür ekle</button>
                </form>

                <form action={updateDonationTypesBulk} className="mt-5 space-y-3">
                  {donationTypes.map((type) => <DonationTypeEditor key={type.id} type={type} />)}
                  {!donationTypes.length && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Henüz bağış türü yok.</p>}
                  {donationTypes.length > 0 && (
                    <div className="sticky bottom-4 z-10 flex justify-end rounded-2xl border border-hayat-green/20 bg-white/95 p-4 shadow-stk backdrop-blur">
                      <button className="rounded-xl bg-hayat-green px-7 py-3 font-black text-white">Tümünü Kaydet</button>
                    </div>
                  )}
                </form>
              </section>
              )}

              {selectedAdminPage.key === "kullanicilar" && (
              <section id="admin-kullanicilar" className="rounded-[1.4rem] bg-white p-4 shadow-sm">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <h2 className="flex items-center gap-2 text-2xl font-black text-hayat-dark"><UserCog className="text-hayat-green" /> Admin kullanıcıları</h2>
                    <p className="mt-2 text-slate-500">Panel kullanıcılarını buradan ekleyebilir, şifrelerini değiştirebilir, rol ve aktiflik durumlarını yönetebilirsiniz.</p>
                  </div>
                  <div className="rounded-2xl bg-hayat-soft px-4 py-3 text-sm font-black text-hayat-blue">
                    {adminUsers.length} kullanıcı
                  </div>
                </div>

                <form action={createAdminUser} className="mt-5 grid gap-3 rounded-[1.2rem] border border-hayat-green/20 bg-hayat-soft p-4 md:grid-cols-12">
                  <input name="fullName" placeholder="Ad soyad" required className="rounded-xl border bg-white p-3 md:col-span-2" />
                  <input name="username" placeholder="Kullanici adi" required className="rounded-xl border bg-white p-3 md:col-span-2" />
                  <input name="email" type="email" placeholder="E-posta" required className="rounded-xl border bg-white p-3 md:col-span-2" />
                  <input name="password" type="password" autoComplete="new-password" placeholder="Geçici şifre" required className="rounded-xl border bg-white p-3 md:col-span-2" />
                  <select name="role" defaultValue="EDITOR" className="rounded-xl border bg-white p-3 md:col-span-2">
                    <option value="ADMIN">Admin</option>
                    <option value="EDITOR">Editör</option>
                    <option value="VIEWER">Görüntüleyici</option>
                  </select>
                  <label className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-bold md:col-span-2"><input name="isActive" type="checkbox" defaultChecked /> Aktif</label>
                  <button className="rounded-xl bg-hayat-green px-5 py-3 font-black text-white md:col-span-3">Yeni kullanıcı ekle</button>
                </form>

                <div className="mt-5 space-y-3">
                  {adminUsers.map((user) => <AdminUserEditor key={user.id} user={user} />)}
                  {!adminUsers.length && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Henüz admin kullanıcısı tanımlanmadı.</p>}
                </div>
              </section>
              )}

              {selectedAdminPage.key === "medya" && (
              <section id="medya" className="grid gap-6 xl:grid-cols-[420px_1fr]">
                <div className="rounded-[1.4rem] bg-white p-4 shadow-sm">
                  <h2 className="flex items-center gap-2 text-2xl font-black text-hayat-dark"><UploadCloud className="text-hayat-green" /> Resim / video yükle</h2>
                  <p className="mt-2 text-slate-500">Yüklediğiniz medyalar, alanlardaki Medya Seç penceresinde otomatik listelenir.</p>
                  <form action={uploadMedia} className="mt-5 space-y-3">
                    <input name="title" placeholder="Medya başlığı" className="w-full rounded-2xl border p-3" />
                    <input name="file" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png,video/mp4,video/webm,video/ogg,video/quicktime" required className="w-full rounded-2xl border p-3" />
                    <button className="w-full rounded-2xl bg-hayat-blue px-6 py-3 font-black text-white"><ImagePlus className="mr-2 inline" size={18} /> Medya Yükle</button>
                  </form>
                </div>
                <div className="rounded-[1.4rem] bg-white p-4 shadow-sm">
                  <h2 className="flex items-center gap-2 text-2xl font-black text-hayat-dark"><LibraryBig className="text-hayat-green" /> Medya kütüphanesi</h2>
                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                    {media.map((m) => (
                      <div key={m.id} className="rounded-2xl border bg-slate-50 p-2">
                        {isVideoMedia(m.url, m.mimeType) ? (
                          <video src={m.url} className="h-28 w-full rounded-xl object-cover" controls preload="metadata" />
                        ) : (
                          <img src={m.url} alt={m.title || m.filename} loading="lazy" decoding="async" className="h-28 w-full rounded-xl object-cover" />
                        )}
                        <p className="mt-2 break-all rounded-xl bg-white p-2 text-xs font-bold text-slate-600">{m.url}</p>
                        <form action={deleteMedia} className="mt-2"><input type="hidden" name="id" value={m.id} /><button className="w-full rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600">Medyayı Sil</button></form>
                      </div>
                    ))}
                    {!media.length && <p className="text-slate-500">Henüz medya yüklenmedi.</p>}
                  </div>
                </div>
              </section>
              )}

              {selectedAdminPage.key === "popup" && (
              <section id="popup-ayarlari" className="rounded-[1.4rem] bg-white p-4 shadow-sm">
                <h2 className="flex items-center gap-2 text-2xl font-black text-hayat-dark"><Settings2 className="text-hayat-green" /> İlk açılış popup ayarları</h2>
                <form action={savePopupSetting} className="mt-5 grid gap-3 md:grid-cols-12">
                  {popup?.id && <input type="hidden" name="id" defaultValue={popup.id} />}
                  <input name="title" defaultValue={popup?.title || ""} placeholder="Popup başlığı" className="rounded-xl border p-3 md:col-span-6" />
                  <div className="md:col-span-4">
                    <MediaField name="imageUrl" defaultValue={popup?.imageUrl || ""} placeholder="Medya yolu: /uploads/resim.jpg" media={media} inputClassName="w-full rounded-xl border p-3" />
                  </div>
                  <input name="delaySeconds" defaultValue={popup?.delaySeconds ?? 1} placeholder="Gecikme sn." className="rounded-xl border p-3 md:col-span-2" />
                  <input name="imageAlt" defaultValue={popup?.imageAlt || ""} placeholder="Medya açıklaması" className="rounded-xl border p-3 md:col-span-4" />
                  <input name="buttonLabel" defaultValue={popup?.buttonLabel || ""} placeholder="Buton yazısı" className="rounded-xl border p-3 md:col-span-4" />
                  <input name="buttonUrl" defaultValue={popup?.buttonUrl || ""} placeholder="Buton linki: /bagis" className="rounded-xl border p-3 md:col-span-4" />
                  <textarea name="content" defaultValue={popup?.content || ""} placeholder="Popup bilgi metni" className="min-h-28 rounded-xl border p-3 md:col-span-12" />
                  <label className="flex items-center gap-2 rounded-xl bg-hayat-soft px-4 py-3 font-bold md:col-span-3"><input name="isActive" type="checkbox" defaultChecked={popup?.isActive ?? false} /> Popup aktif</label>
                  <label className="flex items-center gap-2 rounded-xl bg-hayat-soft px-4 py-3 font-bold md:col-span-4"><input name="showOnce" type="checkbox" defaultChecked={popup?.showOnce ?? true} /> Aynı kişiye bir kez göster</label>
                  <button className="rounded-xl bg-hayat-green px-6 py-3 font-black text-white md:col-span-3">Popup Kaydet</button>
                </form>
              </section>
              )}
            </div>

            <aside className="admin-sidebar-scroll max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.5rem] bg-white p-5 shadow-sm xl:sticky xl:top-4">
              <div className="mb-5 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-hayat-dark">Çalışma Alanları</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">Düzenlemek istediğiniz bölümü seçin.</p>
              </div>
              <nav className="flex flex-col gap-3">
                {adminPages.map(({ key, title, icon: Icon }) => {
                  const isSelected = selectedAdminPage.key === key;

                  return (
                    <Link
                      key={key}
                      href={adminPageHref(key)}
                      className={`group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${isSelected ? "bg-hayat-blue text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-hayat-soft hover:text-hayat-blue"}`}
                    >
                      <Icon size={18} className={isSelected ? "text-white" : "text-slate-400 group-hover:text-hayat-blue"} />
                      <span className="truncate">{title}</span>
                    </Link>
                  );
                })}
              </nav>

              {selectedAdminPage.key === "anasayfa" && (
                <div className="mt-8 border-t border-slate-100 pt-5">
                  <div className="mb-5 border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-black text-hayat-dark">İçerik Grupları</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Ana sayfadaki alanları yönetin.</p>
                  </div>
                  <nav className="flex flex-col gap-3">
                    {groups.map(({ type, title, icon: Icon }) => {
                      const isSelected = selectedGroup.type === type;
                      const itemCount = sections.filter((s) => s.type === type).length;

                      return (
                        <Link key={type} href={tabHref(type)} className={`group flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${isSelected ? "bg-hayat-blue/10 text-hayat-blue ring-1 ring-hayat-blue/20" : "bg-slate-50 text-slate-600 hover:bg-hayat-soft hover:text-hayat-blue"}`}>
                          <div className="flex min-w-0 items-center gap-3">
                            <Icon size={18} className={isSelected ? "text-hayat-blue" : "text-slate-400 group-hover:text-hayat-blue"} />
                            <span className="truncate">{groupLabels.find((label) => label.type === type)?.label || title}</span>
                          </div>
                          <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] uppercase tracking-widest ${itemCount > 0 ? isSelected ? "bg-hayat-blue text-white" : "bg-slate-200 text-slate-500" : "bg-red-50 text-red-500"}`}>
                            {itemCount > 0 ? itemCount : "Boş"}
                          </span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

