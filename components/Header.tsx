"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import { ClipboardList, Menu } from "lucide-react";
import { usePublicSiteSettings } from "@/components/SiteSettingsProvider";
import { optimizedImageSrc, optimizedImageSrcSet } from "@/lib/image-src";

const nav = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Kurumsal", href: "/kurumsal" },
  { label: "Faaliyetler", href: "/faaliyetler" },
  { label: "Projeler", href: "/projeler" },
  { label: "Haberler", href: "/haberler" },
  { label: "Galeri", href: "/galeri" },
  { label: "Hesap No", href: "/hesap-numaralarimiz" },
  { label: "İletişim", href: "/iletisim" }
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Menu sayfalari sayfa acildiktan sonra, tarayici bostayken arka planda tam olarak
// onceden yuklenir; menuye tiklandiginda sayfa sunucuyu beklemeden aninda acilir.
// (Mobilde menu kapali oldugu icin Link'in kendi on yuklemesi devreye girmiyordu.)
const prefetchTargets = [...nav.map((item) => item.href), "/bagis"];

function usePrefetchNavigation(pathname: string) {
  const router = useRouter();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g") return;

    const run = () => {
      for (const href of prefetchTargets) {
        if (href !== pathname) router.prefetch(href, { kind: PrefetchKind.FULL });
      }
    };

    // Dar bant genisliginde sayfanin kendi gorselleriyle yarismasin diye on yukleme,
    // sayfa tamamen yuklendikten sonra ve tarayici bostayken baslar.
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
    let timer: number | undefined;
    let idleId: number | undefined;
    const start = () => {
      timer = window.setTimeout(() => {
        if (idle) idleId = idle(run, { timeout: 4000 });
        else run();
      }, 2500);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      if (timer) window.clearTimeout(timer);
      if (idleId) window.cancelIdleCallback?.(idleId);
    };
  }, [pathname, router]);
}

export function Header() {
  const pathname = usePathname() || "/";
  usePrefetchNavigation(pathname);
  const { applicationsEnabled, applicationHref, applicationIsExternal } = usePublicSiteSettings();
  const externalProps = applicationIsExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <header className="sticky top-0 z-[100] w-full border-y border-[#d7e5ec]/75 bg-[#f7f5ef]/82 shadow-[0_10px_30px_rgba(10,58,85,0.06)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#f7f5ef]/72">
      <div className="mx-auto flex h-[86px] max-w-[1840px] items-center justify-between gap-2 px-3 sm:h-[100px] sm:px-4 lg:h-[116px] lg:gap-5 lg:px-4">
        <Link href="/" className="block min-w-0 shrink" aria-label="Hayat Ağacı Derneği ana sayfa">
          <img
            src={optimizedImageSrc("/media/brand/logolar-vektorel-yatay.png", 640)}
            srcSet={optimizedImageSrcSet("/media/brand/logolar-vektorel-yatay.png", [384, 640, 828])}
            sizes="(min-width: 1024px) 270px, 220px"
            alt="Hayat Ağacı Derneği"
            loading="eager"
            decoding="async"
            className="h-[104px] w-auto max-w-[min(60vw,350px)] object-contain sm:h-[122px] sm:max-w-[480px] lg:h-[148px] lg:max-w-[700px]"
          />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-5 lg:flex xl:gap-7 2xl:gap-9">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex h-[116px] items-center whitespace-nowrap text-[15px] font-bold transition-colors xl:text-[16px] ${active ? "text-hayat-dark" : "text-[#23323a] hover:text-hayat-blue"}`}
              >
                {item.label}
                {active && <span className="absolute bottom-[28px] left-0 h-[2px] w-full rounded-full bg-hayat-blue" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {applicationsEnabled && (
            <a
              href={applicationHref}
              {...externalProps}
              className="hidden h-[48px] items-center justify-center gap-2 rounded-full border-2 border-hayat-dark px-5 text-[15px] font-black text-hayat-dark transition hover:bg-hayat-dark hover:text-white xl:inline-flex"
            >
              <ClipboardList size={17} /> Yardım Başvurusu
            </a>
          )}
          <Link href="/bagis" className="inline-flex h-[38px] items-center justify-center rounded-full bg-hayat-green px-3.5 text-[12px] font-black text-white shadow-green transition hover:-translate-y-0.5 hover:bg-hayat-blue active:scale-95 sm:h-[42px] sm:px-5 sm:text-[14px] lg:h-[48px] lg:px-7 lg:text-[16px]">
            Bağış Yap
          </Link>

          <details className="group relative lg:hidden">
            <summary className="flex h-[38px] w-[38px] cursor-pointer list-none items-center justify-center rounded-full border border-hayat-border bg-white text-hayat-dark shadow-sm [&::-webkit-details-marker]:hidden sm:h-[44px] sm:w-[44px]">
              <Menu size={19} />
            </summary>
            <div className="absolute right-0 top-[calc(100%+10px)] w-[min(330px,calc(100vw-24px))] overflow-hidden rounded-[20px] border border-hayat-border bg-white p-2 shadow-2xl sm:p-3">
              <div className="grid gap-1 text-base font-black">
                {applicationsEnabled && (
                  <a href={applicationHref} {...externalProps} className="mb-1 flex items-center gap-2 rounded-[14px] bg-hayat-dark px-4 py-3 text-sm text-white sm:px-5 sm:py-3.5 sm:text-base">
                    <ClipboardList size={17} /> Yardım Başvurusu
                  </a>
                )}
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
