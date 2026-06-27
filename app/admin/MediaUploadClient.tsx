"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

type UploadedMedia = {
  id: string;
  title: string | null;
  filename: string;
  mimeType: string | null;
  url: string;
};

async function uploadOne(file: File, title?: string, prefix?: string) {
  const formData = new FormData();
  formData.set("file", file);
  if (title) formData.set("title", title);
  if (prefix) formData.set("prefix", prefix);

  const response = await fetch("/api/media-upload", {
    method: "POST",
    body: formData,
    credentials: "same-origin"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Medya yuklenemedi.");
  }
  return data as UploadedMedia;
}

export function SectionMediaUploader({ prefix, startOrder }: { prefix: string; startOrder: number }) {
  const [items, setItems] = useState<UploadedMedia[]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border-2 border-dashed border-hayat-green/30 bg-hayat-soft p-4">
      <label className="block font-bold text-slate-700">
        Bu alanın kendi medya kütüphanesine resim/video yükle
        <input
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png,video/mp4,video/webm,video/ogg,video/quicktime"
          multiple
          disabled={pending}
          className="mt-3 w-full rounded-xl bg-white p-3 font-normal"
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files || []);
            event.currentTarget.value = "";
            setError("");
            if (!files.length) return;
            startTransition(async () => {
              try {
                const uploaded = [];
                for (const file of files) {
                  uploaded.push(await uploadOne(file, file.name, prefix));
                }
                setItems((current) => [...current, ...uploaded]);
              } catch (uploadError) {
                setError(uploadError instanceof Error ? uploadError.message : "Medya yuklenemedi.");
              }
            });
          }}
        />
      </label>
      <span className="mt-2 block text-xs font-normal text-slate-500">Dosyalar once veritabanina yuklenir; Kaydet butonu sadece medya yolunu kaydeder.</span>
      {pending && <p className="mt-3 flex items-center gap-2 text-sm font-bold text-hayat-blue"><Loader2 className="animate-spin" size={16} /> Yukleniyor...</p>}
      {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      {items.length > 0 && (
        <div className="mt-3 space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-xl bg-white p-3 text-xs font-bold text-slate-600">
              <input type="hidden" name="newSectionImageUrl" value={item.url} />
              <input type="hidden" name="newSectionImageAlt" value={item.title || item.filename} />
              <input type="hidden" name="newSectionImageSortOrder" value={startOrder + index} />
              <span className="block truncate text-hayat-dark">{item.title || item.filename}</span>
              <span className="mt-1 block break-all text-slate-500">{item.url}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MediaLibraryUploader() {
  const titleRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-5 space-y-3">
      <input ref={titleRef} placeholder="Medya başlığı" className="w-full rounded-2xl border p-3" />
      <input
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png,video/mp4,video/webm,video/ogg,video/quicktime"
        required
        disabled={pending}
        className="w-full rounded-2xl border p-3"
        onChange={(event) => setFile(event.currentTarget.files?.[0] || null)}
      />
      {error && <p className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      <button
        type="button"
        disabled={pending || !file}
        onClick={() => {
          if (!file) return;
          setError("");
          startTransition(async () => {
            try {
              await uploadOne(file, titleRef.current?.value || file.name);
              window.location.href = "/admin?sayfa=medya&medyaDurum=ok#medya";
            } catch (uploadError) {
              setError(uploadError instanceof Error ? uploadError.message : "Medya yuklenemedi.");
            }
          });
        }}
        className="w-full rounded-2xl bg-hayat-blue px-6 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="mr-2 inline animate-spin" size={18} /> : <ImagePlus className="mr-2 inline" size={18} />}
        Medya Yükle
      </button>
    </div>
  );
}
