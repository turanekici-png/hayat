import Link from "next/link";
import { FileText, Save, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPolicyConsentItems, policyConsentDefaults } from "@/lib/policy-consents";
import { AdminShell } from "../AdminShell";
import { seedDefaultPolicies, updatePolicyConsentTexts, updatePolicyPage } from "../actions";

const labels: Record<string, string> = {
  KVKK: "KVKK Aydınlatma Metni",
  TERMS_PRIVACY: "Kullanım Koşulları ve Gizlilik Politikası",
  REFUND: "İade Politikası",
  COOKIE: "Çerez Politikası"
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PolicyAdminPage() {
  const [policies, consentItems] = await Promise.all([
    prisma.policyPage.findMany({
      where: { type: { notIn: policyConsentDefaults.map((item) => item.type) } },
      orderBy: { createdAt: "asc" }
    }),
    getPolicyConsentItems()
  ]);
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
            <form action={updatePolicyConsentTexts} className="rounded-[2rem] border border-[#dce9d2] bg-[#f5fbef] p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-hayat-green"><ShieldCheck size={16} /> Bağış formu onay kutusu metinleri</p>
                  <h2 className="mt-2 text-2xl font-black text-hayat-dark">Ziyaretçinin bağış sırasında göreceği bilgiler</h2>
                  <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                    Aşağıdaki cümleler online bağış formundaki KVKK/Politikalar onay alanında görünür. Cümle içinde ilgili politika başlığı geçerse otomatik olarak linklenir.
                  </p>
                </div>
                <button className="inline-flex items-center gap-2 rounded-2xl bg-hayat-green px-6 py-3 font-black text-white"><Save size={18} /> Onay Metinlerini Kaydet</button>
              </div>
              <div className="space-y-3">
                {consentItems.map((item) => (
                  <label key={item.type} className="block rounded-2xl border border-[#dce9d2] bg-white/75 p-4">
                    <span className="text-xs font-black uppercase tracking-wide text-hayat-blue">{item.linkLabel}</span>
                    <input
                      name={item.type}
                      defaultValue={item.text}
                      className="mt-2 w-full rounded-xl border border-[#d9e4ec] bg-white p-3 text-sm font-bold text-slate-700 outline-hayat-blue"
                    />
                    <span className="mt-2 block text-xs font-semibold text-slate-500">Bağlantı: {item.href}</span>
                  </label>
                ))}
              </div>
            </form>

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
