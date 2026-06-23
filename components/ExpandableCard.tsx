"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function ExpandableCard({
  title,
  subtitle,
  body,
  imageUrl,
  imageAlt,
  label = "İçerik",
  className,
  style,
  children
}: {
  title: string;
  subtitle?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  label?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const content = body?.trim() || "Bu içeriğin açıklaması kontrol panelinden güncellenebilir.";

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

  function openCard(event: MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("a,button,input,select,textarea")) return;
    setOpen(true);
  }

  return (
    <>
      <article
        className={className}
        style={style}
        role="button"
        tabIndex={0}
        onClick={openCard}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {children}
      </article>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-hayat-dark/80 px-4 py-6 md:px-8" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="mx-auto my-4 w-full max-w-[1180px] overflow-hidden rounded-[1.5rem] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white p-6 md:p-8">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-hayat-green">{label}</p>
                <h2 className="mt-2 text-3xl font-black leading-tight text-hayat-dark md:text-5xl">{title}</h2>
                {subtitle && <p className="mt-3 text-base font-bold text-hayat-blue">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600"
                aria-label="Kapat"
              >
                <X size={20} />
              </button>
            </div>
            {imageUrl && (
              <img src={imageUrl} alt={imageAlt || title} loading="lazy" decoding="async" className="max-h-[520px] w-full bg-white object-contain" />
            )}
            <div className="p-6 md:p-10">
              <p className="whitespace-pre-line text-base font-semibold leading-8 text-[#607081] md:text-xl md:leading-10">{content}</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
