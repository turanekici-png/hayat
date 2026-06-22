import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "../AdminShell";
import { createAnnouncement, deleteAnnouncement, seedDefaultAnnouncements, updateAnnouncement } from "../actions";
import { BellRing, CheckCircle2, Megaphone, Pin, PlusCircle, Save, Trash2 } from "lucide-react";

const types = [
  ["GENEL", "Genel Duyuru"],
  ["ACIL", "Acil Duyuru"],
  ["KAMPANYA", "Kampanya"],
  ["HABER", "Haber"]
];

function TypeOptions() {
  return <>{types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</>;
}

function isoInput(value?: Date | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
}

export default async function AnnouncementsAdminPage() {
  const announcements = await prisma.announcement.findMany({ orderBy: [{ isPinned: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }] });

  return (
    <AdminShell activePath="/admin/duyurular" contentClassName="max-w-7xl">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="font-black uppercase tracking-[.22em] text-hayat-green">Admin Panel</p>
              <h1 className="mt-2 flex items-center gap-3 text-4xl font-black text-hayat-dark"><BellRing className="text-hayat-blue" /> Duyuru Yönetimi</h1>
              <p className="mt-2 text-slate-500">Ana sayfanın sağındaki duyurular buradan eklenir, sıralanır ve aktif/pasif yapılır.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin" className="rounded-2xl bg-white px-5 py-3 font-black text-hayat-dark shadow-sm">Admin Ana Sayfa</Link>
              <Link href="/" className="rounded-2xl bg-hayat-blue px-5 py-3 font-black text-white shadow-sm">Siteyi Gör</Link>
            </div>
          </div>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-black text-hayat-dark"><PlusCircle className="text-hayat-green" /> Yeni duyuru ekle</h2>
                <p className="mt-2 text-slate-500">Sabitle seçili duyurular sağ panelde en üstte görünür.</p>
              </div>
              {announcements.length === 0 && <form action={seedDefaultAnnouncements}><button className="rounded-2xl bg-hayat-green px-5 py-3 font-black text-white">Örnek Duyuruları Ekle</button></form>}
            </div>
            <form action={createAnnouncement} className="mt-6 grid gap-4 md:grid-cols-12">
              <input name="title" required placeholder="Duyuru başlığı" className="rounded-2xl border p-3 md:col-span-4" />
              <select name="type" className="rounded-2xl border p-3 md:col-span-2"><TypeOptions /></select>
              <input name="sortOrder" type="number" defaultValue="10" className="rounded-2xl border p-3 md:col-span-2" />
              <input name="startDate" type="datetime-local" className="rounded-2xl border p-3 md:col-span-2" />
              <input name="endDate" type="datetime-local" className="rounded-2xl border p-3 md:col-span-2" />
              <textarea name="content" required placeholder="Duyuru metni" className="min-h-28 rounded-2xl border p-3 md:col-span-12" />
              <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 font-bold md:col-span-3"><input name="isActive" type="checkbox" defaultChecked /> Aktif göster</label>
              <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 font-bold md:col-span-3"><input name="isPinned" type="checkbox" /> Sabitle</label>
              <button className="rounded-2xl bg-hayat-blue px-6 py-3 font-black text-white md:col-span-3">Duyuruyu Ekle</button>
            </form>
          </section>

          <section className="mt-6 space-y-4">
            {announcements.map((a) => (
              <form key={a.id} action={updateAnnouncement} className="grid gap-3 rounded-[2rem] bg-white p-5 shadow-sm md:grid-cols-12">
                <input type="hidden" name="id" value={a.id} />
                <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-12">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                    <span className="rounded-full bg-hayat-soft px-3 py-1">Sıra: {a.sortOrder}</span>
                    <span className="rounded-full bg-hayat-soft px-3 py-1">{a.type}</span>
                    {a.isPinned && <span className="inline-flex items-center gap-1 rounded-full bg-hayat-mint px-3 py-1 text-hayat-greenDark"><Pin size={13} /> Sabit</span>}
                    {a.isActive ? <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-green-700"><CheckCircle2 size={13} /> Aktif</span> : <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">Pasif</span>}
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 rounded-xl bg-hayat-green px-4 py-2 font-black text-white"><Save size={16} /> Kaydet</button>
                    <button formAction={deleteAnnouncement} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-black text-white"><Trash2 size={16} /> Sil</button>
                  </div>
                </div>
                <input name="title" defaultValue={a.title} className="rounded-xl border p-3 md:col-span-4" />
                <select name="type" defaultValue={a.type} className="rounded-xl border p-3 md:col-span-2"><TypeOptions /></select>
                <input name="sortOrder" type="number" defaultValue={a.sortOrder} className="rounded-xl border p-3 md:col-span-2" />
                <input name="startDate" type="datetime-local" defaultValue={isoInput(a.startDate)} className="rounded-xl border p-3 md:col-span-2" />
                <input name="endDate" type="datetime-local" defaultValue={isoInput(a.endDate)} className="rounded-xl border p-3 md:col-span-2" />
                <textarea name="content" defaultValue={a.content} className="min-h-24 rounded-xl border p-3 md:col-span-12" />
                <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 font-bold md:col-span-2"><input name="isActive" type="checkbox" defaultChecked={a.isActive} /> Aktif</label>
                <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 font-bold md:col-span-2"><input name="isPinned" type="checkbox" defaultChecked={a.isPinned} /> Sabit</label>
              </form>
            ))}
            {!announcements.length && <div className="rounded-[2rem] bg-white p-8 text-center text-slate-500 shadow-sm"><Megaphone className="mx-auto mb-3 text-hayat-blue" /> Henüz duyuru eklenmedi.</div>}
          </section>
    </AdminShell>
  );
}
