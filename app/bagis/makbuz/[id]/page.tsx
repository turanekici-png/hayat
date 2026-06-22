import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getDonationTypeLabel } from "@/lib/donation-types";
import { prisma } from "@/lib/prisma";
import { CheckCircle2, Download, HeartHandshake } from "lucide-react";

export default async function DonationReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const donation = await prisma.donation.findUnique({ where: { id } });
  const donationTypeLabel = donation ? await getDonationTypeLabel(donation.type) : "";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-hayat-soft py-12">
        <div className="mx-auto max-w-3xl px-5">
          {!donation ? (
            <div className="rounded-[2rem] bg-white p-10 text-center shadow-soft">Makbuz bulunamadı.</div>
          ) : (
            <section className="rounded-[2rem] bg-white p-8 shadow-soft print:shadow-none">
              <div className="flex items-start justify-between gap-4 border-b pb-6">
                <div>
                  <p className="font-black uppercase tracking-[.18em] text-hayat-green">Hayat Ağacı Derneği</p>
                  <h1 className="mt-2 text-4xl font-black text-hayat-dark">Bağış Makbuzu</h1>
                  <p className="mt-2 text-slate-500">Bu belge demo POS modunda oluşturulan bağış kaydıdır. Canlı POS bağlandığında gerçek ödeme sonucu ile üretilecektir.</p>
                </div>
                <CheckCircle2 className="text-hayat-green" size={44} />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4"><b>Makbuz No</b><p>{donation.receiptNo || donation.id}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><b>Durum</b><p>{donation.status}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><b>Bağışçı</b><p>{donation.fullName}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><b>Tutar</b><p>{donation.amount.toString()} TL</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><b>Bağış Türü</b><p>{donationTypeLabel}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><b>Tarih</b><p>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(donation.createdAt)}</p></div>
              </div>
              {donation.description && <div className="mt-5 rounded-2xl bg-hayat-soft p-5"><b>Açıklama</b><p className="mt-2">{donation.description}</p></div>}
              <div className="mt-8 flex flex-wrap gap-3 print:hidden">
                <span className="rounded-full bg-hayat-green px-6 py-3 font-black text-white"><Download className="mr-2 inline" size={18} /> Ctrl+P ile PDF Kaydet</span>
                <Link href="/bagis" className="rounded-full bg-hayat-dark px-6 py-3 font-black text-white"><HeartHandshake className="mr-2 inline" size={18} /> Yeni Bağış</Link>
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
