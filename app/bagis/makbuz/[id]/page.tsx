import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getDonationTypeLabel } from "@/lib/donation-types";
import { prisma } from "@/lib/prisma";
import { CheckCircle2, HeartHandshake, ShieldCheck } from "lucide-react";
import { ReceiptActions } from "./ReceiptActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const statusLabels: Record<string, string> = {
  PAID: "Ödendi",
  PENDING: "Bekliyor",
  FAILED: "Başarısız",
  CANCELLED: "İptal"
};

function currency(value: number) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function statusLabel(status: string) {
  return statusLabels[status] || status;
}

export default async function DonationReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const donation = await prisma.donation.findUnique({ where: { id } });
  const donationTypeLabel = donation ? await getDonationTypeLabel(donation.type) : "";
  const isPaid = donation?.status === "PAID";

  return (
    <>
      <div className="print:hidden">
        <Header />
      </div>
      <main className="min-h-screen bg-hayat-soft py-8 print:min-h-0 print:bg-white print:py-0 md:py-12">
        <div className="mx-auto max-w-3xl px-5 print:max-w-none print:px-0">
          {!donation ? (
            <div className="rounded-[2rem] bg-white p-10 text-center shadow-soft">Makbuz bulunamadı.</div>
          ) : (
            <section className="rounded-[2rem] bg-white p-6 shadow-soft print:rounded-none print:p-0 print:shadow-none md:p-8">
              <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-black uppercase tracking-[.14em] text-hayat-green">Hayat Ağacı Derneği</p>
                  <h1 className="mt-2 text-3xl font-black text-hayat-dark md:text-4xl">Bağış Makbuzu</h1>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    {isPaid
                      ? "Bağışınız başarıyla alınmıştır. Bu makbuzu yazdırabilir veya PDF olarak kaydedebilirsiniz."
                      : "Bu bağış kaydı için ödeme henüz başarılı görünmüyor. Makbuz yalnızca ödeme tamamlandığında geçerlidir."}
                  </p>
                </div>
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${isPaid ? "bg-green-50 text-hayat-green" : "bg-amber-50 text-amber-600"}`}>
                  <CheckCircle2 size={34} />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-hayat-green/20 bg-hayat-soft p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.12em] text-hayat-green">Makbuz No</p>
                    <p className="mt-1 text-2xl font-black text-hayat-dark">{donation.receiptNo || donation.id}</p>
                  </div>
                  <span className={`w-fit rounded-full px-4 py-2 text-sm font-black ${isPaid ? "bg-hayat-green text-white" : "bg-amber-100 text-amber-800"}`}>
                    {statusLabel(donation.status)}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <b>Bağışçı</b>
                  <p>{donation.fullName}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <b>Tutar</b>
                  <p className="text-xl font-black text-hayat-dark">{currency(donation.amount)} TL</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <b>Bağış Türü</b>
                  <p>{donationTypeLabel}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <b>Tarih</b>
                  <p>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(donation.createdAt)}</p>
                </div>
                {donation.paymentRef && (
                  <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
                    <b>Ödeme Referansı</b>
                    <p className="break-all font-mono text-sm">{donation.paymentRef}</p>
                  </div>
                )}
              </div>

              {donation.description && (
                <div className="mt-5 rounded-2xl bg-hayat-soft p-5">
                  <b>Açıklama</b>
                  <p className="mt-2">{donation.description}</p>
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-slate-100 p-5 text-sm font-semibold text-slate-600">
                <p className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 shrink-0 text-hayat-green" size={18} />
                  Bu belge Hayat Ağacı Derneği online bağış sistemi tarafından oluşturulmuştur.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 print:hidden">
                <ReceiptActions />
                <Link href="/bagis" className="inline-flex items-center gap-2 rounded-full bg-hayat-dark px-6 py-3 font-black text-white">
                  <HeartHandshake size={18} /> Yeni Bağış
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </>
  );
}
