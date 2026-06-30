"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

export function CopyIbanButton({
  value,
  className = "",
  label = "Kopyala",
  iconOnly = false,
  mobileIconOnly = false
}: {
  value: string;
  className?: string;
  label?: string;
  iconOnly?: boolean;
  mobileIconOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const currentLabel = copied ? "Kopyalandı!" : label;

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
      aria-label={currentLabel}
      title={currentLabel}
      className={`inline-flex items-center justify-center gap-1.5 bg-hayat-blue px-11 py-2 transition hover:bg-hayat-green ${className} !text-white [&_span]:!text-white [&_svg]:!text-white`}
    >
      {(iconOnly || mobileIconOnly) && <Copy size={iconOnly ? 18 : 16} aria-hidden="true" className={mobileIconOnly && !iconOnly ? "sm:hidden" : ""} />}
      {!iconOnly && <span className={mobileIconOnly ? "hidden sm:inline" : ""}>{currentLabel}</span>}
    </button>
  );
}
