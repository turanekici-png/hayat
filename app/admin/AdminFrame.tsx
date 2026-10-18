import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  Beef,
  Bell,
  Building2,
  ClipboardList,
  Eye,
  FileText,
  Heart,
  ImageIcon,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  PiggyBank,
  Settings2,
  SlidersHorizontal,
  UserCog,
  WalletCards
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { optimizedImageSrc } from "@/lib/image-src";
import { AdminNavLink } from "./AdminNavLink";

type NavItem = { href: string; label: string; icon: typeof Activity; countKey?: StatKey };
type StatKey = "newApplications" | "donations" | "announcements" | "sacrifices";

// Menu gruplari: admin panelindeki tum sayfalar tek yerden, her ekran boyutunda erisilebilir.
const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "İçerik",
    items: [
      { href: "/admin?sayfa=anasayfa", label: "Ana Sayfa Alanları", icon: LayoutDashboard },
      { href: "/admin?sayfa=istatistik", label: "Bugüne Kadar (Rakamlar)", icon: ListOrdered },
      { href: "/admin/duyurular", label: "Duyurular", icon: Bell, countKey: "announcements" },
      { href: "/admin?sayfa=popup", label: "Popup", icon: Settings2 },
      { href: "/admin?sayfa=medya", label: "Resim / Video", icon: ImageIcon }
    ]
  },
  {
    title: "Bağış & Başvuru",
    items: [
      { href: "/admin/bagislar", label: "Bağış Listesi", icon: PiggyBank, countKey: "donations" },
      { href: "/admin/odeme-loglari", label: "Ödeme Logları", icon: Activity },
      { href: "/admin?sayfa=bagis", label: "Bağış Türleri", icon: Heart },
      { href: "/admin/basvurular", label: "Yardım Başvuruları", icon: ClipboardList, countKey: "newApplications" },
      { href: "/admin/kurban", label: "Kurban Organizasyonu", icon: Beef, countKey: "sacrifices" }
    ]
  },
  {
    title: "Ayarlar",
    items: [
      { href: "/admin/ayarlar", label: "Site Ayarları", icon: SlidersHorizontal },
      { href: "/admin/hesaplar", label: "Hesap / Banka Bilgileri", icon: WalletCards },
      { href: "/admin/politikalar", label: "KVKK / Politikalar", icon: FileText },
      { href: "/admin?sayfa=kullanicilar", label: "Kullanıcılar", icon: UserCog }
    ]
  }
];

async function loadNavCounts(): Promise<Record<StatKey, number>> {
  const [newApplications, donations, announcements, sacrifices] = await Promise.all([
    prisma.aidApplication.count({ where: { status: "NEW" } }),
    prisma.donation.count(),
    prisma.announcement.count(),
    prisma.sacrificeOrder.count()
  ]).catch(() => [0, 0, 0, 0]);
  return { newApplications, donations, announcements, sacrifices };
}

// Her admin sayfasinda tekrar sorgulanmasin diye kisa sure onbelleklenir.
const getNavCounts = unstable_cache(loadNavCounts, ["admin-nav-counts"], { revalidate: 30 });

/** Eski "activePath" degerlerini menu adreslerine cevirir ("/admin" -> ana sayfa alanlari). */
function normalizeActive(active: string) {
  return active === "/admin" ? "/admin?sayfa=anasayfa" : active;
}

export async function AdminFrame({ active, children, contentClassName = "max-w-7xl" }: { active: string; children: ReactNode; contentClassName?: string }) {
  const counts = await getNavCounts();
  const activeHref = normalizeActive(active);

  return (
    <div className="admin-mobile-scope min-h-screen bg-[#eef2f5] font-montserrat text-hayat-ink">
      <header className="sticky top-0 z-[100] border-b border-white/10 bg-hayat-dark text-white">
        <div className="flex h-16 items-center justify-between gap-3 px-3 md:px-5">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1">
              <img src={optimizedImageSrc("/media/brand/hayat-agaci-logo.jpg", 128)} alt="" className="h-full w-full object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-black leading-tight">Hayat Ağacı Derneği</span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">Yönetim Paneli</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/" target="_blank" className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-3.5 text-sm font-black transition hover:bg-white/20">
              <Eye size={16} /> <span className="hidden sm:inline">Siteyi Gör</span>
            </Link>
            {/* Cikis bir route handler: oturum cerezi silinsin diye tam sayfa gecisi gerekir. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/admin/logout" className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-3.5 text-sm font-black transition hover:bg-red-500/80">
              <LogOut size={16} /> <span className="hidden sm:inline">Çıkış</span>
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 px-3 py-4 md:px-5 lg:flex-row lg:items-start">
        <aside className="admin-sidebar-scroll w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:w-[268px] lg:overflow-y-auto">
          <nav aria-label="Yönetim menüsü" className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 pb-1.5 pt-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{group.title}</p>
                <div className="grid gap-0.5">
                  {group.items.map(({ href, label, icon: Icon, countKey }) => {
                    const isActive = activeHref === href;
                    const count = countKey ? counts[countKey] : 0;
                    return (
                      <AdminNavLink
                        key={href}
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${isActive ? "bg-hayat-dark text-white" : "text-slate-600 hover:bg-slate-100 hover:text-hayat-dark"}`}
                      >
                        <Icon size={17} className={isActive ? "text-white" : "text-slate-400"} />
                        <span className="min-w-0 flex-1 truncate">{label}</span>
                        {count > 0 && (
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black ${isActive ? "bg-white/20 text-white" : countKey === "newApplications" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"}`}>
                            {count}
                          </span>
                        )}
                      </AdminNavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="mt-4 hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-500 lg:flex">
            <Building2 size={14} /> Değişiklikler sitede birkaç saniye içinde görünür.
          </div>
        </aside>

        <main className={`admin-panel-content w-full min-w-0 flex-1 ${contentClassName}`}>{children}</main>
      </div>
    </div>
  );
}
