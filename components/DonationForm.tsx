"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreditCard, Heart, ShieldCheck, UserRound } from "lucide-react";

type DonationTypeOption = {
  code: string;
  label: string;
};

function DonationFormInner({ donationTypes }: { donationTypes: DonationTypeOption[] }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  const defaultAmount = searchParams.get("amount") || "";
  const defaultType = searchParams.get("type") || (donationTypes.length > 0 ? donationTypes[0].code : "");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/donations", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "İşlem başlatılamadı.");
      return;
    }
    if (data.paymentHtml) {
      document.open();
      document.write(data.paymentHtml);
      document.close();
      return;
    }
    window.location.href = data.redirectUrl;
  }

  return (
    <form onSubmit={submit} className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-100 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-hayat-soft text-hayat-green"><Heart /></span>
        <div>
          <h2 className="text-2xl font-black">Online Bağış</h2>
          <p className="text-sm text-slate-500">Kart bilgileriniz bankanın güvenli ödeme sayfasında alınır.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 rounded-2xl border border-hayat-green/10 bg-hayat-soft p-4 md:grid-cols-2">
          <label className="relative md:col-span-2">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-hayat-green" size={18} />
            <input required name="fullName" placeholder="Ad Soyad" className="w-full rounded-2xl border py-4 pl-11 pr-4 outline-hayat-green" />
          </label>
          <select name="type" defaultValue={defaultType} className="rounded-2xl border p-4 outline-hayat-green">
            {donationTypes.map((type) => (
              <option key={type.code} value={type.code}>{type.label}</option>
            ))}
          </select>
          <input required name="amount" type="number" min="1" step="0.01" defaultValue={defaultAmount} placeholder="Bağış Tutarı (TL)" className="rounded-2xl border p-4 outline-hayat-green" />
          <textarea name="description" placeholder="Bağış açıklaması / notunuz" rows={4} className="rounded-2xl border p-4 outline-hayat-green md:col-span-2" />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-hayat-blue/10 bg-hayat-soft p-4 text-sm text-slate-700">
        <div className="mb-3 flex items-center gap-2 font-black text-hayat-dark"><ShieldCheck className="text-hayat-green" size={20} /> Yasal bilgilendirme ve onaylar</div>
        <label className="mt-3 flex gap-3 font-semibold leading-6">
          <input required name="kvkkConsent" type="checkbox" value="true" className="mt-1" />
          <span><Link className="font-black text-hayat-blue underline" href="/kvkk" target="_blank">KVKK Aydınlatma Metni</Link>ni okudum ve kabul ediyorum.</span>
        </label>
        <label className="mt-3 flex gap-3 font-semibold leading-6">
          <input required name="privacyConsent" type="checkbox" value="true" className="mt-1" />
          <span><Link className="font-black text-hayat-blue underline" href="/kullanim-kosullari-ve-gizlilik-politikasi" target="_blank">Kullanım Koşulları ve Gizlilik Politikası</Link>nı kabul ediyorum.</span>
        </label>
        <label className="mt-3 flex gap-3 font-semibold leading-6">
          <input required name="refundConsent" type="checkbox" value="true" className="mt-1" />
          <span><Link className="font-black text-hayat-blue underline" href="/iade-politikasi" target="_blank">İade Politikası</Link> hakkında bilgilendirildim.</span>
        </label>
      </div>

      {message && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
      <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-hayat-green px-6 py-4 font-black text-white hover:bg-hayat-dark disabled:opacity-60">
        <CreditCard /> {loading ? "Güvenli ödeme sayfası açılıyor..." : "Güvenli Ödeme Sayfasına Geç"}
      </button>
      <p className="mt-3 text-center text-xs text-slate-400">Kart bilgileriniz dernek sitesinde tutulmaz; ödeme Vakıf Katılım güvenli ödeme sayfasında tamamlanır.</p>
    </form>
  );
}

export function DonationForm({ donationTypes }: { donationTypes: DonationTypeOption[] }) {
  return (
    <Suspense fallback={
      <div className="rounded-[2rem] bg-white p-6 text-center font-bold text-slate-500 shadow-soft ring-1 ring-slate-100 md:p-8">
        Bağış formu yükleniyor...
      </div>
    }>
      <DonationFormInner donationTypes={donationTypes} />
    </Suspense>
  );
}
