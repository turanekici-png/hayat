import Link from "next/link";
import { optimizedImageSrc } from "@/lib/image-src";
import { applicationHref, getSiteSettings, isExternalUrl, phoneHref } from "@/lib/site-settings";
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube, ChevronRight, ArrowRight, HeartHandshake } from "lucide-react";

const quickLinks = [
  ["Kurumsal", "/kurumsal"],
  ["Faaliyet Alanlarımız", "/faaliyetler"],
  ["Devam Eden Projeler", "/projeler"],
  ["Haberler", "/haberler"],
  ["Online Bağış", "/bagis"],
  ["Başvuru Takibi", "/basvuru-takip"],
  ["İletişim", "/iletisim"]
];

const corporateLinks = [
  ["Hesap Numaralarımız", "/hesap-numaralarimiz"],
  ["KVKK Aydınlatma", "/kvkk"],
  ["İade Politikası", "/iade-politikasi"],
  ["Gizlilik ve Kullanım Koşulları", "/kullanim-kosullari-ve-gizlilik-politikasi"],
  ["Çerez Politikası", "/cerez-politikasi"]
];

export async function Footer() {
  const settings = await getSiteSettings();
  const socials = [
    { href: settings.facebookUrl, label: "Facebook", Icon: Facebook },
    { href: settings.instagramUrl, label: "Instagram", Icon: Instagram },
    { href: settings.twitterUrl, label: "X (Twitter)", Icon: Twitter },
    { href: settings.youtubeUrl, label: "YouTube", Icon: Youtube }
  ].filter((item): item is { href: string; label: string; Icon: typeof Facebook } => Boolean(item.href));

  return (
    <footer id="iletisim" className="bg-[#072b40] text-white">
      <div className="mx-auto max-w-[1840px] px-3 sm:px-4 lg:px-4">
        <div className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_0.9fr_1.1fr] lg:gap-12">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white p-1.5">
                <img src={optimizedImageSrc("/media/brand/hayat-agaci-logo.jpg", 384)} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
              </span>
              <span className="text-lg font-black leading-tight">Hayat Ağacı<br />Derneği</span>
            </Link>
            {settings.footerAbout && (
              <p className="mt-6 max-w-md text-[15px] font-medium leading-7 text-[#c9dce7]">{settings.footerAbout}</p>
            )}
            {socials.length > 0 && (
              <div className="mt-6 flex gap-2.5">
                {socials.map(({ href, label, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-11 w-11 place-items-center rounded-xl border border-white/12 bg-white/5 text-[#d8ecf5] transition hover:border-hayat-green hover:bg-hayat-green hover:text-white">
                    <Icon size={17} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-5 text-[13px] font-black uppercase tracking-[0.16em] text-white">Hızlı Menü</h3>
            <nav className="grid gap-2.5">
              {settings.applicationsEnabled && (
                <a href={applicationHref(settings)} {...(isExternalUrl(applicationHref(settings)) ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="group flex items-center gap-2 text-[15px] font-black text-white transition-colors hover:text-hayat-green">
                  <ChevronRight size={14} className="text-hayat-green transition-transform group-hover:translate-x-0.5" /> Yardım Başvurusu
                </a>
              )}
              {quickLinks.map(([item, href]) => (
                <Link key={item} href={href} className="group flex items-center gap-2 text-[15px] font-semibold text-[#c9dce7] transition-colors hover:text-white">
                  <ChevronRight size={14} className="text-hayat-green transition-transform group-hover:translate-x-0.5" /> {item}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="mb-5 text-[13px] font-black uppercase tracking-[0.16em] text-white">Kurumsal</h3>
            <nav className="grid gap-2.5">
              {corporateLinks.map(([item, href]) => (
                <Link key={item} href={href} className="group flex items-center gap-2 text-[15px] font-semibold text-[#c9dce7] transition-colors hover:text-white">
                  <ChevronRight size={14} className="text-hayat-green transition-transform group-hover:translate-x-0.5" /> {item}
                </Link>
              ))}
            </nav>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="text-[13px] font-black uppercase tracking-[0.16em] text-white">İletişim</h3>
            <div className="mt-5 grid gap-4">
              {settings.phone && (
                <a href={phoneHref(settings.phone)} className="flex items-center gap-3 font-bold text-white transition hover:text-hayat-green">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-hayat-green"><Phone size={16} /></span>
                  {settings.phone}
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-3 break-all font-bold text-white transition hover:text-hayat-green">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-hayat-green"><Mail size={16} /></span>
                  {settings.email}
                </a>
              )}
              {settings.address && (
                <p className="flex items-start gap-3 text-sm font-semibold leading-6 text-[#c9dce7]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-hayat-green"><MapPin size={16} /></span>
                  <span className="pt-2">{settings.address}</span>
                </p>
              )}
              <Link href="/iletisim" className="mt-1 inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-hayat-green px-5 text-sm font-black text-white transition hover:bg-white hover:text-hayat-dark">
                İletişim Sayfası <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-center text-xs font-semibold text-[#9fbccc] md:flex-row md:items-center md:justify-between md:text-left">
          <p>© {new Date().getFullYear()} Hayat Ağacı Derneği. Tüm hakları saklıdır.{settings.registryNo ? ` · Kütük No: ${settings.registryNo}` : ""}</p>
          {settings.affiliationNote && (
            <span className="inline-flex items-center justify-center gap-2 font-black uppercase tracking-[0.18em] text-[#c9dce7]">
              <HeartHandshake size={14} className="text-hayat-green" /> {settings.affiliationNote}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
