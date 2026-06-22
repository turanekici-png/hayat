import Link from "next/link";
import { Building2, Eye, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "../AdminShell";
import { saveBankAccountsPage } from "./actions";

const defaultContent = `Banka Adı: 
Hesap Adı: Hayat Ağacı Derneği
IBAN: TR
Açıklama: Bağış`;

export default async function BankAccountsAdminPage() {
  const page = await prisma.policyPage.findUnique({ where: { type: "BANK_ACCOUNTS" } }).catch(() => null);

  return (
    <AdminShell activePath="/admin/hesaplar" contentClassName="max-w-5xl">
          <div className="mb-6 rounded-[2rem] bg-hayat-dark p-6 text-white shadow-soft">
            <p className="flex items-center gap-2 font-black uppercase tracking-[.18em] text-hayat-gold">
              <Building2 size={18} /> Hesap / Banka Bilgileri
            </p>
            <h1 className="mt-3 text-4xl font-black">Hesap Numaralarımız</h1>
            <p className="mt-2 text-white/70">Üst menüdeki “Hesap Numaralarımız” sayfasında görünecek banka, hesap adı, IBAN ve açıklama bilgilerini buradan yönetin.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/admin" className="rounded-full bg-white/10 px-5 py-3 font-black">Admin Panele Dön</Link>
              <Link href="/hesap-numaralarimiz" className="inline-flex items-center gap-2 rounded-full bg-hayat-gold px-5 py-3 font-black text-hayat-dark">
                <Eye size={16} /> Sayfayı Gör
              </Link>
            </div>
          </div>

          <form action={saveBankAccountsPage} className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-hayat-green">/hesap-numaralarimiz</p>
                <p className="mt-1 text-sm font-bold text-slate-500">Header menüsündeki hesap bilgileri bağlantısı bu sayfaya gider.</p>
              </div>
              <label className="flex items-center gap-2 rounded-full bg-hayat-soft px-4 py-2 font-bold">
                <input name="isActive" type="checkbox" defaultChecked={page?.isActive ?? true} /> Aktif
              </label>
            </div>

            <label className="text-sm font-black text-slate-600">Sayfa Başlığı</label>
            <input name="title" defaultValue={page?.title || "Hesap Numaralarımız"} className="mt-2 w-full rounded-2xl border p-4 text-xl font-black" />

            <label className="mt-5 block text-sm font-black text-slate-600">Banka ve Hesap Bilgileri</label>
            <textarea name="content" defaultValue={page?.content || defaultContent} rows={12} className="mt-2 w-full rounded-2xl border p-4 text-base font-semibold leading-8" />

            <button className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-hayat-green px-6 py-3 font-black text-white">
              <Save size={18} /> Kaydet
            </button>
          </form>
    </AdminShell>
  );
}
