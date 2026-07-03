"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Banknote, CheckCircle2, CreditCard, HeartHandshake, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import type { PolicyConsentItem } from "@/lib/policy-consents";

type DonationTypeOption = {
  code: string;
  label: string;
};

const fallbackPolicyConsents: PolicyConsentItem[] = [
  {
    type: "CONSENT_KVKK",
    fieldName: "kvkkConsent",
    title: "KVKK onay metni",
    href: "/kvkk",
    linkLabel: "KVKK Aydınlatma Metni",
    text: "KVKK Aydınlatma Metnini okudum ve kabul ediyorum."
  },
  {
    type: "CONSENT_TERMS_PRIVACY",
    fieldName: "privacyConsent",
    title: "Kullanım koşulları ve gizlilik onay metni",
    href: "/kullanim-kosullari-ve-gizlilik-politikasi",
    linkLabel: "Kullanım Koşulları ve Gizlilik Politikası",
    text: "Kullanım Koşulları ve Gizlilik Politikasını kabul ediyorum."
  },
  {
    type: "CONSENT_REFUND",
    fieldName: "refundConsent",
    title: "İade politikası onay metni",
    href: "/iade-politikasi",
    linkLabel: "İade Politikası",
    text: "İade Politikası hakkında bilgilendirildim."
  }
];

const presetAmounts = [100, 250, 500, 1000];

function formatAmount(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "0";
  return numeric.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function removeDigits(value: string) {
  return value.replace(/\d/g, "");
}

function linkedConsentText(item: PolicyConsentItem) {
  const index = item.text.indexOf(item.linkLabel);
  if (index < 0) {
    return (
      <>
        {item.text}{" "}
        <Link className="font-black text-hayat-blue underline" href={item.href} target="_blank">
          {item.linkLabel}
        </Link>
      </>
    );
  }

  return (
    <>
      {item.text.slice(0, index)}
      <Link className="font-black text-hayat-blue underline" href={item.href} target="_blank">
        {item.linkLabel}
      </Link>
      {item.text.slice(index + item.linkLabel.length)}
    </>
  );
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

function DonationFormInner({
  donationTypes,
  policyConsents
}: {
  donationTypes: DonationTypeOption[];
  policyConsents: PolicyConsentItem[];
}) {
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
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldWarnings, setFieldWarnings] = useState<{ fullName?: string; phone?: string }>({});
  const warningTimers = useRef<{ fullName?: ReturnType<typeof setTimeout>; phone?: ReturnType<typeof setTimeout> }>({});
  const activeType = useMemo(
    () => donationTypes.find((type) => type.code === selectedType) || donationTypes[0],
    [donationTypes, selectedType]
  );
  const amount = customAmount.trim() || String(selectedAmount);
  const displayedAmount = formatAmount(amount);

  function showFieldWarning(field: "fullName" | "phone", text: string) {
    setFieldWarnings((current) => ({ ...current, [field]: text }));
    if (warningTimers.current[field]) clearTimeout(warningTimers.current[field]);
    warningTimers.current[field] = setTimeout(() => {
      setFieldWarnings((current) => ({ ...current, [field]: undefined }));
    }, 2200);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    form.set("type", selectedType);
    form.set("amount", amount);
    form.set("fullName", removeDigits(fullName).trim());
    form.set("phone", digitsOnly(phone));
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
    <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-8">
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
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              <label className="relative">
                <input
                  required
                  name="fullName"
                  value={fullName}
                  onChange={(event) => {
                    const nextValue = removeDigits(event.target.value);
                    if (nextValue !== event.target.value) showFieldWarning("fullName", "Ad soyad alanına rakam girilemez.");
                    setFullName(nextValue);
                  }}
                  onKeyDown={(event) => {
                    if (event.ctrlKey || event.metaKey) return;
                    if (/^\d$/.test(event.key)) {
                      event.preventDefault();
                      showFieldWarning("fullName", "Ad soyad alanına rakam girilemez.");
                    }
                  }}
                  placeholder="Ad Soyad"
                  className="h-[58px] w-full rounded-[16px] border border-[#dcd4c7] bg-[#fbfaf7] px-5 text-sm font-bold outline-hayat-blue placeholder:text-[#7a858a] focus:bg-white"
                />
                {fieldWarnings.fullName && (
                  <span className="pointer-events-none absolute left-4 top-[calc(100%+8px)] z-20 max-w-[260px] rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 shadow-[0_12px_30px_rgba(120,75,0,0.14)]">
                    {fieldWarnings.fullName}
                  </span>
                )}
              </label>
              <label className="relative">
                <input
                  required
                  name="phone"
                  value={phone}
                  onChange={(event) => {
                    const nextValue = digitsOnly(event.target.value);
                    if (nextValue !== event.target.value) showFieldWarning("phone", "Telefon alanına sadece rakam girilebilir.");
                    setPhone(nextValue);
                  }}
                  onKeyDown={(event) => {
                    const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Tab"];
                    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return;
                    if (!/^\d$/.test(event.key)) {
                      event.preventDefault();
                      showFieldWarning("phone", "Telefon alanına sadece rakam girilebilir.");
                    }
                  }}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="tel"
                  placeholder="Telefon"
                  className="h-[58px] w-full rounded-[16px] border border-[#dcd4c7] bg-[#fbfaf7] px-5 text-sm font-bold outline-hayat-blue placeholder:text-[#7a858a] focus:bg-white"
                />
                {fieldWarnings.phone && (
                  <span className="pointer-events-none absolute left-4 top-[calc(100%+8px)] z-20 max-w-[260px] rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 shadow-[0_12px_30px_rgba(120,75,0,0.14)]">
                    {fieldWarnings.phone}
                  </span>
                )}
              </label>
              <textarea name="description" placeholder="Bağış açıklaması / notunuz" rows={4} className="rounded-[16px] border border-[#dcd4c7] bg-[#fbfaf7] p-5 text-sm font-bold outline-hayat-blue placeholder:text-[#7a858a] focus:bg-white sm:col-span-2" />
            </div>
          </section>

          <section className="rounded-[20px] border border-[#dce9d2] bg-[#f5fbef] p-5 text-xs font-semibold leading-6 text-[#4f6170]">
            {policyConsents.map((item, index) => (
              <label key={item.type} className={`${index > 0 ? "mt-2 " : ""}flex gap-3`}>
                <input required name={item.fieldName} type="checkbox" value="true" className="mt-1 accent-hayat-green" />
                <span>{linkedConsentText(item)}</span>
              </label>
            ))}
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

export function DonationForm({
  donationTypes,
  policyConsents = fallbackPolicyConsents
}: {
  donationTypes: DonationTypeOption[];
  policyConsents?: PolicyConsentItem[];
}) {
  return (
    <Suspense fallback={
      <div className="rounded-[20px] border border-hayat-border bg-white p-6 text-center font-bold text-[#5d6b70] shadow-stk md:p-8">
        Bağış formu yükleniyor...
      </div>
    }>
      <DonationFormInner donationTypes={donationTypes} policyConsents={policyConsents.length ? policyConsents : fallbackPolicyConsents} />
    </Suspense>
  );
}
