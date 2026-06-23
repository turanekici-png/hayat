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
    <header className="sticky top-0 z-[100] w-full border-b border-white/10 bg-hayat-blue shadow-sm">
      <div className="hidden border-b border-white/10 bg-hayat-blueDark/30 py-2 lg:block">
        <div className="mx-auto flex max-w-[1320px] items-center justify-center gap-10 px-5 sm:px-8 lg:px-10">
          <a href="mailto:bilgi@hayatder.org.tr" className="flex items-center gap-2 text-xs font-extrabold text-white/90 transition-colors hover:text-white">
            <Mail size={16} className="text-white" /> bilgi@hayatder.org.tr
          </a>
          <a href="tel:+903462214100" className="flex items-center gap-2 text-xs font-extrabold text-white/90 transition-colors hover:text-white">
            <Phone size={16} className="text-white" /> +90 346 221 41 00
          </a>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-3 px-3 sm:h-20 sm:px-5 lg:h-[88px] lg:px-10">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-5">
          <Link href="/" className="flex shrink-0 items-center rounded-md bg-white p-2 shadow-sm transition hover:-translate-y-0.5" aria-label="Hayat Ağacı Derneği ana sayfa">
            <img src="/brand/hayat-agaci-logo.jpg" alt="Hayat Ağacı Derneği" className="h-10 w-[104px] rounded-sm object-contain sm:h-14 sm:w-[140px] lg:h-[72px] lg:w-[180px]" />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0 xl:flex 2xl:gap-1">
            {nav.map(([label, href]) => (
              <Link key={label} href={href} className="whitespace-nowrap rounded-md px-2.5 py-2.5 text-sm font-extrabold text-white transition-all hover:bg-hayat-green hover:text-white 2xl:px-3.5 2xl:text-base">
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-hayat-green 2xl:flex">
            <Search size={19} />
          </div>

          <Link href="/bagis" className="group flex h-11 items-center gap-2 rounded-md bg-hayat-green px-3 text-sm font-black text-white shadow-green transition-all hover:-translate-y-0.5 hover:bg-hayat-greenDark active:scale-95 sm:h-12 sm:px-5 lg:h-auto lg:px-6 lg:py-4 2xl:px-8">
            <Heart size={18} fill="currentColor" />
            <span className="hidden sm:inline">BAĞIŞ YAP</span>
          </Link>

          <details className="group relative xl:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-black text-white transition-colors hover:bg-hayat-green [&::-webkit-details-marker]:hidden">
              <Menu size={20} />
            </summary>
            <div className="absolute right-0 top-[calc(100%+12px)] w-[min(280px,calc(100vw-24px))] overflow-hidden rounded-lg border border-slate-100 bg-white p-3 shadow-2xl ring-1 ring-slate-100">
              <div className="grid gap-1 text-lg font-black">
                {nav.map(([label, href]) => (
                  <Link key={label} href={href} className="rounded-lg px-5 py-4 text-[#1f3444] hover:bg-hayat-soft hover:text-hayat-green">
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
