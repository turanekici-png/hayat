"use client";

import { useState } from "react";

export function CopyIbanButton({ value, className = "" }: { value: string; className?: string }) {
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
      className={`shrink-0 rounded-[12px] bg-hayat-blue px-4 py-2 text-xs font-black text-white transition hover:bg-hayat-green ${className}`}
    >
      {copied ? "Kopyalandı" : "Kopyala"}
    </button>
  );
}
