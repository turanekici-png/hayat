import { AlertCircle } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { DonationForm } from "@/components/DonationForm";
import { getActiveDonationTypes } from "@/lib/donation-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type BagisSearchParams = Promise<{ odeme?: string | string[]; mesaj?: string | string[] }>;

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BagisPage({ searchParams }: { searchParams: BagisSearchParams }) {
  const donationTypes = await getActiveDonationTypes();
  const params = await searchParams;
  const paymentStatus = firstParam(params.odeme);
  const paymentMessage = firstParam(params.mesaj);

  return (
    <>
      <Header />
      <main className="bg-hayat-soft">
        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1fr_.9fr]">
          <div>
            <p className="font-bold text-hayat-green">ONLINE BAĞIŞ</p>
            <h1 className="mt-3 text-5xl font-black text-hayat-dark">Bağışınızı güvenli şekilde iletin</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">Tutarınızı, bağış türünüzü ve açıklamanızı yazıp ödeme adımına geçebilirsiniz.</p>
            {paymentStatus === "basarisiz" && (
              <div className="mt-6 flex gap-3 rounded-3xl border border-red-100 bg-red-50 p-5 text-red-700">
                <AlertCircle className="mt-1 shrink-0" />
                <div>
                  <p className="font-black">Ödeme tamamlanamadı.</p>
                  <p className="mt-1 text-sm font-semibold leading-6">{paymentMessage || "Banka 3D güvenli ödeme işlemini onaylamadı."}</p>
                </div>
              </div>
            )}
            <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
              <b>Not:</b> Canlı POS aktif olduğunda ödeme bankanın 3D güvenlik ekranında doğrulanır.
            </div>
          </div>
          <DonationForm donationTypes={donationTypes} />
        </section>
      </main>
      <Footer />
    </>
  );
}
