import { Activity, AlertTriangle, CheckCircle2, Clock3, Search } from "lucide-react";
import { AdminShell } from "../AdminShell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<{
  status?: string | string[];
  event?: string | string[];
  q?: string | string[];
}>;

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function statusStyle(status: string) {
  if (status === "PAID") return "bg-green-100 text-green-800";
  if (status === "FAILED") return "bg-red-100 text-red-800";
  if (status === "PENDING") return "bg-amber-100 text-amber-800";
  return "bg-blue-100 text-blue-800";
}

function statusIcon(status: string) {
  if (status === "PAID") return <CheckCircle2 size={16} />;
  if (status === "FAILED") return <AlertTriangle size={16} />;
  return <Clock3 size={16} />;
}

function eventLabel(event: string) {
  const labels: Record<string, string> = {
    PAYMENT_START_REQUESTED: "Ödeme başlatıldı",
    PAYMENT_REDIRECT_CREATED: "Banka yönlendirmesi üretildi",
    PAYMENT_START_FAILED: "Ödeme başlatılamadı",
    BANK_OK_CALLBACK_RECEIVED: "Başarılı dönüş alındı",
    BANK_OK_CALLBACK_UNMATCHED: "Eşleşmeyen banka dönüşü",
    BANK_PAYMENT_RESULT: "Banka ödeme sonucu",
    BANK_PROVISION_RESULT: "Provizyon sonucu",
    BANK_CALLBACK_PROCESSING_FAILED: "Callback işleme hatası",
    BANK_OK_CALLBACK_INVALID_METHOD: "Geçersiz callback yöntemi",
    BANK_FAIL_CALLBACK_RECEIVED: "Başarısız banka dönüşü",
    BANK_FAIL_CALLBACK_GET: "Başarısız GET dönüşü",
    GENERIC_CALLBACK_RECEIVED: "Genel callback"
  };
  return labels[event] || event;
}

function prettyDetails(details: string | null) {
  if (!details) return "";
  try {
    return JSON.stringify(JSON.parse(details), null, 2);
  } catch {
    return details;
  }
}

export default async function PaymentLogsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = firstParam(params.status).trim();
  const event = firstParam(params.event).trim();
  const query = firstParam(params.q).trim();

  const [logs, statusGroups, eventGroups] = await Promise.all([
    prisma.paymentLog.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(event ? { event } : {}),
        ...(query
          ? {
              OR: [
                { paymentRef: { contains: query, mode: "insensitive" } },
                { responseCode: { contains: query, mode: "insensitive" } },
                { message: { contains: query, mode: "insensitive" } },
                { donation: { fullName: { contains: query, mode: "insensitive" } } }
              ]
            }
          : {})
      },
      include: {
        donation: {
          select: {
            fullName: true,
            amount: true,
            receiptNo: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 300
    }),
    prisma.paymentLog.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.paymentLog.groupBy({ by: ["event"], _count: { _all: true }, orderBy: { event: "asc" } })
  ]);

  const total = statusGroups.reduce((sum, group) => sum + group._count._all, 0);
  const paid = statusGroups.find((group) => group.status === "PAID")?._count._all || 0;
  const failed = statusGroups.find((group) => group.status === "FAILED")?._count._all || 0;
  const pending = statusGroups.find((group) => group.status === "PENDING")?._count._all || 0;

  return (
    <AdminShell activePath="/admin/odeme-loglari" contentClassName="max-w-[1500px]">
      <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[.16em] text-hayat-green">
              <Activity size={18} /> Sanal POS İzleme
            </p>
            <h1 className="mt-2 text-3xl font-black text-hayat-dark">Ödeme Logları</h1>
            <p className="mt-2 font-semibold text-slate-500">Son 300 güvenli ödeme olayı ve banka için REQ/RES kayıtları. Kart, CVV ve parola bilgileri kaydedilmez.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Toplam olay", total, "bg-hayat-blue"],
            ["Başarılı", paid, "bg-hayat-green"],
            ["Başarısız", failed, "bg-red-500"],
            ["Bekleyen", pending, "bg-amber-500"]
          ].map(([label, value, color]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-100 p-4">
              <span className={`mb-3 block h-2 w-12 rounded-full ${color}`} />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
              <b className="mt-1 block text-3xl text-hayat-dark">{value}</b>
            </div>
          ))}
        </div>

        <form className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_220px_260px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input name="q" defaultValue={query} placeholder="Sipariş no, bağışçı, kod veya mesaj" className="w-full rounded-xl border bg-white py-3 pl-11 pr-4" />
          </label>
          <select name="status" defaultValue={status} className="rounded-xl border bg-white px-4 py-3 font-bold">
            <option value="">Tüm durumlar</option>
            {statusGroups.map((group) => (
              <option key={group.status} value={group.status}>{group.status} ({group._count._all})</option>
            ))}
          </select>
          <select name="event" defaultValue={event} className="rounded-xl border bg-white px-4 py-3 font-bold">
            <option value="">Tüm olaylar</option>
            {eventGroups.map((group) => (
              <option key={group.event} value={group.event}>{eventLabel(group.event)} ({group._count._all})</option>
            ))}
          </select>
          <button className="rounded-xl bg-hayat-blue px-6 py-3 font-black text-white">Filtrele</button>
        </form>
      </section>

      <section className="mt-5 space-y-3">
        {logs.map((log) => (
          <article key={log.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${statusStyle(log.status)}`}>
                    {statusIcon(log.status)} {log.status}
                  </span>
                  <b className="text-hayat-dark">{eventLabel(log.event)}</b>
                  {log.responseCode && <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-black">Kod: {log.responseCode}</span>}
                </div>
                <p className="mt-2 break-all text-sm font-semibold text-slate-500">
                  Ref: {log.paymentRef || "—"} · Sağlayıcı: {log.provider}
                </p>
              </div>
              <time className="text-sm font-bold text-slate-500">{log.createdAt.toLocaleString("tr-TR")}</time>
            </div>

            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3"><b>Bağışçı</b><p className="mt-1">{log.donation?.fullName || "Eşleşmedi"}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><b>Tutar / Makbuz</b><p className="mt-1">{log.donation ? `${log.donation.amount} TL · ${log.donation.receiptNo || "—"}` : "—"}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><b>İstek / IP</b><p className="mt-1">{log.requestMethod || "—"} · {log.ipAddress || "—"}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><b>Mesaj</b><p className="mt-1 break-words">{log.message || "—"}</p></div>
            </div>

            {(log.callbackUrl || log.requestData || log.responseData || log.details) && (
              <details className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <summary className="cursor-pointer font-black text-hayat-blue">REQ / RES teknik kayıtlarını göster</summary>
                {log.callbackUrl && <p className="mt-3 break-all text-xs font-semibold text-slate-600">URL: {log.callbackUrl}</p>}
                <div className="mt-3 grid gap-3 xl:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">REQ — Bankaya gönderilen</p>
                    <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
                      {log.requestData ? prettyDetails(log.requestData) : "Bu olay için outbound REQ kaydı yok."}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">RES — Bankadan dönen</p>
                    <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
                      {log.responseData ? prettyDetails(log.responseData) : "Banka callback göndermedi veya henüz RES alınmadı."}
                    </pre>
                  </div>
                </div>
                {log.details && <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-4 text-xs text-slate-100">{prettyDetails(log.details)}</pre>}
              </details>
            )}
          </article>
        ))}

        {!logs.length && (
          <div className="rounded-2xl bg-white p-10 text-center font-bold text-slate-500 shadow-sm">Filtreye uygun ödeme logu bulunamadı.</div>
        )}
      </section>
    </AdminShell>
  );
}
