"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreditCard, LockKeyhole } from "lucide-react";

type DonationTypeOption = {
  code: string;
  label: string;
};

const presetAmounts = [100, 250, 500, 1000];

function formatAmount(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "0";
  return numeric.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

function DonationFormInner({ donationTypes }: { donationTypes: DonationTypeOption[] }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  const defaultType = searchParams.get("type") || donationTypes[0]?.code || "";
  const defaultAmount = searchParams.get("amount") || "100";
  const parsedDefaultAmount = Number(defaultAmount);
  const defaultPreset = presetAmounts.includes(parsedDefaultAmount) ? parsedDefaultAmount : 100;
  const defaultCustomAmount = presetAmounts.includes(parsedDefaultAmount) ? "" : defaultAmount;

  const [selectedType, setSelectedType] = useState(defaultType);
  const [selectedAmount, setSelectedAmount] = useState(defaultPreset);
  const [customAmount, setCustomAmount] = useState(defaultCustomAmount);
  const activeType = useMemo(
    () => donationTypes.find((type) => type.code === selectedType) || donationTypes[0],
    [donationTypes, selectedType]
  );
  const amount = customAmount.trim() || String(selectedAmount);
  const displayedAmount = formatAmount(amount);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    form.set("type", selectedType);
    form.set("amount", amount);
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
    <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_412px] xl:gap-8">
      <form id="donation-form" onSubmit={submit} className="rounded-[20px] border border-hayat-border bg-white p-5 shadow-stk sm:p-7 lg:p-8">
        <input type="hidden" name="type" value={selectedType} />
        <input type="hidden" name="amount" value={amount} />

        <section>
          <h2 className="text-base font-black text-hayat-dark">1 - Bağış Türü</h2>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {donationTypes.map((type) => (
              <button
                key={type.code}
                type="button"
                onClick={() => setSelectedType(type.code)}
                className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-black transition ${
                  selectedType === type.code
                    ? "border-hayat-blue bg-hayat-blue text-white shadow-[0_12px_24px_rgba(21,147,207,0.2)]"
                    : "border-hayat-border bg-hayat-soft text-hayat-blue hover:border-hayat-blue"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <h2 className="text-base font-black text-hayat-dark">2 - Tutar</h2>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {presetAmounts.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSelectedAmount(value);
                  setCustomAmount("");
                }}
                className={`h-[52px] rounded-[12px] border text-base font-black transition ${
                  !customAmount && selectedAmount === value
                    ? "border-hayat-green bg-hayat-green text-white shadow-green"
                    : "border-hayat-border bg-hayat-soft text-hayat-dark hover:border-hayat-blue"
                }`}
              >
                ₺{value}
              </button>
            ))}
          </div>
          <label className="mt-3 flex h-[54px] items-center gap-3 rounded-[12px] border border-hayat-border bg-hayat-soft px-4 text-hayat-dark focus-within:border-hayat-blue">
            <span className="text-lg font-black">₺</span>
            <input
              name="customAmount"
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              placeholder="Farklı tutar girin"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#7a858a]"
            />
          </label>
        </section>

        <section className="mt-7">
          <h2 className="text-base font-black text-hayat-dark">3 - Bağışçı Bilgileri</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input required name="fullName" placeholder="Ad Soyad" className="h-[54px] rounded-[12px] border border-hayat-border bg-hayat-soft px-4 text-sm font-semibold outline-hayat-blue placeholder:text-[#7a858a]" />
            <input name="phone" placeholder="Telefon" className="h-[54px] rounded-[12px] border border-hayat-border bg-hayat-soft px-4 text-sm font-semibold outline-hayat-blue placeholder:text-[#7a858a]" />
            <input name="email" type="email" placeholder="E-posta" className="h-[54px] rounded-[12px] border border-hayat-border bg-hayat-soft px-4 text-sm font-semibold outline-hayat-blue placeholder:text-[#7a858a] sm:col-span-2" />
            <textarea name="description" placeholder="Bağış açıklaması / notunuz" rows={4} className="rounded-[12px] border border-hayat-border bg-hayat-soft p-4 text-sm font-semibold outline-hayat-blue placeholder:text-[#7a858a] sm:col-span-2" />
          </div>
        </section>

        <section className="mt-5 rounded-[16px] border border-hayat-border bg-hayat-soft p-4 text-xs font-semibold leading-6 text-[#5d6b70]">
          <label className="flex gap-3">
            <input required name="kvkkConsent" type="checkbox" value="true" className="mt-1" />
            <span><Link className="font-black text-hayat-blue underline" href="/kvkk" target="_blank">KVKK Aydınlatma Metni</Link>ni okudum ve kabul ediyorum.</span>
          </label>
          <label className="mt-2 flex gap-3">
            <input required name="privacyConsent" type="checkbox" value="true" className="mt-1" />
            <span><Link className="font-black text-hayat-blue underline" href="/kullanim-kosullari-ve-gizlilik-politikasi" target="_blank">Kullanım Koşulları ve Gizlilik Politikası</Link>nı kabul ediyorum.</span>
          </label>
          <label className="mt-2 flex gap-3">
            <input required name="refundConsent" type="checkbox" value="true" className="mt-1" />
            <span><Link className="font-black text-hayat-blue underline" href="/iade-politikasi" target="_blank">İade Politikası</Link> hakkında bilgilendirildim.</span>
          </label>
        </section>

        {message && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>}

        <button disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-[12px] bg-hayat-green px-6 py-4 font-black text-white shadow-green transition hover:bg-hayat-blue disabled:opacity-60 lg:hidden">
          <CreditCard size={18} /> {loading ? "Güvenli ödeme sayfası açılıyor..." : "Güvenli Öde →"}
        </button>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-28">
        <div className="rounded-[20px] bg-hayat-dark p-6 text-white shadow-[0_22px_50px_rgba(10,58,85,0.18)] sm:p-7">
          <p className="text-xs font-black uppercase tracking-wider text-hayat-blue">Bağış Özeti</p>
          <div className="mt-4 flex items-center justify-between gap-4 border-b border-white/15 pb-4">
            <span className="font-semibold text-white/90">Tür</span>
            <strong className="text-right font-black">{activeType?.label || "Genel Bağış"}</strong>
          </div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <span className="font-semibold text-white/90">Toplam</span>
            <strong className="text-4xl font-black leading-none">₺{displayedAmount}</strong>
          </div>
          <button disabled={loading} form="donation-form" type="submit" className="mt-6 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[12px] bg-hayat-green px-6 font-black text-white shadow-green transition hover:bg-hayat-blue disabled:opacity-60">
            {loading ? "Yönlendiriliyor..." : "Güvenli Öde →"}
          </button>
          <p className="mt-4 text-center text-xs font-semibold text-white/55"><LockKeyhole size={13} className="mr-1 inline" /> 256-bit SSL · Kayıtlı & şeffaf süreç</p>
        </div>

        <Link href="/hesap-numaralarimiz" className="block rounded-[18px] border border-hayat-border bg-white p-5 shadow-stk transition hover:-translate-y-0.5 hover:border-hayat-green">
          <strong className="block text-lg font-black text-hayat-dark">Banka havalesi mi tercih edersiniz?</strong>
          <span className="mt-1 block text-sm font-semibold text-[#5d6b70]">Hesap numaralarımızı görüntüleyin →</span>
        </Link>
      </aside>
    </div>
  );
}

export function DonationForm({ donationTypes }: { donationTypes: DonationTypeOption[] }) {
  return (
    <Suspense fallback={
      <div className="rounded-[20px] border border-hayat-border bg-white p-6 text-center font-bold text-[#5d6b70] shadow-stk md:p-8">
        Bağış formu yükleniyor...
      </div>
    }>
      <DonationFormInner donationTypes={donationTypes} />
    </Suspense>
  );
}
