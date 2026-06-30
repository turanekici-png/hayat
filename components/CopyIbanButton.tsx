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
      aria-label={copied ? "kopyalandı" : label}
      title={copied ? "Kopyalandı!" : label}
      className={`inline-flex justify-start items-center bg-hayat-blue px-4 py-2 text-white transition hover:bg-hayat-green w-28 ${className}`} // Buton sabit genişlikte ve sola hizalı
    >
      <span>Kopyala</span>
    </button>
  );
}