"use client";

import { FormEvent, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Heart, LockKeyhole } from "lucide-react";

type DonationTypeOption = {
  code: string;
  label: string;
};

type QuickDonationCardProps = {
  donationTypes: DonationTypeOption[];
  title?: string | null;
  subtitle?: string | null;
  buttonLabel?: string | null;
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

export function QuickDonationCard({
  donationTypes,
  title,
  subtitle,
  buttonLabel,
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
  const activeType = types.find((type) => type.code === selectedType) || types[0];
  const amount = customAmount.trim() || String(selectedAmount);

  function submit(event: FormEvent<HTMLFormElement>) {
    if (!amount || Number(amount) <= 0) {
      event.preventDefault();
    }
  }

  return (
    <div className={`quick-donation-card quick-donation-shell ${sidePanel ? "quick-donation-side h-full" : ""} ${className}`} style={style}>
      <div className="quick-donation-top">
        <div className="quick-donation-heading">
          <h2 className="quick-donation-title">{title || "Hızlı Bağış"}</h2>
          <p className="quick-donation-subtitle">{subtitle || "Bağış türünü ve tutarını seç, anında destek ol"}</p>
        </div>
        <span className="quick-donation-secure"><LockKeyhole size={13} /> Güvenli ödeme</span>
      </div>

      <form action="/bagis" method="GET" onSubmit={submit} className="quick-donation-form">
        <input type="hidden" name="type" value={selectedType} />
        <input type="hidden" name="amount" value={amount} />

        <div className="quick-donation-types" role="group" aria-label="Bağış türü">
          {types.map((type) => (
            <button
              key={type.code}
              type="button"
              onClick={() => setSelectedType(type.code)}
              className={`quick-donation-pill ${selectedType === type.code ? "is-active" : ""}`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="quick-donation-amounts" role="group" aria-label="Bağış tutarı">
          {presetAmounts.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setSelectedAmount(value);
                setCustomAmount("");
              }}
              className={`quick-donation-amount ${!customAmount && selectedAmount === value ? "is-active" : ""}`}
            >
              ₺{value}
            </button>
          ))}
          <label className={`quick-donation-other ${customAmount ? "is-active" : ""}`}>
            <span>Diğer</span>
            <input
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              placeholder="Tutar"
              aria-label="Diğer bağış tutarı"
            />
          </label>
        </div>

        <div className="quick-donation-bottom">
          <div className="quick-donation-summary" aria-live="polite">
            <span>{activeType?.label || "Genel Bağış"}</span>
            <strong>₺{amount || "0"}</strong>
          </div>
          <button type="submit" className="quick-donation-submit">
            <Heart size={16} fill="currentColor" /> {buttonLabel || "Şimdi Destek Ol"} →
          </button>
        </div>
      </form>
    </div>
  );
}
