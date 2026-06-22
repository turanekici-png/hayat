"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function ExpandableText({
  title,
  text,
  className,
  style,
  limit = 180
}: {
  title: string;
  text?: string | null;
  className?: string;
  style?: CSSProperties;
  limit?: number;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const content = text?.trim() || "Bu alanın açıklaması kontrol panelindeki Açıklama / içerik bölümünden güncellenebilir.";
  const isLong = content.length > limit;
  const preview = isLong ? `${content.slice(0, limit).trim()}...` : content;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <div>
        <p className={className} style={style}>{preview}</p>
        {isLong && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-4 inline-flex items-center text-xs font-black uppercase tracking-widest text-hayat-green hover:text-hayat-blue"
          >
            Devamını Oku
          </button>
        )}
      </div>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-hayat-dark/80 px-4 py-6 md:px-8" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="mx-auto my-4 w-full max-w-4xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white p-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-hayat-green">Açıklama</p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-hayat-dark md:text-4xl">{title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 md:p-8">
              <p className="whitespace-pre-line text-base font-semibold leading-9 text-[#607081] md:text-lg md:leading-10">{content}</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
