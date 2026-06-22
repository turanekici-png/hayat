"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, SearchCheck, UploadCloud } from "lucide-react";

const aidTypes = [
  ["GIDA", "Gıda Yardımı"],
  ["NAKIT", "Nakit Yardımı"],
  ["GIYIM", "Giyim Yardımı"],
  ["EGITIM", "Eğitim Yardımı"],
  ["SAGLIK", "Sağlık Yardımı"],
  ["BARINMA", "Barınma Yardımı"],
  ["DIGER", "Diğer"]
];

export function ApplicationForm() {
  const [message, setMessage] = useState("");
  const [applicationNo, setApplicationNo] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setApplicationNo("");
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/applications", { method: "POST", body: data });
      const result = await response.json();
      setMessage(result.message || (result.ok ? "Başvurunuz alınmıştır." : "Başvuru gönderilemedi."));
      if (result.ok) {
        setApplicationNo(result.applicationNo || "");
        form.reset();
      }
    } catch {
      setMessage("Başvuru gönderilirken bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submitApplication} className="rounded-[2rem] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 border-b pb-5">
        <FileText className="text-hayat-green" />
        <div>
          <h2 className="text-2xl font-black text-hayat-dark">Online Yardım Başvuru Formu</h2>
          <p className="text-sm text-slate-500">Başvuru no otomatik oluşur. Evraklarınızı da yükleyebilirsiniz.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="font-bold text-slate-700">Ad Soyad *<input name="fullName" required className="mt-2 w-full rounded-2xl border p-3 font-normal" placeholder="Adınız soyadınız" /></label>
        <label className="font-bold text-slate-700">TC Kimlik No<input name="nationalId" className="mt-2 w-full rounded-2xl border p-3 font-normal" placeholder="İsteğe bağlı" /></label>
        <label className="font-bold text-slate-700">Telefon *<input name="phone" required className="mt-2 w-full rounded-2xl border p-3 font-normal" placeholder="05xx xxx xx xx" /></label>
        <label className="font-bold text-slate-700">E-posta<input name="email" type="email" className="mt-2 w-full rounded-2xl border p-3 font-normal" placeholder="ornek@mail.com" /></label>
        <label className="font-bold text-slate-700">İl<input name="city" className="mt-2 w-full rounded-2xl border p-3 font-normal" placeholder="Sivas" /></label>
        <label className="font-bold text-slate-700">İlçe<input name="district" className="mt-2 w-full rounded-2xl border p-3 font-normal" placeholder="Merkez" /></label>
        <label className="font-bold text-slate-700">Hane kişi sayısı<input name="householdCount" type="number" min="1" className="mt-2 w-full rounded-2xl border p-3 font-normal" placeholder="4" /></label>
        <label className="font-bold text-slate-700">Aylık gelir<input name="monthlyIncome" type="number" min="0" step="0.01" className="mt-2 w-full rounded-2xl border p-3 font-normal" placeholder="0" /></label>
        <label className="font-bold text-slate-700">Çalışma / gelir açıklaması<input name="employment" className="mt-2 w-full rounded-2xl border p-3 font-normal" placeholder="Çalışmıyor / emekli / günlük iş vb." /></label>
        <label className="font-bold text-slate-700">Araç bilgisi<input name="vehicleInfo" className="mt-2 w-full rounded-2xl border p-3 font-normal" placeholder="Yok / varsa model-yıl" /></label>
        <label className="font-bold text-slate-700 md:col-span-2">IBAN<input name="iban" className="mt-2 w-full rounded-2xl border p-3 font-normal" placeholder="TR..." /></label>
        <label className="font-bold text-slate-700 md:col-span-2">Yardım türü *<select name="aidType" required className="mt-2 w-full rounded-2xl border p-3 font-normal">{aidTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="font-bold text-slate-700 md:col-span-2">Adres<textarea name="address" className="mt-2 min-h-24 w-full rounded-2xl border p-3 font-normal" placeholder="Mahalle, cadde/sokak, bina/daire bilgisi" /></label>
        <label className="font-bold text-slate-700 md:col-span-2">Başvuru açıklaması *<textarea name="description" required className="mt-2 min-h-32 w-full rounded-2xl border p-3 font-normal" placeholder="İhtiyaç durumunuzu ve talebinizi açıklayın." /></label>
        <label className="rounded-2xl border border-dashed p-4 font-bold text-slate-700 md:col-span-2"><UploadCloud className="mr-2 inline text-hayat-green" /> Evrak yükle<input name="documents" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" className="mt-3 w-full rounded-2xl bg-slate-50 p-3 font-normal" /><span className="mt-2 block text-xs font-normal text-slate-500">Kimlik, ikametgah, rapor, bordro vb. PDF/JPG/PNG yüklenebilir.</span></label>
      </div>

      <div className="mt-6 rounded-2xl bg-hayat-soft p-4 text-sm leading-6 text-slate-600">Başvuruyu göndererek bilgilerin başvurunun değerlendirilmesi amacıyla dernek tarafından kaydedilmesini kabul etmiş olursunuz.</div>
      {message && <div className="mt-4 rounded-2xl bg-hayat-green/10 p-4 font-bold text-hayat-dark">{message}{applicationNo && <Link href={`/basvuru-takip?no=${encodeURIComponent(applicationNo)}`} className="mt-3 flex items-center gap-2 text-hayat-blue underline"><SearchCheck size={18} /> Başvurumu takip et</Link>}</div>}
      <button disabled={loading} className="mt-6 w-full rounded-2xl bg-hayat-green px-6 py-4 text-lg font-black text-white shadow-soft hover:bg-hayat-dark disabled:opacity-60">{loading ? "Gönderiliyor..." : "Başvuruyu Gönder"}</button>
    </form>
  );
}
