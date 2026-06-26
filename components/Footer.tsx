import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube, ChevronRight } from "lucide-react";

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
    <footer id="iletisim" className="bg-hayat-dark pb-8 pt-12 text-white sm:pt-16 lg:pt-24 lg:pb-10">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-10">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:mb-20 lg:grid-cols-4 lg:gap-16">
          {/* Column 1: About */}
          <div>
            <Link href="/" className="mb-5 inline-block sm:mb-8">
               <img src="/media/brand/hayat-agaci-logo.jpg" alt="Hayat Ağacı Derneği" loading="lazy" decoding="async" className="h-16 w-auto rounded bg-white object-contain p-1" />
            </Link>
            <p className="mb-7 pr-0 text-sm leading-loose text-slate-400 sm:mb-10 sm:pr-4">
              &quot;Alan elin veren eli görmediği&quot;, şeffaf ve güvenilir bir yardımlaşma ekosistemi inşa ediyoruz. Sivas merkezli derneğimizle tüm ihtiyaç sahiplerine umut oluyoruz.
            </p>
            <div className="flex gap-3">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <div key={i} className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:bg-hayat-green hover:text-white transition-all cursor-pointer">
                  <Icon size={16} />
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Menu */}
          <div>
            <h3 className="mb-5 flex items-center gap-3 text-lg font-bold sm:mb-10">
               <span className="w-8 h-1 bg-hayat-green rounded-full"></span>
               HIZLI MENÜ
            </h3>
            <nav className="grid gap-4">
              {quickLinks.map(([item, href]) => (
                <Link key={item} href={href} className="text-slate-400 hover:text-hayat-green transition-colors text-sm flex items-center gap-2 group">
                   <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" /> {item}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3: Corporate */}
          <div>
            <h3 className="mb-5 flex items-center gap-3 text-lg font-bold sm:mb-10">
               <span className="w-8 h-1 bg-hayat-green rounded-full"></span>
               KURUMSAL
            </h3>
            <nav className="grid gap-4">
              {corporateLinks.map(([item, href]) => (
                <Link key={item} href={href} className="text-slate-400 hover:text-hayat-green transition-colors text-sm flex items-center gap-2 group">
                   <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" /> {item}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="mb-5 flex items-center gap-3 text-lg font-bold sm:mb-10">
               <span className="w-8 h-1 bg-hayat-green rounded-full"></span>
               İLETİŞİM BİLGİLERİ
            </h3>
            <div className="grid gap-5 sm:gap-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-hayat-green/10 flex items-center justify-center text-hayat-green">
                  <Phone size={16} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">TELEFON</p>
                   <a href="tel:+903462214100" className="text-slate-300 font-bold hover:text-white transition-colors">+90 346 221 41 00</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-hayat-green/10 flex items-center justify-center text-hayat-green">
                  <Mail size={16} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">E-POSTA</p>
                   <a href="mailto:bilgi@hayatder.org.tr" className="text-slate-300 font-bold hover:text-white transition-colors">bilgi@hayatder.org.tr</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-hayat-green/10 flex items-center justify-center text-hayat-green">
                  <MapPin size={16} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">ADRES</p>
                   <span className="text-slate-300 text-sm leading-relaxed">Sularbaşı Mh. 4. Sk. No: 8 Merkez/Sivas</span>
                </div>
              </div>
              <Link href="/iletisim" className="inline-flex h-12 w-fit items-center justify-center rounded-md bg-white/10 px-5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-hayat-green">
                İletişim Sayfası
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-center md:flex-row md:gap-6 md:text-left lg:pt-10">
          <p className="text-xs font-medium text-slate-600">
            © 2026 Hayat Ağacı Derneği. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-8">
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Sivas Belediyesi İştirakidir</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
