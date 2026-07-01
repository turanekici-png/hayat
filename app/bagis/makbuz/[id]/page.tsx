import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getDonationTypeLabel } from "@/lib/donation-types";
import { prisma } from "@/lib/prisma";
import { CalendarDays, CheckCircle2, Hash, HeartHandshake, Phone, ShieldCheck, UserRound } from "lucide-react";
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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" }).format(value);
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
      <main className="receipt-print-page min-h-screen bg-hayat-soft py-8 print:min-h-0 print:bg-white print:py-0 md:py-12">
        <div className="mx-auto max-w-4xl px-5 print:max-w-none print:px-0">
          {!donation ? (
            <div className="rounded-[2rem] bg-white p-10 text-center shadow-soft">Makbuz bulunamadı.</div>
          ) : (
            <section className="receipt-print-sheet overflow-hidden rounded-[1.5rem] border border-[#d9e5ec] bg-white shadow-[0_24px_70px_rgba(10,58,85,0.12)] print:rounded-none print:border-0 print:shadow-none">
              <div className="receipt-print-header bg-[#0a3a55] px-6 py-6 text-white md:px-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="grid h-20 w-20 shrink-0 place-items-center rounded-[18px] bg-white p-3 shadow-[0_12px_30px_rgba(0,0,0,0.16)] print:h-16 print:w-16">
                      <img src="/media/brand/logolar-vektorel-yatay.png" alt="Hayat Ağacı Derneği logosu" className="h-full w-full object-contain" />
                    </span>
                    <span>
                      <span className="block text-xs font-black uppercase text-[#a9dd7b]">Hayat Ağacı Derneği</span>
                      <h1 className="mt-1 text-3xl font-black leading-tight md:text-4xl print:text-3xl">Bağış Makbuzu</h1>
                      <span className="mt-2 block text-sm font-semibold text-white/75">Online bağış sistemi tarafından oluşturulmuştur.</span>
                    </span>
                  </div>
                  <div className={`flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${isPaid ? "bg-[#6fb744] text-white" : "bg-amber-100 text-amber-800"}`}>
                    <CheckCircle2 size={18} />
                    {statusLabel(donation.status)}
                  </div>
                </div>
              </div>

              <div className="receipt-print-body p-6 md:p-8 print:p-7">
                <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[18px] border border-[#d9e5ec] bg-[#f7f5ef] p-5">
                    <p className="text-xs font-black uppercase text-hayat-green">Makbuz No</p>
                    <p className="mt-1 break-all text-2xl font-black text-hayat-dark">{donation.receiptNo || donation.id}</p>
                    <p className="mt-3 text-sm font-semibold text-[#5d6b70]">
                      {isPaid
                        ? "Bağışınız başarıyla alınmıştır. Bu makbuzu yazdırabilir veya PDF olarak kaydedebilirsiniz."
                        : "Bu bağış kaydı için ödeme henüz başarılı görünmüyor. Makbuz yalnızca ödeme tamamlandığında geçerlidir."}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-[#cfe6c2] bg-[#f5fbef] p-5">
                    <p className="text-xs font-black uppercase text-hayat-green">Bağış Tutarı</p>
                    <p className="mt-1 text-4xl font-black leading-none text-hayat-dark print:text-3xl">{currency(donation.amount)} TL</p>
                    <p className="mt-3 text-sm font-bold text-[#5d6b70]">{donationTypeLabel}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="receipt-info-row">
                    <UserRound size={18} />
                    <span>
                      <b>Bağışçı</b>
                      <p>{donation.fullName}</p>
                    </span>
                  </div>
                  <div className="receipt-info-row">
                    <Phone size={18} />
                    <span>
                      <b>Telefon</b>
                      <p>{donation.phone || "Belirtilmedi"}</p>
                    </span>
                  </div>
                  <div className="receipt-info-row">
                    <CalendarDays size={18} />
                    <span>
                      <b>Tarih</b>
                      <p>{formatDate(donation.createdAt)}</p>
                    </span>
                  </div>
                  <div className="receipt-info-row">
                    <Hash size={18} />
                    <span>
                      <b>Ödeme Referansı</b>
                      <p className="break-all font-mono text-sm">{donation.paymentRef || "Oluşturulmadı"}</p>
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-[18px] border border-[#d9e5ec] bg-white p-5">
                  <b className="text-hayat-dark">Açıklama</b>
                  <p className="mt-2 min-h-12 whitespace-pre-wrap text-sm font-semibold leading-7 text-[#5d6b70]">
                    {donation.description || "Bağışçı tarafından açıklama girilmedi."}
                  </p>
                </div>

                <div className="mt-5 grid gap-4 border-t border-[#d9e5ec] pt-5 md:grid-cols-[1fr_220px] md:items-end">
                  <p className="flex items-start gap-2 text-sm font-semibold text-[#5d6b70]">
                    <ShieldCheck className="mt-0.5 shrink-0 text-hayat-green" size={18} />
                    Bu belge Hayat Ağacı Derneği online bağış sistemi tarafından oluşturulmuştur. Ödeme durumu ve makbuz numarası sistem kayıtları ile doğrulanabilir.
                  </p>
                  <div className="rounded-[16px] border border-[#d9e5ec] p-4 text-center">
                    <p className="text-xs font-black uppercase text-[#5d6b70]">Kurum Onayı</p>
                    <p className="mt-6 border-t border-dashed border-[#9aa8ad] pt-2 text-xs font-bold text-[#5d6b70]">Hayat Ağacı Derneği</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3 print:hidden">
                  <ReceiptActions />
                  <Link href="/bagis" className="inline-flex items-center gap-2 rounded-full bg-hayat-dark px-6 py-3 font-black text-white">
                    <HeartHandshake size={18} /> Yeni Bağış
                  </Link>
                </div>
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
