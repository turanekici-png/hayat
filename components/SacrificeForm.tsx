"use client";

import { useState } from "react";
import { BadgeCheck, Beef } from "lucide-react";

export function SacrificeForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = event.currentTarget;
    const response = await fetch("/api/kurban", { method: "POST", body: new FormData(form) });
    const result = await response.json();
    setLoading(false);
    setMessage(result.message || "Kayıt oluşturulamadı.");
    if (result.ok) form.reset();
  }

  return (
    <form onSubmit={submit} className="rounded-[2rem] bg-white p-6 shadow-soft md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-hayat-soft text-hayat-green"><Beef /></span>
        <div><h2 className="text-2xl font-black text-hayat-dark">Kurban Organizasyonu</h2><p className="text-sm text-slate-500">Hisse ve kurban türü bilgilerini kaydedin.</p></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <input required name="fullName" placeholder="Ad Soyad" className="rounded-2xl border p-4" />
        <input name="phone" placeholder="Telefon" className="rounded-2xl border p-4" />
        <input name="email" type="email" placeholder="E-posta" className="rounded-2xl border p-4" />
        <input required name="shares" type="number" min="1" defaultValue="1" placeholder="Hisse sayısı" className="rounded-2xl border p-4" />
        <select name="type" className="rounded-2xl border p-4">
          <option value="KURBAN">Kurban</option><option value="ADAK">Adak</option><option value="AKIKA">Akika</option><option value="SUKUR">Şükür</option>
        </select>
        <input name="amount" type="number" min="0" step="0.01" placeholder="Tutar (opsiyonel)" className="rounded-2xl border p-4" />
        <textarea name="note" rows={4} placeholder="Vekalet, açıklama veya özel not" className="rounded-2xl border p-4 md:col-span-2" />
      </div>
      {message && <div className="mt-4 rounded-2xl bg-hayat-green/10 p-4 font-bold text-hayat-dark"><BadgeCheck className="mr-2 inline text-hayat-green" /> {message}</div>}
      <button disabled={loading} className="mt-6 w-full rounded-2xl bg-hayat-green px-6 py-4 font-black text-white disabled:opacity-60">{loading ? "Kaydediliyor..." : "Kurban Kaydı Oluştur"}</button>
    </form>
  );
}
