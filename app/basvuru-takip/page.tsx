import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { SearchCheck } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const statusLabels: Record<string, string> = {
  NEW: "Başvuru alındı",
  IN_REVIEW: "İncelemede",
  MISSING_DOCUMENT: "Eksik evrak",
  BOARD_REVIEW: "Kurul aşamasında",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  COMPLETED: "Tamamlandı"
};

export default async function ApplicationTrackPage({ searchParams }: { searchParams: Promise<{ no?: string; tc?: string }> }) {
  const params = await searchParams;
  const no = params.no?.trim();
  const tc = params.tc?.trim();
  const application = no
    ? await prisma.aidApplication.findFirst({
        where: { applicationNo: no, ...(tc ? { nationalId: tc } : {}) },
        include: { documents: { orderBy: { createdAt: "desc" } }, smsLogs: { orderBy: { createdAt: "desc" }, take: 5 } }
      })
    : null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-hayat-soft py-12">
        <div className="mx-auto max-w-4xl px-5">
          <section className="rounded-[2rem] bg-white p-6 shadow-soft md:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-hayat-green text-white"><SearchCheck /></span>
              <div>
                <h1 className="text-3xl font-black text-hayat-dark">Başvuru Takip</h1>
                <p className="text-slate-500">Başvuru numaranız ile güncel durumu görüntüleyin.</p>
              </div>
            </div>
            <form className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <input name="no" defaultValue={no || ""} required placeholder="Başvuru No: HA-2026-000001" className="rounded-2xl border p-4" />
              <input name="tc" defaultValue={tc || ""} placeholder="TC Kimlik No (isteğe bağlı)" className="rounded-2xl border p-4" />
              <button className="rounded-2xl bg-hayat-green px-6 py-4 font-black text-white">Sorgula</button>
            </form>
          </section>

          {no && !application && (
            <div className="mt-6 rounded-[2rem] bg-white p-8 text-center shadow-sm">
              <p className="font-bold text-slate-600">Bu bilgilerle başvuru bulunamadı.</p>
              <Link href="/basvuru" className="mt-4 inline-block rounded-full bg-hayat-dark px-5 py-3 font-black text-white">Yeni başvuru yap</Link>
            </div>
          )}

          {application && (
            <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-soft md:p-8">
              <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
                <div>
                  <p className="font-black uppercase tracking-[.18em] text-hayat-green">{application.applicationNo || application.id}</p>
                  <h2 className="mt-2 text-3xl font-black text-hayat-dark">{application.fullName}</h2>
                </div>
                <span className="rounded-full bg-hayat-soft px-5 py-3 font-black text-hayat-dark">{statusLabels[application.status]}</span>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4"><b>Telefon</b><p>{application.phone}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><b>Yardım Türü</b><p>{application.aidType}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><b>Başvuru Tarihi</b><p>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(application.createdAt)}</p></div>
              </div>
              <div className="mt-5 rounded-2xl bg-hayat-soft p-5">
                <b className="text-hayat-dark">Durum Notu</b>
                <p className="mt-2 leading-7 text-slate-700">{application.trackingNote || application.adminNote || "Başvurunuz kayda alınmıştır."}</p>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border p-5">
                  <b>Yüklenen Evraklar</b>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {application.documents.map((doc) => <li key={doc.id}><a className="font-bold text-hayat-blue underline" href={doc.url} target="_blank">{doc.filename}</a></li>)}
                    {!application.documents.length && <li>Evrak yüklenmemiş.</li>}
                  </ul>
                </div>
                <div className="rounded-2xl border p-5">
                  <b>Bildirim Kayıtları</b>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {application.smsLogs.map((sms) => <li key={sms.id}>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(sms.createdAt)} - {sms.status}</li>)}
                    {!application.smsLogs.length && <li>Bildirim kaydı yok.</li>}
                  </ul>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
