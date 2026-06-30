"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Banknote, CheckCircle2, CreditCard, HeartHandshake, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";

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

function StepTitle({ number, title, icon: Icon }: { number: number; title: string; icon: typeof HeartHandshake }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e8f5fb] text-sm font-black text-hayat-blue ring-1 ring-hayat-blue/10">
        {number}
      </span>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#edf7e5] text-hayat-green">
        <Icon size={19} />
      </span>
      <h2 className="text-lg font-black text-hayat-dark">{title}</h2>
    </div>
  );
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
    <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_420px] xl:gap-9">
      <form id="donation-form" onSubmit={submit} className="overflow-hidden rounded-[28px] border border-[#d9e5ec] bg-white shadow-[0_24px_70px_rgba(10,58,85,0.1)]">
        <input type="hidden" name="type" value={selectedType} />
        <input type="hidden" name="amount" value={amount} />

        <div className="border-b border-[#e3edf2] bg-[linear-gradient(135deg,#ffffff,#f4fbff)] px-5 py-5 sm:px-7 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-hayat-green">Online Bağış Formu</p>
              <h2 className="mt-1 text-2xl font-black text-hayat-dark">Güvenli bağış bilgileri</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#edf7e5] px-4 py-2 text-sm font-black text-hayat-green">
              <ShieldCheck size={17} /> Güvenli süreç
            </div>
          </div>
        </div>

        <div className="space-y-8 p-5 sm:p-7 lg:p-8">
          <section>
            <StepTitle number={1} title="Bağış Türü" icon={HeartHandshake} />
            <div className="donation-type-grid mt-4">
              {donationTypes.map((type) => (
                <button
                  key={type.code}
                  type="button"
                  onClick={() => setSelectedType(type.code)}
                  className={`donation-type-button ${selectedType === type.code ? "is-active" : ""}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <StepTitle number={2} title="Tutar" icon={Banknote} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {presetAmounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(value);
                    setCustomAmount("");
                  }}
                  className={`h-[56px] rounded-[16px] border text-lg font-black transition ${
                    !customAmount && selectedAmount === value
                      ? "border-hayat-green bg-hayat-green text-white shadow-green"
                      : "border-[#dcd4c7] bg-[#fbfaf7] text-hayat-dark hover:border-hayat-blue hover:bg-white"
                  }`}
                >
                  ₺{value}
                </button>
              ))}
            </div>
            <label className="mt-3 flex h-[58px] items-center gap-3 rounded-[16px] border border-[#dcd4c7] bg-[#fbfaf7] px-5 text-hayat-dark shadow-inner shadow-white focus-within:border-hayat-blue focus-within:bg-white">
              <span className="text-xl font-black">₺</span>
              <input
                name="customAmount"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                type="number"
                min="1"
                step="0.01"
                inputMode="decimal"
                placeholder="Farklı tutar girin"
                className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-[#7a858a]"
              />
            </label>
          </section>

          <section>
            <StepTitle number={3} title="Bağışçı Bilgileri" icon={UserRound} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input required name="fullName" placeholder="Ad Soyad" className="h-[58px] rounded-[16px] border border-[#dcd4c7] bg-[#fbfaf7] px-5 text-sm font-bold outline-hayat-blue placeholder:text-[#7a858a] focus:bg-white" />
              <input name="phone" placeholder="Telefon" className="h-[58px] rounded-[16px] border border-[#dcd4c7] bg-[#fbfaf7] px-5 text-sm font-bold outline-hayat-blue placeholder:text-[#7a858a] focus:bg-white" />
              <textarea name="description" placeholder="Bağış açıklaması / notunuz" rows={4} className="rounded-[16px] border border-[#dcd4c7] bg-[#fbfaf7] p-5 text-sm font-bold outline-hayat-blue placeholder:text-[#7a858a] focus:bg-white sm:col-span-2" />
            </div>
          </section>

          <section className="rounded-[20px] border border-[#dce9d2] bg-[#f5fbef] p-5 text-xs font-semibold leading-6 text-[#4f6170]">
            <label className="flex gap-3">
              <input required name="kvkkConsent" type="checkbox" value="true" className="mt-1 accent-hayat-green" />
              <span><Link className="font-black text-hayat-blue underline" href="/kvkk" target="_blank">KVKK Aydınlatma Metni</Link>ni okudum ve kabul ediyorum.</span>
            </label>
            <label className="mt-2 flex gap-3">
              <input required name="privacyConsent" type="checkbox" value="true" className="mt-1 accent-hayat-green" />
              <span><Link className="font-black text-hayat-blue underline" href="/kullanim-kosullari-ve-gizlilik-politikasi" target="_blank">Kullanım Koşulları ve Gizlilik Politikası</Link>nı kabul ediyorum.</span>
            </label>
            <label className="mt-2 flex gap-3">
              <input required name="refundConsent" type="checkbox" value="true" className="mt-1 accent-hayat-green" />
              <span><Link className="font-black text-hayat-blue underline" href="/iade-politikasi" target="_blank">İade Politikası</Link> hakkında bilgilendirildim.</span>
            </label>
          </section>

          {message && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>}

          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-hayat-green px-6 py-4 font-black text-white shadow-green transition hover:bg-hayat-blue disabled:opacity-60 lg:hidden">
            <CreditCard size={18} /> {loading ? "Güvenli ödeme sayfası açılıyor..." : "Güvenli Öde →"}
          </button>
        </div>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-28">
        <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#0a3a55,#0d5477)] text-white shadow-[0_26px_70px_rgba(10,58,85,0.26)]">
          <div className="border-b border-white/10 p-6 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#74d0f3]">Bağış Özeti</p>
            <div className="mt-5 flex items-center justify-between gap-4">
              <span className="font-semibold text-white/80">Tür</span>
              <strong className="text-right font-black">{activeType?.label || "Genel Bağış"}</strong>
            </div>
          </div>
          <div className="p-6 sm:p-7">
            <div className="rounded-[22px] bg-white/10 p-5 ring-1 ring-white/10">
              <span className="block text-sm font-semibold text-white/70">Toplam</span>
              <strong className="mt-2 block text-5xl font-black leading-none tracking-tight">₺{displayedAmount}</strong>
            </div>
            <button disabled={loading} form="donation-form" type="submit" className="mt-5 flex min-h-[58px] w-full items-center justify-center gap-2 rounded-[16px] bg-hayat-green px-6 font-black text-white shadow-green transition hover:bg-hayat-blue disabled:opacity-60">
              {loading ? "Yönlendiriliyor..." : "Güvenli Öde"} <ArrowRight size={18} />
            </button>
            <p className="mt-4 text-center text-xs font-semibold text-white/60"><LockKeyhole size={13} className="mr-1 inline" /> 256-bit SSL · Kayıtlı ve şeffaf süreç</p>
          </div>
        </div>

        <Link href="/hesap-numaralarimiz" className="group block overflow-hidden rounded-[24px] border border-[#d9e5ec] bg-white shadow-[0_18px_50px_rgba(10,58,85,0.08)] transition hover:-translate-y-0.5 hover:border-hayat-green hover:shadow-[0_24px_60px_rgba(10,58,85,0.13)]">
          <div className="flex gap-4 p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#edf7e5] text-hayat-green transition group-hover:bg-hayat-green group-hover:text-white">
              <Banknote size={22} />
            </span>
            <span>
              <strong className="block text-lg font-black text-hayat-dark">Banka havalesi mi tercih edersiniz?</strong>
              <span className="mt-1 block text-sm font-semibold text-[#5d6b70]">Hesap numaralarımızı görüntüleyin →</span>
            </span>
          </div>
        </Link>

        <div className="rounded-[24px] border border-[#d9e5ec] bg-white p-5 shadow-[0_18px_50px_rgba(10,58,85,0.06)]">
          <div className="flex items-center gap-3 text-sm font-black text-hayat-dark">
            <CheckCircle2 size={20} className="text-hayat-green" /> Bağış bilgileriniz güvenle işlenir.
          </div>
        </div>
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
