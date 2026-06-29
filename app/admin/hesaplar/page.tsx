import Link from "next/link";
import { Building2, Eye, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "../AdminShell";
import { saveBankAccountsPage } from "./actions";
import { BankAccountsEditor } from "./BankAccountsEditor";
import { parseBankAccountsContent } from "@/lib/bank-accounts";
import { normalizeMediaUrl } from "@/lib/media-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BankAccountsAdminPage() {
  const [page, media] = await Promise.all([
    prisma.policyPage.findFirst({
      where: {
        OR: [
          { type: "BANK_ACCOUNTS" },
          { slug: "hesap-numaralarimiz" }
        ]
      }
    }).catch(() => null),
    prisma.mediaAsset.findMany({
      select: {
        id: true,
        title: true,
        url: true,
        filename: true,
        mimeType: true
      },
      orderBy: { createdAt: "desc" },
      take: 24
    }).catch(() => [])
  ]);
  const parsed = parseBankAccountsContent(page?.content);
  const safeMedia = media
    .filter((item) => item.url.trim().length > 0)
    .map((item) => ({ ...item, url: normalizeMediaUrl(item.url) || item.url }));

  return (
    <AdminShell activePath="/admin/hesaplar" contentClassName="max-w-6xl">
      <div className="mb-6 rounded-[20px] bg-hayat-dark p-6 text-white shadow-soft">
        <p className="flex items-center gap-2 font-black uppercase text-hayat-gold">
          <Building2 size={18} /> Hesap / Banka Bilgileri
        </p>
        <h1 className="mt-3 text-4xl font-black">Hesap Numaralarımız</h1>
        <p className="mt-2 text-white/70">Üst menüdeki “Hesap No” sayfasında görünecek banka logolarını, bağış gruplarını ve IBAN bilgilerini buradan yönetin.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/admin" className="rounded-[14px] bg-white/10 px-5 py-3 font-black">Admin Panele Dön</Link>
          <Link href="/hesap-numaralarimiz" className="inline-flex items-center gap-2 rounded-[14px] bg-hayat-gold px-5 py-3 font-black text-hayat-dark">
            <Eye size={16} /> Sayfayı Gör
          </Link>
        </div>
      </div>

      <form action={saveBankAccountsPage} className="rounded-[20px] border border-hayat-border bg-white p-6 shadow-stk">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-hayat-green">/hesap-numaralarimiz</p>
            <p className="mt-1 text-sm font-bold text-[#5d6b70]">Header menüsündeki “Hesap No” bağlantısı bu sayfaya gider.</p>
          </div>
          <label className="flex items-center gap-2 rounded-full bg-hayat-soft px-4 py-2 font-bold">
            <input name="isActive" type="checkbox" defaultChecked={page?.isActive ?? true} /> Aktif
          </label>
        </div>

        <label className="text-sm font-black text-[#5d6b70]">Sayfa Başlığı</label>
        <input name="title" defaultValue={page?.title || "Banka havalesi ile bağış"} className="mt-2 w-full rounded-[14px] border border-hayat-border bg-hayat-soft p-4 text-xl font-black text-hayat-dark outline-hayat-blue" />

        <label className="mt-5 block text-sm font-black text-[#5d6b70]">Sayfa Açıklaması</label>
        <textarea name="note" defaultValue={parsed.note} rows={4} className="mt-2 w-full rounded-[14px] border border-hayat-border bg-hayat-soft p-4 text-base font-semibold leading-7 text-hayat-dark outline-hayat-blue" />

        <BankAccountsEditor accounts={parsed.accounts} media={safeMedia} />

        <button className="mt-6 inline-flex items-center gap-2 rounded-[14px] bg-hayat-green px-6 py-3 font-black text-white shadow-green hover:bg-hayat-blue">
          <Save size={18} /> Kaydet
        </button>
      </form>
    </AdminShell>
  );
}
