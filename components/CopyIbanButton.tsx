"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** IBAN kopyalama ikon butonu. Kopyalaninca kisa sure onay isaretine doner. */
export function CopyIbanButton({
  value,
  className = "",
  label = "IBAN'ı kopyala"
}: {
  value: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const currentLabel = copied ? "Kopyalandı" : label;

  async function copy() {
    try {
      await navigator.clipboard.writeText(value.replace(/\s+/g, ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={currentLabel}
      title={currentLabel}
      className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hayat-blue/25 ${
        copied
          ? "border-hayat-green bg-hayat-green text-white"
          : "border-[#d5e1e9] bg-white text-[#36505f] hover:border-[color:var(--bank-primary,#1593cf)] hover:text-[color:var(--bank-text,#0a3a55)] hover:shadow-[0_6px_16px_rgba(10,58,85,0.12)]"
      } ${className}`}
    >
      {copied ? <Check size={18} strokeWidth={2.6} aria-hidden="true" /> : <Copy size={17} strokeWidth={2.2} aria-hidden="true" />}
      <span className="sr-only" aria-live="polite">{copied ? "Kopyalandı" : ""}</span>
    </button>
  );
}
