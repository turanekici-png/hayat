"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";

type MediaLightboxTileProps = {
  src?: string | null;
  alt: string;
  isVideo?: boolean;
  className?: string;
  videoClassName?: string;
  emptyText?: string;
};

export function MediaLightboxTile({
  src,
  alt,
  isVideo = false,
  className = "h-full w-full object-cover",
  videoClassName,
  emptyText = "Medya eklenmedi"
}: MediaLightboxTileProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  if (!src) {
    return <div className={`${className} flex items-center justify-center bg-hayat-soft text-sm font-black text-slate-500`}>{emptyText}</div>;
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="group relative block h-full w-full overflow-hidden text-left outline-none focus-visible:ring-4 focus-visible:ring-hayat-green/40">
        {isVideo ? (
          <>
            <video src={src} className={videoClassName || className} preload="metadata" muted />
            <span className="absolute inset-0 flex items-center justify-center bg-slate-950/10 transition group-hover:bg-slate-950/30">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-hayat-blue shadow-2xl transition group-hover:scale-110 group-hover:text-hayat-green">
                <Play size={24} fill="currentColor" />
              </span>
            </span>
          </>
        ) : (
          <img src={src} alt={alt} loading="lazy" decoding="async" className={`${className} transition duration-500 group-hover:scale-105`} />
        )}
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 p-4" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <button type="button" onClick={() => setOpen(false)} className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-hayat-dark shadow-stk transition hover:bg-hayat-green hover:text-white" aria-label="Kapat">
            <X size={22} />
          </button>
          {isVideo ? (
            <video src={src} className="max-h-[88vh] max-w-[94vw] rounded-lg bg-black shadow-2xl" controls autoPlay onClick={(event) => event.stopPropagation()} />
          ) : (
            <img src={src} alt={alt} className="max-h-[88vh] max-w-[94vw] rounded-lg object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} />
          )}
        </div>,
        document.body
      )}
    </>
  );
}
