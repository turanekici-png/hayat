"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

/**
 * Tum basvurulari kalici olarak silme alani. "SIL" yazilmadan buton aktif olmaz,
 * ayrica tarayici onayi istenir; sunucu da ayni yaziyi tekrar kontrol eder.
 */
export function DeleteAllApplications({ count, action }: { count: number; action: (formData: FormData) => Promise<void> }) {
  const [text, setText] = useState("");
  const ready = text.trim().toLocaleUpperCase("tr-TR") === "SİL";

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!ready || !window.confirm(`${count} başvuru, belgeleri ve SMS kayıtlarıyla birlikte KALICI olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`)) {
          event.preventDefault();
        }
      }}
      className="rounded-2xl border border-red-200 bg-red-50/60 p-5"
    >
      <p className="flex items-center gap-2 font-black text-red-800"><Trash2 size={18} /> Tüm başvuruları sil</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-red-900/80">
        {count} başvuru; ad, TC, telefon, adres bilgileri, yüklenen belgeler ve gönderilen SMS kayıtlarıyla birlikte kalıcı olarak silinir. Geri alınamaz. Gerekliyse önce veritabanı yedeği alın.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm font-bold text-red-900">
          Onaylamak için <strong>SİL</strong> yazın
          <input name="confirm" value={text} onChange={(event) => setText(event.target.value)} autoComplete="off" className="mt-1 block h-11 w-44 rounded-xl border border-red-300 bg-white px-3 font-black uppercase text-red-800 outline-none focus:ring-4 focus:ring-red-200" />
        </label>
        <button type="submit" disabled={!ready || count === 0} className="h-11 rounded-xl bg-red-600 px-5 font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40">
          Tüm Başvuruları Kalıcı Olarak Sil
        </button>
      </div>
    </form>
  );
}
