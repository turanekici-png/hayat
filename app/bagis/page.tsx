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
        <section className="border-b border-hayat-border bg-[#eee8d9]">
          <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-sm font-black uppercase tracking-widest text-hayat-green">Online Bağış</p>
            <h1 className="mt-2 text-4xl font-black leading-tight text-hayat-dark sm:text-5xl">Bir hayata dokun</h1>
            {paymentStatus === "basarisiz" && (
              <div className="mt-6 flex max-w-3xl gap-3 rounded-[18px] border border-red-100 bg-red-50 p-5 text-red-700">
                <AlertCircle className="mt-1 shrink-0" />
                <div>
                  <p className="font-black">Ödeme tamamlanamadı.</p>
                  <p className="mt-1 text-sm font-semibold leading-6">{paymentMessage || "Banka 3D güvenli ödeme işlemini onaylamadı."}</p>
                </div>
              </div>
            )}
          </div>
        </section>
        <section className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8">
          <DonationForm donationTypes={donationTypes} />
        </section>
      </main>
      <Footer />
    </>
  );
}
