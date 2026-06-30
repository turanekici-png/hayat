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
      title={copied ? "Kopyalandı!" : label}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <Copy size={16} />
      {!iconOnly && <span>{copied ? "Kopyalandı!" : label}</span>}
    </button>
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <Copy size={16} />
      {!iconOnly && <span>{copied ? "Kopyalandı!" : label}</span>}
    </button>