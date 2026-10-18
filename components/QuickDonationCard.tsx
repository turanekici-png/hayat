"use client";

import { FormEvent, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, HandCoins, LockKeyhole } from "lucide-react";

type DonationTypeOption = {
  code: string;
  label: string;
};

type QuickDonationCardProps = {
  donationTypes: DonationTypeOption[];
  title?: string | null;
  subtitle?: string | null;
  buttonLabel?: string | null;
  /** Tutar -> karsiligi (Site Ayarlari'ndan). Orn. { 500: "bir ailenin aylik gida kolisi" } */
  impacts?: Record<number, string>;
  sidePanel?: boolean;
  className?: string;
  style?: CSSProperties;
};

const fallbackTypes: DonationTypeOption[] = [
  { code: "GENEL", label: "Genel Bağış" },
  { code: "ZEKAT", label: "Zekat" },
  { code: "FITRE", label: "Fitre" },
  { code: "FIDYE", label: "Fidye" },
  { code: "SADAKA", label: "Sadaka" },
  { code: "KURBAN", label: "Kurban" },
  { code: "GIDA", label: "Gıda" },
  { code: "EGITIM", label: "Eğitim" }
];

const presetAmounts = [100, 250, 500, 1000];

function formatAmount(value: string | number) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? `${number.toLocaleString("tr-TR")} ₺` : "0 ₺";
}

export function QuickDonationCard({
  donationTypes,
  title,
  subtitle,
  buttonLabel,
  impacts = {},
  sidePanel = false,
  className = "",
  style
}: QuickDonationCardProps) {
  const types = donationTypes.length > 0 ? donationTypes : fallbackTypes;
  const defaultType = useMemo(
    () => types.find((type) => type.label.toLocaleLowerCase("tr-TR").includes("eğitim"))?.code || types[0]?.code || "GENEL",
    [types]
  );
  const [selectedType, setSelectedType] = useState(defaultType);
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const amount = customAmount.trim() || String(selectedAmount);
  const impact = impacts[Number(amount)];

  function submit(event: FormEvent<HTMLFormElement>) {
    if (!amount || Number(amount) <= 0) {
      event.preventDefault();
    }
  }

  return (
    <div
      id="bagis"
      className={`flex flex-col overflow-hidden rounded-3xl border border-[#dfe7ec] bg-white shadow-[0_24px_60px_rgba(10,58,85,0.12)] ${sidePanel ? "h-full" : ""} ${className}`}
      style={style}
    >
      <div className="flex items-center justify-between gap-3 bg-hayat-dark px-5 py-4 text-white sm:px-6">
        <div className="min-w-0">
          <h2 className="font-jakarta text-xl font-extrabold leading-tight sm:text-[22px]">{title || "Hızlı Bağış"}</h2>
          <p className="mt-0.5 text-sm font-semibold text-[#c3d7e3]">{subtitle || "1 dakikada güvenle tamamlayın"}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-black">
          <LockKeyhole size={13} /> Güvenli
        </span>
      </div>

      <form action="/bagis" method="GET" onSubmit={submit} className="flex flex-1 flex-col px-5 pb-5 pt-5 sm:px-6">
        <input type="hidden" name="type" value={selectedType} />
        <input type="hidden" name="amount" value={amount} />

        <p className="text-xs font-black uppercase tracking-[0.1em] text-[#5b6e78]">Bağış türü</p>
        <div className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label="Bağış türü">
          {types.map((type) => {
            const active = selectedType === type.code;
            return (
              <button
                key={type.code}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedType(type.code)}
                className={`h-10 rounded-full border px-4 text-sm font-extrabold transition ${active ? "border-hayat-dark bg-hayat-dark text-white" : "border-[#dfe7ec] bg-white text-[#33464f] hover:border-hayat-dark"}`}
              >
                {type.label}
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-xs font-black uppercase tracking-[0.1em] text-[#5b6e78]">Tutar</p>
        <div className="mt-2.5 grid grid-cols-4 gap-2" role="group" aria-label="Bağış tutarı">
          {presetAmounts.map((value) => {
            const active = !customAmount && selectedAmount === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSelectedAmount(value);
                  setCustomAmount("");
                }}
                className={`h-12 rounded-xl border-2 text-[15px] font-extrabold transition sm:text-base ${active ? "border-[#3f7d17] bg-[#f1f7ea] text-[#2f5f10]" : "border-[#dfe7ec] bg-white text-[#1f3440] hover:border-[#3f7d17]"}`}
              >
                {formatAmount(value)}
              </button>
            );
          })}
        </div>
        <label className={`mt-2 flex h-12 items-center gap-3 rounded-xl border-2 px-4 text-sm font-bold transition ${customAmount ? "border-[#3f7d17]" : "border-[#dfe7ec]"} text-[#5b6e78]`}>
          Diğer tutar
          <input
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
            type="number"
            min="1"
            step="0.01"
            inputMode="decimal"
            placeholder="₺"
            aria-label="Diğer bağış tutarı"
            className="min-w-0 flex-1 bg-transparent text-right text-base font-extrabold text-[#16272e] outline-none"
          />
        </label>

        {impact && (
          <p className="mt-3 flex items-start gap-2.5 rounded-xl bg-[#f1f7ea] px-4 py-3 text-sm font-semibold leading-6 text-[#2f4a1c]" aria-live="polite">
            <HandCoins size={18} className="mt-0.5 shrink-0 text-[#3f7d17]" />
            <span><strong className="font-extrabold">{formatAmount(amount)}</strong> ile {impact}</span>
          </p>
        )}

        <div className="flex-1" aria-hidden="true" />
        <button type="submit" className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#3f7d17] text-[17px] font-extrabold text-white shadow-[0_14px_30px_rgba(63,125,23,0.28)] transition hover:bg-hayat-dark">
          {formatAmount(amount)} {buttonLabel || "Bağış Yap"} <ArrowRight size={18} />
        </button>
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-bold text-[#6a7c86]">
          <span>3D Secure</span>
          <span aria-hidden="true">·</span>
          <span>Anında online makbuz</span>
          <span aria-hidden="true">·</span>
          <Link href="/hesap-numaralarimiz" className="text-[#0c5e8a] underline-offset-2 hover:underline">Havale / EFT</Link>
        </p>
      </form>
    </div>
  );
}
