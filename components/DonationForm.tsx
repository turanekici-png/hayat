"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, Banknote, CheckCircle2, CreditCard, HeartHandshake, LockKeyhole, MessageSquareText, ShieldCheck, UserRound, X } from "lucide-react";
import { savePendingDonation } from "@/lib/pending-donation";

type DonationTypeOption = {
  code: string;
  label: string;
};

type PolicyOption = {
  slug: string;
  title: string;
  content: string;
};

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

function StepTitle({ number, title, icon: Icon }: { number: number; title: string; icon: typeof HeartHandshake }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e8f5fb] text-xs font-black text-hayat-blue ring-1 ring-hayat-blue/10 sm:h-10 sm:w-10 sm:text-sm">
        {number}
      </span>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#edf7e5] text-hayat-green sm:h-10 sm:w-10">
        <Icon size={17} />
      </span>
      <h2 className="text-base font-black text-hayat-dark sm:text-lg">{title}</h2>
    </div>
  );
}

function DonationFormInner({ donationTypes, policies }: { donationTypes: DonationTypeOption[]; policies: PolicyOption[] }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  // Bankaya gecmeden once gosterilen bilgilendirme ekrani (odeme bitene kadar sayfayi kapatmama uyarisi).
  const [redirecting, setRedirecting] = useState<{ amount: string; typeLabel: string } | null>(null);
  const proceedRef = useRef<(() => void) | null>(null);
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
  const [kvkkConsent, setKvkkConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [refundConsent, setRefundConsent] = useState(false);
  const [policyModal, setPolicyModal] = useState<PolicyOption | null>(null);
  const warningTimers = useRef<{ fullName?: ReturnType<typeof setTimeout>; phone?: ReturnType<typeof setTimeout> }>({});
  const activeType = useMemo(
    () => donationTypes.find((type) => type.code === selectedType) || donationTypes[0],
    [donationTypes, selectedType]
  );
  const policyBySlug = useMemo(() => new Map(policies.map((policy) => [policy.slug, policy])), [policies]);
  const amount = customAmount.trim() || String(selectedAmount);
  const displayedAmount = formatAmount(amount);

  function openPolicy(slug: string) {
    const policy = policyBySlug.get(slug);
    if (policy) setPolicyModal(policy);
  }

  function acceptPolicy(slug: unknown) {
    if (slug === "kvkk") setKvkkConsent(true);
    if (slug === "kullanim-kosullari-ve-gizlilik-politikasi") setPrivacyConsent(true);
    if (slug === "iade-politikasi") setRefundConsent(true);
    setPolicyModal(null);
  }

  function showFieldWarning(field: "fullName" | "phone", text: string) {
    setFieldWarnings((current) => ({ ...current, [field]: text }));
    if (warningTimers.current[field]) clearTimeout(warningTimers.current[field]);
    warningTimers.current[field] = setTimeout(() => {
      setFieldWarnings((current) => ({ ...current, [field]: undefined }));
    }, 2200);
  }

  // Banka sayfasindan geri tusuyla donulurse (sayfa onbellekten gelir) form kilitli kalmasin.
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        setLoading(false);
        setRedirecting(null);
        proceedRef.current = null;
      }
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  function proceedToPayment() {
    const proceed = proceedRef.current;
    proceedRef.current = null;
    proceed?.();
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

    let res: Response;
    let data: { error?: string; redirectUrl?: string; paymentHtml?: string | null; donationId?: string; requiresBankStep?: boolean };
    try {
      res = await fetch("/api/donations", { method: "POST", body: form });
      data = await res.json();
    } catch {
      setLoading(false);
      setMessage("Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin; henüz bir ödeme alınmadı.");
      return;
    }

    if (!res.ok) {
      setLoading(false);
      setMessage(data.error || "İşlem başlatılamadı.");
      return;
    }

    const go = () => {
      if (data.paymentHtml) {
        document.open();
        document.write(data.paymentHtml);
        document.close();
        return;
      }
      if (data.redirectUrl) window.location.href = data.redirectUrl;
    };

    // Demo/aninda onaylanan odemede banka adimi yok: dogrudan makbuza gidilir.
    if (!data.requiresBankStep) {
      go();
      return;
    }

    if (data.donationId) {
      savePendingDonation({ id: data.donationId, amount, typeCode: selectedType, typeLabel: activeType?.label || "Bağış" });
    }
    proceedRef.current = go;
    setRedirecting({ amount: displayedAmount, typeLabel: activeType?.label || "Bağış" });
    window.setTimeout(proceedToPayment, 4000);
  }

  return (
    <>
    <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-8">
      <form id="donation-form" onSubmit={submit} className="overflow-hidden rounded-[28px] border border-[#d9e5ec] bg-white shadow-[0_24px_70px_rgba(10,58,85,0.1)]">
        <input type="hidden" name="type" value={selectedType} />
        <input type="hidden" name="amount" value={amount} />

        <div className="border-b border-[#e3edf2] bg-[linear-gradient(135deg,#ffffff,#f4fbff)] px-4 py-4 sm:px-7 sm:py-5 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-hayat-green sm:text-xs">Online Bağış Formu</p>
              <h2 className="mt-1 text-xl font-black text-hayat-dark sm:text-2xl">Güvenli bağış bilgileri</h2>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#edf7e5] px-3 py-1.5 text-xs font-black text-hayat-green sm:gap-2 sm:px-4 sm:py-2 sm:text-sm">
              <ShieldCheck size={15} /> Güvenli süreç
            </div>
          </div>
        </div>

        <div className="space-y-6 p-4 sm:space-y-8 sm:p-7 lg:p-8">
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
            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3 lg:grid-cols-4">
              {presetAmounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(value);
                    setCustomAmount("");
                  }}
                  className={`h-12 rounded-[14px] border text-base font-black transition sm:h-[56px] sm:rounded-[16px] sm:text-lg ${
                    !customAmount && selectedAmount === value
                      ? "border-hayat-green bg-hayat-green text-white shadow-green"
                      : "border-[#dcd4c7] bg-[#fbfaf7] text-hayat-dark hover:border-hayat-blue hover:bg-white"
                  }`}
                >
                  ₺{value}
                </button>
              ))}
            </div>
            <label className="mt-2 flex h-12 items-center gap-3 rounded-[14px] border border-[#dcd4c7] bg-[#fbfaf7] px-4 text-hayat-dark shadow-inner shadow-white focus-within:border-hayat-blue focus-within:bg-white sm:mt-3 sm:h-[58px] sm:rounded-[16px] sm:px-5">
              <span className="text-lg font-black sm:text-xl">₺</span>
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
            <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-3">
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
                  className="h-12 w-full rounded-[14px] border border-[#dcd4c7] bg-[#fbfaf7] px-4 text-[15px] font-bold outline-hayat-blue placeholder:text-[#7a858a] focus:bg-white sm:h-[58px] sm:rounded-[16px] sm:px-5 sm:text-sm"
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
                  className="h-12 w-full rounded-[14px] border border-[#dcd4c7] bg-[#fbfaf7] px-4 text-[15px] font-bold outline-hayat-blue placeholder:text-[#7a858a] focus:bg-white sm:h-[58px] sm:rounded-[16px] sm:px-5 sm:text-sm"
                />
                {fieldWarnings.phone && (
                  <span className="pointer-events-none absolute left-4 top-[calc(100%+8px)] z-20 max-w-[260px] rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 shadow-[0_12px_30px_rgba(120,75,0,0.14)]">
                    {fieldWarnings.phone}
                  </span>
                )}
              </label>
              <textarea name="description" placeholder="Bağış açıklaması / notunuz (isteğe bağlı)" rows={3} className="rounded-[14px] border border-[#dcd4c7] bg-[#fbfaf7] p-4 text-[15px] font-bold outline-hayat-blue placeholder:text-[#7a858a] focus:bg-white sm:col-span-2 sm:rounded-[16px] sm:p-5 sm:text-sm" />
            </div>
          </section>

          <section className="grid gap-1 rounded-[16px] border border-[#dce9d2] bg-[#f5fbef] p-2 text-[13px] font-semibold leading-5 text-[#4f6170] sm:rounded-[20px] sm:p-3 sm:text-sm sm:leading-6">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-white/70">
              <input id="kvkkConsent" required name="kvkkConsent" type="checkbox" value="true" checked={kvkkConsent} onChange={(event) => setKvkkConsent(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-hayat-green" />
              <span><button type="button" onClick={() => openPolicy("kvkk")} className="font-black text-hayat-blue underline underline-offset-2">KVKK Aydınlatma Metni</button>&apos;ni okudum ve kabul ediyorum.</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-white/70">
              <input required name="privacyConsent" type="checkbox" value="true" checked={privacyConsent} onChange={(event) => setPrivacyConsent(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-hayat-green" />
              <span><button type="button" onClick={() => openPolicy("kullanim-kosullari-ve-gizlilik-politikasi")} className="font-black text-hayat-blue underline underline-offset-2">Kullanım Koşulları ve Gizlilik Politikası</button>&apos;nı kabul ediyorum.</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-white/70">
              <input required name="refundConsent" type="checkbox" value="true" checked={refundConsent} onChange={(event) => setRefundConsent(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-hayat-green" />
              <span><button type="button" onClick={() => openPolicy("iade-politikasi")} className="font-black text-hayat-blue underline underline-offset-2">İade Politikası</button> hakkında bilgilendirildim.</span>
            </label>
          </section>

          {message && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>}

          <button disabled={loading} className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-hayat-green px-6 font-black text-white shadow-green transition hover:bg-hayat-blue disabled:opacity-60 lg:hidden">
            <CreditCard size={18} /> {loading ? "Güvenli ödeme sayfası açılıyor..." : "Güvenli Öde →"}
          </button>
        </div>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-28">
        <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#0a3a55,#0d5477)] text-white shadow-[0_26px_70px_rgba(10,58,85,0.26)]">
          <div className="border-b border-white/10 p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#74d0f3]">Bağış Özeti</p>
            <div className="mt-5 flex items-center justify-between gap-4">
              <span className="font-semibold text-white/80">Tür</span>
              <strong className="text-right font-black">{activeType?.label || "Genel Bağış"}</strong>
            </div>
          </div>
          <div className="p-5 sm:p-7">
            <div className="rounded-[18px] bg-white/10 p-4 ring-1 ring-white/10 sm:rounded-[22px] sm:p-5">
              <span className="block text-sm font-semibold text-white/70">Toplam</span>
              <strong className="mt-2 block text-4xl font-black leading-none tracking-tight sm:text-5xl">₺{displayedAmount}</strong>
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
    {redirecting && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#061b2a]/80 p-3 backdrop-blur-sm sm:p-6" role="alertdialog" aria-modal="true" aria-labelledby="payment-redirect-title">
        <div className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
          <div className="bg-hayat-dark px-6 py-5 text-white">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#a9d47a]"><LockKeyhole size={14} /> Güvenli ödeme</p>
            <h2 id="payment-redirect-title" className="mt-1.5 text-xl font-black leading-tight sm:text-2xl">Bankanın güvenli ödeme sayfasına yönlendiriliyorsunuz</h2>
            <p className="mt-1 text-sm font-semibold text-[#c3d7e3]">{redirecting.typeLabel} · <span className="font-black text-white">₺{redirecting.amount}</span></p>
          </div>
          <div className="px-6 py-5">
            <ol className="grid gap-3">
              <li className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e8f5fb] text-sm font-black text-hayat-blue">1</span><span className="pt-1 text-[15px] font-semibold leading-6 text-[#33464f]">Açılan banka sayfasında <strong className="text-hayat-dark">kart bilgilerinizi</strong> girin.</span></li>
              <li className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e8f5fb] text-sm font-black text-hayat-blue">2</span><span className="pt-1 text-[15px] font-semibold leading-6 text-[#33464f]">Telefonunuza gelen <strong className="text-hayat-dark">SMS doğrulama şifresini</strong> girip onaylayın. <MessageSquareText size={15} className="inline text-hayat-blue" /></span></li>
              <li className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#edf7e5] text-sm font-black text-hayat-green">3</span><span className="pt-1 text-[15px] font-semibold leading-6 text-[#33464f]"><strong className="text-hayat-dark">“Bağışınız başarıyla alındı”</strong> yazan makbuz ekranı açılana kadar bekleyin.</span></li>
            </ol>
            <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <AlertTriangle size={20} className="mt-0.5 shrink-0" />
              <p className="text-sm font-bold leading-6">Banka sayfasını kapatır veya geri dönerseniz <span className="underline">bağışınız alınmaz</span>. Bağış, ancak makbuz ekranını gördüğünüzde tamamlanmış olur.</p>
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
              <div className="h-full w-full origin-left animate-[payment-redirect_4s_linear_forwards] rounded-full bg-hayat-green" />
            </div>
            <button type="button" onClick={proceedToPayment} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-hayat-green font-black text-white transition hover:bg-hayat-dark">
              Anladım, ödeme sayfasına geç <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    )}
    {policyModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#061b2a]/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={policyModal.title}>
        <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_28px_90px_rgba(0,0,0,0.32)]">
          <div className="flex items-center justify-between gap-3 border-b border-hayat-border bg-hayat-soft px-4 py-3 sm:px-5">
            <h3 className="text-base font-black text-hayat-dark sm:text-lg">{policyModal.title}</h3>
            <button type="button" onClick={() => setPolicyModal(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-hayat-dark shadow-sm ring-1 ring-hayat-border hover:text-hayat-blue" aria-label="Pencereyi kapat">
              <X size={20} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5 text-sm font-semibold leading-7 text-[#4f6170] sm:px-7 sm:py-6 sm:text-base sm:leading-8">
            <p className="whitespace-pre-line">{policyModal.content}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-hayat-border bg-white px-4 py-3 sm:px-5">
            <button type="button" onClick={() => setPolicyModal(null)} className="min-h-11 rounded-[14px] border border-hayat-border bg-white px-5 text-sm font-black text-hayat-dark hover:bg-hayat-soft">
              Kapat
            </button>
            <button type="button" onClick={() => acceptPolicy(policyModal.slug)} className="min-h-11 rounded-[14px] bg-hayat-green px-6 text-sm font-black text-white shadow-green hover:bg-hayat-blue">
              Onaylıyorum
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export function DonationForm({ donationTypes, policies }: { donationTypes: DonationTypeOption[]; policies: PolicyOption[] }) {
  return (
    <Suspense fallback={
      <div className="rounded-[20px] border border-hayat-border bg-white p-6 text-center font-bold text-[#5d6b70] shadow-stk md:p-8">
        Bağış formu yükleniyor...
      </div>
    }>
      <DonationFormInner donationTypes={donationTypes} policies={policies} />
    </Suspense>
  );
}
