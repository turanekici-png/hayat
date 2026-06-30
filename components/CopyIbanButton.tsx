"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

export function CopyIbanButton({ value, className = "", label = "Kopyala", iconOnly = false }: { value: string; className?: string; label?: string; iconOnly?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "IBAN kopyalandı" : label}
      title={copied ? "Kopyalandı" : label}
      className={`inline-flex shrink-0 items-center gap-2 rounded-[12px] bg-hayat-blue px-4 py-2 text-xs font-black text-white transition hover:bg-hayat-green ${className}`}
    >
      <Copy size={18} />
      {!iconOnly && (copied ? "Kopyalandı" : label)}
    </button>
  );
}
