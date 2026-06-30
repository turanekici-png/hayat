﻿import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube, ChevronRight, ArrowRight, HeartHandshake } from "lucide-react";

const quickLinks = [
  ["Kurumsal", "/kurumsal"],
  ["Faaliyet Alanlarımız", "/faaliyetler"],
  ["Devam Eden Projeler", "/projeler"],
  ["Haberler", "/haberler"],
  ["Online Bağış", "/bagis"],
  ["Yardım Başvurusu", "/basvuru"],
  ["İletişim", "/iletisim"]
];

const corporateLinks = [
  ["KVKK Aydınlatma", "/kvkk"],
  ["İade Politikası", "/iade-politikasi"],
  ["Gizlilik Sözleşmesi", "/kullanim-kosullari-ve-gizlilik-politikasi"],
  ["Çerez Politikası", "/cerez-politikasi"],
  ["Kullanım Koşulları", "/kullanim-kosullari-ve-gizlilik-politikasi"]
];

export function Footer() {
  return (
    <footer id="iletisim" className="bg-[#0a3a55] text-white">
      <div className="mx-auto max-w-[1840px] px-3 sm:px-4 lg:px-4">
        <div className="grid gap-8 py-10 md:grid-cols-[1.15fr_0.85fr] lg:grid-cols-[1.2fr_0.78fr_0.78fr_1.08fr] lg:gap-12 lg:py-14">
          <div>
            <Link href="/" className="inline-flex h-20 w-20 items-center justify-center rounded-[18px] bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
               <img src="/media/brand/hayat-agaci-logo.jpg" alt="Hayat Ağacı Derneği" loading="lazy" decoding="async" className="h-full w-full object-contain" />
            </Link>
            <p className="mt-7 max-w-md text-[15px] font-semibold leading-8 text-[#d8ecf5]/78">
              &quot;Alan elin veren eli görmediği&quot;, şeffaf ve güvenilir bir yardımlaşma ekosistemi inşa ediyoruz. Sivas merkezli derneğimizle tüm ihtiyaç sahiplerine umut oluyoruz.
            </p>
            <div className="mt-7 flex gap-3">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <span key={i} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[14px] border border-white/10 bg-white/8 text-[#d8ecf5] transition-all hover:-translate-y-0.5 hover:border-hayat-green hover:bg-hayat-green hover:text-white">
                  <Icon size={16} />
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-[0.18em] text-white">
               <span className="h-1 w-9 rounded-full bg-hayat-green"></span>
               HIZLI MENÜ
            </h3>
            <nav className="grid gap-3">
              {quickLinks.map(([item, href]) => (
                <Link key={item} href={href} className="group flex items-center gap-2 text-sm font-semibold text-[#d8ecf5]/76 transition-colors hover:text-white">
                   <ChevronRight size={13} className="text-hayat-green transition-transform group-hover:translate-x-1" /> {item}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-[0.18em] text-white">
               <span className="h-1 w-9 rounded-full bg-hayat-green"></span>
               KURUMSAL
            </h3>
            <nav className="grid gap-3">
              {corporateLinks.map(([item, href]) => (
                <Link key={item} href={href} className="group flex items-center gap-2 text-sm font-semibold text-[#d8ecf5]/76 transition-colors hover:text-white">
                   <ChevronRight size={13} className="text-hayat-green transition-transform group-hover:translate-x-1" /> {item}
                </Link>
              ))}
            </nav>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/8 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.16)]">
            <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.18em] text-white">
               <span className="h-1 w-9 rounded-full bg-hayat-green"></span>
               İLETİŞİM
            </h3>
            <div className="mt-6 grid gap-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/10 text-hayat-green">
                  <Phone size={16} />
                </div>
                <div>
                   <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#d8ecf5]/50">TELEFON</p>
                   <a href="tel:+903462214100" className="font-black text-white transition-colors hover:text-hayat-green">+90 346 221 41 00</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/10 text-hayat-green">
                  <Mail size={16} />
                </div>
                <div>
                   <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#d8ecf5]/50">E-POSTA</p>
                   <a href="mailto:bilgi@hayatder.org.tr" className="font-black text-white transition-colors hover:text-hayat-green">bilgi@hayatder.org.tr</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/10 text-hayat-green">
                  <MapPin size={16} />
                </div>
                <div>
                   <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#d8ecf5]/50">ADRES</p>
                   <span className="text-sm font-semibold leading-relaxed text-[#d8ecf5]/86">Sularbaşı Mh. 4. Sk. No: 8 Merkez/Sivas</span>
                </div>
              </div>
              <Link href="/iletisim" className="inline-flex h-12 w-fit items-center justify-center gap-2 rounded-[14px] bg-hayat-green px-5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-hayat-dark">
                İletişim Sayfası <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <p className="text-xs font-semibold text-[#d8ecf5]/50">
            © 2026 Hayat Ağacı Derneği. Tüm hakları saklıdır.
          </p>
          <span className="inline-flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#d8ecf5]/70">
            <HeartHandshake size={14} className="text-hayat-green" /> Sivas Belediyesi İştirakidir
          </span>
        </div>
      </div>
    </footer>
  );
}
