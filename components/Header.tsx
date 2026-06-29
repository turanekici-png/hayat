import Link from "next/link";
import { Heart, Mail, Menu, Phone, Search } from "lucide-react";

const nav = [
  ["Ana Sayfa", "/"],
  ["Kurumsal", "/kurumsal"],
  ["Faaliyetler", "/faaliyetler"],
  ["Projelerimiz", "/projeler"],
  ["Haberler", "/haberler"],
  ["Hesap Numaralarımız", "/hesap-numaralarimiz"],
  ["İletişim", "/iletisim"]
];

export function Header() {
  return (
    <header className="sticky top-0 z-[100] w-full border-b border-white/10 bg-hayat-dark shadow-[0_12px_34px_rgba(10,58,85,0.18)]">
      <div className="hidden border-b border-white/10 bg-[#083046] py-2 lg:block">
        <div className="mx-auto flex max-w-[1840px] items-center justify-center gap-10 px-3 sm:px-4 lg:px-4">
          <a href="mailto:bilgi@hayatder.org.tr" className="flex items-center gap-2 text-xs font-extrabold text-[#cfe6f3] transition-colors hover:text-white">
            <Mail size={16} className="text-hayat-green" /> bilgi@hayatder.org.tr
          </a>
          <a href="tel:+903462214100" className="flex items-center gap-2 text-xs font-extrabold text-[#cfe6f3] transition-colors hover:text-white">
            <Phone size={16} className="text-hayat-green" /> +90 346 221 41 00
          </a>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-[1840px] items-center justify-between gap-3 px-3 sm:h-20 sm:px-4 lg:h-[88px] lg:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-5">
          <Link href="/" className="flex shrink-0 items-center rounded-[18px] bg-white p-2 shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5" aria-label="Hayat Ağacı Derneği ana sayfa">
            <img src="/media/brand/hayat-agaci-logo.jpg" alt="Hayat Ağacı Derneği" className="h-10 w-[104px] rounded-sm object-contain sm:h-14 sm:w-[140px] lg:h-[72px] lg:w-[180px]" />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0 xl:flex 2xl:gap-1">
            {nav.map(([label, href]) => (
              <Link key={label} href={href} className="whitespace-nowrap rounded-[999px] px-3 py-2.5 text-sm font-extrabold text-[#cfe6f3] transition-all hover:bg-white hover:text-hayat-dark 2xl:px-4 2xl:text-base">
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#cfe6f3] transition-colors hover:bg-white hover:text-hayat-dark 2xl:flex">
            <Search size={19} />
          </div>

          <Link href="/bagis" className="group flex h-11 items-center gap-2 rounded-[999px] bg-hayat-green px-3 text-sm font-black text-white shadow-green transition-all hover:-translate-y-0.5 hover:bg-white hover:text-hayat-dark active:scale-95 sm:h-12 sm:px-5 lg:h-auto lg:px-6 lg:py-4 2xl:px-8">
            <Heart size={18} fill="currentColor" />
            <span className="hidden sm:inline">BAĞIŞ YAP</span>
          </Link>

          <details className="group relative xl:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-[999px] border border-white/20 bg-white/10 px-3 py-2 text-sm font-black text-white transition-colors hover:bg-white hover:text-hayat-dark [&::-webkit-details-marker]:hidden">
              <Menu size={20} />
            </summary>
            <div className="absolute right-0 top-[calc(100%+12px)] w-[min(280px,calc(100vw-24px))] overflow-hidden rounded-[20px] border border-hayat-border bg-white p-3 shadow-2xl ring-1 ring-hayat-border">
              <div className="grid gap-1 text-lg font-black">
                {nav.map(([label, href]) => (
                  <Link key={label} href={href} className="rounded-[14px] px-5 py-4 text-hayat-dark hover:bg-hayat-soft hover:text-hayat-blue">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
