"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

const nav = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Kurumsal", href: "/kurumsal" },
  { label: "Faaliyetler", href: "/faaliyetler" },
  { label: "Projeler", href: "/projeler" },
  { label: "Haberler", href: "/haberler" },
  { label: "Hesap No", href: "/hesap-numaralarimiz" },
  { label: "İletişim", href: "/iletisim" }
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname() || "/";

  return (
    <header className="sticky top-0 z-[100] w-full border-t-2 border-hayat-dark border-b border-hayat-border bg-[#f7f5ef]/96 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-[1840px] items-center justify-between gap-3 px-3 sm:h-[88px] sm:px-4 lg:h-[104px] lg:gap-6 lg:px-4">
        <Link href="/" className="block min-w-0 shrink" aria-label="Hayat Ağacı Derneği ana sayfa">
          <img src="/media/brand/logolar-vektorel-yatay.png" alt="Hayat Ağacı Derneği" className="h-[54px] w-auto max-w-[min(58vw,240px)] object-contain sm:h-[66px] sm:max-w-[300px] lg:h-[92px] lg:max-w-[360px]" />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-9 lg:flex xl:gap-11 2xl:gap-12">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex h-[104px] items-center whitespace-nowrap text-[16px] font-bold transition-colors xl:text-[17px] ${active ? "text-hayat-dark" : "text-[#23323a] hover:text-hayat-blue"}`}
              >
                {item.label}
                {active && <span className="absolute bottom-[30px] left-0 h-[2px] w-full rounded-full bg-hayat-blue" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href="/bagis" className="inline-flex h-[40px] items-center justify-center rounded-full bg-hayat-green px-4 text-[13px] font-black text-white shadow-green transition hover:-translate-y-0.5 hover:bg-hayat-blue active:scale-95 sm:h-[44px] sm:px-5 sm:text-[14px] lg:h-[48px] lg:px-7 lg:text-[16px]">
            Bağış Yap
          </Link>

          <details className="group relative lg:hidden">
            <summary className="flex h-[40px] w-[40px] cursor-pointer list-none items-center justify-center rounded-full border border-hayat-border bg-white text-hayat-dark shadow-sm [&::-webkit-details-marker]:hidden sm:h-[44px] sm:w-[44px]">
              <Menu size={20} />
            </summary>
            <div className="absolute right-0 top-[calc(100%+10px)] w-[min(330px,calc(100vw-24px))] overflow-hidden rounded-[20px] border border-hayat-border bg-white p-2 shadow-2xl sm:p-3">
              <div className="grid gap-1 text-base font-black">
                {nav.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link key={item.href} href={item.href} className={`rounded-[14px] px-4 py-3 text-sm sm:px-5 sm:py-3.5 sm:text-base ${active ? "bg-[#e1eef7] text-hayat-blue" : "text-hayat-dark hover:bg-hayat-soft hover:text-hayat-blue"}`}>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
