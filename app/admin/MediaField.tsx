"use client";

import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";

type MediaItem = {
  id: string;
  title: string | null;
  url: string;
  filename: string;
  mimeType: string | null;
};

function isVideoMedia(url: string, mimeType?: string | null) {
  return Boolean(mimeType?.startsWith("video/") || /\.(mp4|webm|ogg|mov)$/i.test(url));
}

export function MediaField({
  name,
  defaultValue,
  placeholder,
  media,
  inputClassName = "w-full rounded-xl border p-3"
}: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  media: MediaItem[];
  inputClassName?: string;
}) {
  const [value, setValue] = useState(defaultValue || "");
  const [open, setOpen] = useState(false);
  const safeMedia = media.filter((item) => typeof item.url === "string" && item.url.trim().length > 0);

  useEffect(() => {
    setValue(defaultValue || "");
  }, [defaultValue]);

  return (
    <>
      <div className="mt-1 flex gap-2">
        <input
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className={inputClassName}
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="shrink-0 rounded-xl bg-red-50 px-4 text-xs font-black text-red-600 transition hover:bg-red-100"
          >
            Sil
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-xl bg-hayat-blue px-4 text-xs font-black text-white transition hover:bg-hayat-dark"
        >
          Medya Seç
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-hayat-dark/60 p-4">
          <div className="max-h-[86vh] w-full max-w-5xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-xl font-black text-hayat-dark">Medya Seç</h2>
                <p className="text-sm text-slate-500">Bir görsel veya video seçin; medya yolu otomatik eklenecek.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[68vh] overflow-y-auto p-5">
              {safeMedia.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {safeMedia.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setValue(item.url);
                        setOpen(false);
                      }}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 text-left transition hover:-translate-y-1 hover:border-hayat-green hover:shadow-stk"
                    >
                      {isVideoMedia(item.url, item.mimeType) ? (
                        <video src={item.url} className="h-36 w-full rounded-xl object-cover" preload="metadata" />
                      ) : (
                        <img src={item.url} alt={item.title || item.filename} loading="lazy" decoding="async" className="h-36 w-full rounded-xl object-cover" />
                      )}
                      <div className="p-2">
                        <p className="truncate text-sm font-black text-hayat-dark">{item.title || item.filename}</p>
                        <p className="mt-1 break-all text-[11px] font-semibold text-slate-500">{item.url}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-8 text-center">
                  <ImagePlus className="mx-auto text-hayat-green" size={42} />
                  <p className="mt-3 font-bold text-slate-600">Henüz medya yüklenmedi.</p>
                  <p className="mt-1 text-sm text-slate-500">Önce “Resim / video yükle” alanından dosya yükleyin.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
