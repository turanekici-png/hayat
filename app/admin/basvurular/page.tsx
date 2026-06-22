import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "../AdminShell";
import { deleteApplication, updateApplicationStatus } from "../actions";
import { ClipboardList, Download, Eye, Save, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const statusLabels: Record<string, string> = {
  NEW: "Yeni başvuru",
  IN_REVIEW: "İncelemede",
  MISSING_DOCUMENT: "Eksik evrak",
  BOARD_REVIEW: "Kurul aşamasında",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  COMPLETED: "Tamamlandı"
};

const aidTypeLabels: Record<string, string> = {
  GIDA: "Gıda Yardımı",
  NAKIT: "Nakit Yardımı",
  GIYIM: "Giyim Yardımı",
  EGITIM: "Eğitim Yardımı",
  SAGLIK: "Sağlık Yardımı",
  BARINMA: "Barınma Yardımı",
  DIGER: "Diğer"
};

export default async function AdminApplicationsPage() {
  const [applications, counts] = await Promise.all([
    prisma.aidApplication.findMany({
      orderBy: { createdAt: "desc" },
      include: { documents: { orderBy: { createdAt: "desc" } }, smsLogs: { orderBy: { createdAt: "desc" }, take: 3 } }
    }),
    Promise.all([
      prisma.aidApplication.count(),
      prisma.aidApplication.count({ where: { status: "NEW" } }),
      prisma.aidApplication.count({ where: { status: "IN_REVIEW" } }),
      prisma.aidApplication.count({ where: { status: "APPROVED" } })
    ])
  ]);

  return (
    <AdminShell activePath="/admin/basvurular" contentClassName="max-w-[1500px]">
          <div className="mb-6 flex flex-col justify-between gap-4 rounded-[2rem] bg-hayat-dark p-6 text-white shadow-soft md:flex-row md:items-center">
            <div>
              <p className="flex items-center gap-2 font-black uppercase tracking-[.18em] text-hayat-gold"><ClipboardList size={18} /> Yardım Başvuruları</p>
              <h1 className="mt-3 text-4xl font-black">Online başvuru yönetimi</h1>
              <p className="mt-2 text-white/65">Başvuru takip, evrak, durum, SMS ve inceleme notları tek ekranda.</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-bold">
              <Link href="/admin" className="rounded-full bg-white/10 px-5 py-3">Admin Panele Dön</Link>
              <Link href="/basvuru-takip" className="rounded-full bg-white/10 px-5 py-3"><Eye className="mr-1 inline" size={16} /> Takip Ekranı</Link>
              <Link href="/basvuru" className="rounded-full bg-hayat-gold px-5 py-3 text-hayat-dark">Başvuru Formu</Link>
            </div>
          </div>

          <section className="mb-6 grid gap-4 md:grid-cols-4">
            {[[counts[0], "Toplam başvuru"], [counts[1], "Yeni"], [counts[2], "İnceleniyor"], [counts[3], "Onaylı"]].map(([value, label]) => (
              <div key={label as string} className="rounded-[1.5rem] bg-white p-5 shadow-sm">
                <b className="block text-3xl text-hayat-green">{value}</b>
                <span className="font-bold text-slate-600">{label}</span>
              </div>
            ))}
          </section>

          <section className="space-y-4">
            {applications.map((app) => (
              <article key={app.id} className="rounded-[2rem] bg-white p-5 shadow-sm">
                <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
                      <div>
                        <p className="font-black uppercase tracking-[.12em] text-hayat-green">{app.applicationNo || app.id}</p>
                        <h2 className="mt-1 text-2xl font-black text-hayat-dark">{app.fullName}</h2>
                        <p className="mt-1 text-sm font-bold text-slate-500">{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(app.createdAt)}</p>
                      </div>
                      <span className="rounded-full bg-hayat-soft px-4 py-2 text-sm font-black text-hayat-dark">{statusLabels[app.status]}</span>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-4"><b>Telefon</b><p>{app.phone}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-4"><b>TC</b><p>{app.nationalId || "-"}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-4"><b>Yardım Türü</b><p>{aidTypeLabels[app.aidType]}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-4"><b>Adres</b><p>{[app.city, app.district].filter(Boolean).join(" / ") || "-"}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-4"><b>Hane</b><p>{app.householdCount || "-"}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-4"><b>Aylık Gelir</b><p>{app.monthlyIncome ? `${app.monthlyIncome.toString()} TL` : "-"}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-4"><b>Çalışma</b><p>{app.employment || "-"}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-4"><b>Araç</b><p>{app.vehicleInfo || "-"}</p></div>
                    </div>
                    <div className="mt-4 rounded-2xl bg-hayat-soft p-4">
                      <b className="text-hayat-dark">Açıklama</b>
                      <p className="mt-2 leading-7 text-slate-600">{app.description}</p>
                    </div>
                    {app.address && <div className="mt-4 rounded-2xl bg-slate-50 p-4"><b>Adres Detayı</b><p className="mt-2 text-slate-600">{app.address}</p></div>}
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border p-4"><b>Evraklar</b><div className="mt-3 space-y-2">{app.documents.map((doc) => <a key={doc.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-bold text-hayat-blue underline" href={doc.url} target="_blank"><Download size={16} /> {doc.filename}</a>)}{!app.documents.length && <p className="text-sm text-slate-500">Evrak yok.</p>}</div></div>
                      <div className="rounded-2xl border p-4"><b>SMS kayıtları</b><div className="mt-3 space-y-2">{app.smsLogs.map((sms) => <p key={sms.id} className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{sms.status} - {sms.message}</p>)}{!app.smsLogs.length && <p className="text-sm text-slate-500">SMS kaydı yok.</p>}</div></div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] bg-slate-50 p-4">
                    <form action={updateApplicationStatus} className="space-y-3">
                      <input type="hidden" name="id" value={app.id} />
                      <label className="block font-bold text-slate-700">Durum</label>
                      <select name="status" defaultValue={app.status} className="w-full rounded-2xl border p-3">
                        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <label className="block font-bold text-slate-700">Vatandaş takip notu</label>
                      <textarea name="trackingNote" defaultValue={app.trackingNote || ""} className="min-h-24 w-full rounded-2xl border p-3" placeholder="Vatandaş takip ekranında göreceği not" />
                      <label className="block font-bold text-slate-700">Admin notu</label>
                      <textarea name="adminNote" defaultValue={app.adminNote || ""} className="min-h-28 w-full rounded-2xl border p-3" placeholder="İç inceleme notu" />
                      <label className="flex items-center gap-2 rounded-2xl bg-white p-3 font-bold text-slate-700"><input name="sendStatusSms" type="checkbox" /> Durum SMS bildirimi oluştur</label>
                      <button className="w-full rounded-2xl bg-hayat-green px-5 py-3 font-black text-white"><Save className="mr-1 inline" size={16} /> Kaydet</button>
                    </form>
                    <form action={deleteApplication} className="mt-3">
                      <input type="hidden" name="id" value={app.id} />
                      <button className="w-full rounded-2xl bg-red-50 px-5 py-3 font-black text-red-600"><Trash2 className="mr-1 inline" size={16} /> Başvuruyu Sil</button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
            {!applications.length && <div className="rounded-[2rem] bg-white p-10 text-center text-slate-500 shadow-sm">Henüz online yardım başvurusu bulunmuyor.</div>}
          </section>
    </AdminShell>
  );
}
