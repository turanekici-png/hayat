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
      <div className="mx-auto flex h-[104px] max-w-[1840px] items-center justify-between gap-6 px-3 sm:px-4 lg:px-4">
        <Link href="/" className="flex h-[92px] w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-white/90 bg-white p-1 shadow-[0_22px_48px_rgba(10,58,85,0.2)] ring-2 ring-hayat-green/15 transition hover:-translate-y-0.5 hover:shadow-[0_26px_54px_rgba(10,58,85,0.24)]" aria-label="Hayat Ağacı Derneği ana sayfa">
          <img src="/media/brand/hayat-agaci-logo.jpg" alt="Hayat Ağacı Derneği" className="h-full w-full scale-125 rounded-[16px] object-contain" />
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

        <div className="flex shrink-0 items-center gap-3">
          <Link href="/bagis" className="inline-flex h-[48px] items-center justify-center rounded-full bg-hayat-green px-7 text-[16px] font-black text-white shadow-green transition hover:-translate-y-0.5 hover:bg-hayat-blue active:scale-95">
            Bağış Yap
          </Link>

          <details className="group relative lg:hidden">
            <summary className="flex h-[44px] w-[44px] cursor-pointer list-none items-center justify-center rounded-full border border-hayat-border bg-white text-hayat-dark shadow-sm [&::-webkit-details-marker]:hidden">
              <Menu size={21} />
            </summary>
            <div className="absolute right-0 top-[calc(100%+12px)] w-[min(310px,calc(100vw-24px))] overflow-hidden rounded-[20px] border border-hayat-border bg-white p-3 shadow-2xl">
              <div className="grid gap-1 text-base font-black">
                {nav.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link key={item.href} href={item.href} className={`rounded-[14px] px-5 py-3.5 ${active ? "bg-[#e1eef7] text-hayat-blue" : "text-hayat-dark hover:bg-hayat-soft hover:text-hayat-blue"}`}>
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
