import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, Beef, ClipboardList, Eye, FileText, LayoutDashboard, Megaphone, PiggyBank, WalletCards } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { prisma } from "@/lib/prisma";
import { AdminNavLink } from "./AdminNavLink";

type AdminShellProps = {
  activePath?: string;
  children: ReactNode;
  contentClassName?: string;
};

const adminLinks = [
  { href: "/admin", label: "Admin Ana Sayfa", icon: LayoutDashboard },
  { href: "/admin/duyurular", label: "Duyurular", icon: Megaphone },
  { href: "/admin/basvurular", label: "Yardım Başvuruları", icon: ClipboardList },
  { href: "/admin/bagislar", label: "Bağış Listesi", icon: PiggyBank },
  { href: "/admin/odeme-loglari", label: "Ödeme Logları", icon: Activity },
  { href: "/admin/kurban", label: "Kurban Organizasyonu", icon: Beef },
  { href: "/admin/hesaplar", label: "Hesap / Banka Bilgileri", icon: WalletCards },
  { href: "/admin/politikalar", label: "KVKK / Politikalar", icon: FileText }
];

async function getSidebarStats() {
  const [sectionCount, activeSectionCount, mediaCount, announcementCount, applicationCount, newApplicationCount, donationCount, paymentLogCount, sacrificeCount] = await Promise.all([
    prisma.siteSection.count(),
    prisma.siteSection.count({ where: { isActive: true } }),
    prisma.mediaAsset.count(),
    prisma.announcement.count(),
    prisma.aidApplication.count(),
    prisma.aidApplication.count({ where: { status: "NEW" } }),
    prisma.donation.count(),
    prisma.paymentLog.count(),
    prisma.sacrificeOrder.count()
  ]);

  return [
    [sectionCount, "Alan"],
    [activeSectionCount, "Aktif"],
    [mediaCount, "Medya"],
    [announcementCount, "Duyuru"],
    [applicationCount, "Başvuru"],
    [newApplicationCount, "Yeni"],
    [donationCount, "Bağış"],
    [paymentLogCount, "POS Log"],
    [sacrificeCount, "Kurban"]
  ] as const;
}

export async function AdminShell({ activePath = "/admin", children, contentClassName = "max-w-7xl" }: AdminShellProps) {
  const stats = await getSidebarStats();

  return (
    <>
      <Header />
      <main className="admin-mobile-scope min-h-screen overflow-x-hidden bg-slate-100 py-3 md:py-4">
        <div className="mx-auto w-full px-3 md:px-5 xl:px-6">
          <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_280px]">
            <aside className="admin-sidebar-scroll rounded-[1.4rem] bg-hayat-blue p-3 text-white shadow-soft sm:p-4 lg:sticky lg:top-3 lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-auto">
              <div className="rounded-[1.1rem] bg-white/10 p-4">
                <p className="flex items-center gap-2 font-black uppercase tracking-[.18em] text-white/80">
                  <LayoutDashboard size={18} /> Yönetim Paneli
                </p>
                <h1 className="mt-2 text-2xl font-black leading-tight">İçerik yönetimi</h1>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {stats.map(([value, label]) => (
                  <div key={label} className="rounded-xl bg-white/10 p-3">
                    <b className="block text-xl text-white">{value}</b>
                    {label}
                  </div>
                ))}
              </div>

              <nav className="mt-4 grid gap-2 text-sm font-black sm:grid-cols-2 lg:block lg:space-y-2">
                <Link href="/" className="flex items-center justify-center gap-2 rounded-xl bg-hayat-green px-4 py-3 text-white">
                  <Eye size={18} /> Siteyi Gör
                </Link>
                {adminLinks.map(({ href, label, icon: Icon }) => {
                  const isActive = activePath === href;
                  return (
                    <AdminNavLink
                      key={href}
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 transition-colors ${isActive ? "bg-white text-hayat-blue" : "bg-white/10 text-white hover:bg-hayat-green"}`}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </AdminNavLink>
                  );
                })}
              </nav>
            </aside>

            <div className={`admin-panel-content w-full min-w-0 ${contentClassName}`}>{children}</div>

            <aside className="admin-sidebar-scroll hidden rounded-[1.5rem] bg-white p-5 shadow-sm xl:sticky xl:top-3 xl:block xl:max-h-[calc(100vh-1.5rem)] xl:overflow-y-auto">
              <div className="mb-5 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-hayat-dark">Çalışma Alanları</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">Yönetmek istediğiniz bölümü seçin.</p>
              </div>
              <nav className="flex flex-col gap-3">
                {adminLinks.map(({ href, label, icon: Icon }) => {
                  const isActive = activePath === href;

                  return (
                    <AdminNavLink
                      key={href}
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${isActive ? "bg-hayat-blue text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-hayat-soft hover:text-hayat-blue"}`}
                    >
                      <Icon size={18} className={isActive ? "text-white" : "text-slate-400 group-hover:text-hayat-blue"} />
                      <span className="truncate">{label}</span>
                    </AdminNavLink>
                  );
                })}
              </nav>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
