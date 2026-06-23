"use client";

import { useEffect, useState } from "react";
import { X, ArrowRight } from "lucide-react";

type PopupData = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  buttonLabel?: string | null;
  buttonUrl?: string | null;
  showOnce: boolean;
  delaySeconds: number;
} | null;

function safelyGetStorageItem(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safelySetStorageItem(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

export function HomePopup({ popup }: { popup: PopupData }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!popup) return;
    const storageKey = `hayat-popup-seen-${popup.id}`;
    if (popup.showOnce && safelyGetStorageItem(storageKey) === "1") return;
    const timer = window.setTimeout(() => setOpen(true), Math.max(0, popup.delaySeconds || 0) * 1000);
    return () => window.clearTimeout(timer);
  }, [popup]);

  if (!popup || !open) return null;

  const closePopup = () => {
    if (popup.showOnce) safelySetStorageItem(`hayat-popup-seen-${popup.id}`, "1");
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-hayat-dark/55 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <button
          onClick={closePopup}
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-hayat-dark shadow-sm transition hover:bg-hayat-blue hover:text-white"
          aria-label="Popup kapat"
        >
          <X size={22} />
        </button>

        {popup.imageUrl && (
          <div className="bg-hayat-soft">
            <img src={popup.imageUrl} alt={popup.imageAlt || popup.title} loading="lazy" decoding="async" className="h-56 w-full object-cover sm:h-72" />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <p className="mb-3 inline-flex rounded-full bg-hayat-mint px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-hayat-greenDark">Duyuru</p>
          <h2 className="text-3xl font-black leading-tight text-hayat-ink sm:text-4xl">{popup.title}</h2>
          <p className="mt-4 whitespace-pre-line text-base leading-7 text-slate-600 sm:text-lg">{popup.content}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {popup.buttonUrl && (
              <a href={popup.buttonUrl} onClick={closePopup} className="inline-flex items-center justify-center gap-2 rounded-full bg-hayat-blue px-7 py-4 font-black text-white transition hover:bg-hayat-green">
                {popup.buttonLabel || "Detayları Gör"} <ArrowRight size={18} />
              </a>
            )}
            <button onClick={closePopup} className="rounded-full border border-slate-200 px-7 py-4 font-black text-hayat-dark transition hover:border-hayat-blue hover:text-hayat-blue">
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
