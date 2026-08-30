"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Beklenmeyen sayfa hatası:", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#f6fafc] px-4 py-20 text-center">
      <p className="text-sm font-black uppercase tracking-[.2em] text-red-500">Hata</p>
      <h1 className="text-3xl font-black text-hayat-dark md:text-4xl">Bir şeyler ters gitti</h1>
      <p className="max-w-md text-slate-500">
        Sayfa yüklenirken beklenmeyen bir hata oluştu. Sorun devam ederse lütfen daha sonra tekrar deneyin.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-2 rounded-full bg-hayat-green px-6 py-3 text-sm font-black text-white"
      >
        Tekrar Dene
      </button>
    </main>
  );
}
