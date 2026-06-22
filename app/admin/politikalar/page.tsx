import Link from "next/link";
import { FileText, Save, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "../AdminShell";
import { seedDefaultPolicies, updatePolicyPage } from "../actions";

const labels: Record<string, string> = {
  KVKK: "KVKK Aydınlatma Metni",
  TERMS_PRIVACY: "Kullanım Koşulları ve Gizlilik Politikası",
  REFUND: "İade Politikası",
  COOKIE: "Çerez Politikası"
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PolicyAdminPage() {
  const policies = await prisma.policyPage.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <AdminShell activePath="/admin/politikalar" contentClassName="max-w-6xl">
          <div className="mb-6 rounded-[2rem] bg-hayat-dark p-6 text-white shadow-soft">
            <p className="flex items-center gap-2 font-black uppercase tracking-[.18em] text-hayat-gold"><ShieldCheck size={18} /> Kurumsal Sayfalar</p>
            <h1 className="mt-3 text-4xl font-black">KVKK, gizlilik ve iade metinleri</h1>
            <p className="mt-2 text-white/65">Online bağış alanındaki yasal onay linkleri ve footer bağlantıları buradaki metinleri gösterir.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/admin" className="rounded-full bg-white/10 px-5 py-3 font-black">Admin Panele Dön</Link>
              {policies.length === 0 && <form action={seedDefaultPolicies}><button className="rounded-full bg-hayat-gold px-5 py-3 font-black text-hayat-dark">Varsayılan Metinleri Oluştur</button></form>}
            </div>
          </div>
          <div className="space-y-5">
            {policies.map((policy) => (
              <form key={policy.id} action={updatePolicyPage} className="rounded-[2rem] bg-white p-6 shadow-sm">
                <input type="hidden" name="id" value={policy.id} />
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-hayat-green"><FileText size={16} /> {labels[policy.type] || policy.type}</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">/{policy.slug}</p>
                  </div>
                  <label className="flex items-center gap-2 rounded-full bg-hayat-soft px-4 py-2 font-bold"><input name="isActive" type="checkbox" defaultChecked={policy.isActive} /> Aktif</label>
                </div>
                <input name="title" defaultValue={policy.title} className="w-full rounded-2xl border p-4 text-xl font-black" />
                <textarea name="content" defaultValue={policy.content} rows={12} className="mt-4 w-full rounded-2xl border p-4 leading-7" />
                <button className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-hayat-green px-6 py-3 font-black text-white"><Save size={18} /> Kaydet</button>
              </form>
            ))}
            {!policies.length && <p className="rounded-2xl bg-white p-6 text-slate-600 shadow-sm">Henüz politika metni yok. Yukarıdaki “Varsayılan Metinleri Oluştur” butonuna basın.</p>}
          </div>
    </AdminShell>
  );
}
