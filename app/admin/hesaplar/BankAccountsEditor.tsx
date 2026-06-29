"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { BankAccount } from "@/lib/bank-accounts";

const emptyAccount: BankAccount = {
  bank: "",
  branch: "",
  accountName: "Hayat Ağacı Derneği",
  iban: "",
  type: "",
  description: ""
};

export function BankAccountsEditor({ accounts }: { accounts: BankAccount[] }) {
  const [rows, setRows] = useState<BankAccount[]>(accounts.length ? accounts : [{ ...emptyAccount }]);

  function update(index: number, key: keyof BankAccount, value: string) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  }

  function addRow() {
    setRows((current) => [...current, { ...emptyAccount }]);
  }

  function removeRow(index: number) {
    setRows((current) => current.length > 1 ? current.filter((_, rowIndex) => rowIndex !== index) : [{ ...emptyAccount }]);
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-hayat-dark">Banka hesapları</h2>
          <p className="mt-1 text-sm font-bold text-[#5d6b70]">Her banka hesabını ayrı kart olarak girin; boş kartlar kaydedilmez.</p>
        </div>
        <button type="button" onClick={addRow} className="inline-flex items-center gap-2 rounded-[14px] bg-hayat-blue px-4 py-3 text-sm font-black text-white shadow-stk">
          <Plus size={17} /> Hesap Ekle
        </button>
      </div>

      {rows.map((row, index) => (
        <div key={index} className="rounded-[20px] border border-hayat-border bg-hayat-soft p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-black text-hayat-dark">Hesap {index + 1}</p>
            <button type="button" onClick={() => removeRow(index)} className="inline-flex items-center gap-1 rounded-[12px] bg-red-50 px-3 py-2 text-xs font-black text-red-600">
              <Trash2 size={14} /> Sil
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-black text-[#5d6b70]">
              Banka Adı
              <input name="bank" value={row.bank} onChange={(event) => update(index, "bank", event.target.value)} className="mt-2 w-full rounded-[14px] border border-hayat-border bg-white p-3 font-bold text-hayat-dark outline-hayat-blue" placeholder="T.C. Ziraat Bankası" />
            </label>
            <label className="text-sm font-black text-[#5d6b70]">
              Şube
              <input name="branch" value={row.branch || ""} onChange={(event) => update(index, "branch", event.target.value)} className="mt-2 w-full rounded-[14px] border border-hayat-border bg-white p-3 font-bold text-hayat-dark outline-hayat-blue" placeholder="Sivas Merkez Şubesi" />
            </label>
            <label className="text-sm font-black text-[#5d6b70]">
              Hesap Adı
              <input name="accountName" value={row.accountName || ""} onChange={(event) => update(index, "accountName", event.target.value)} className="mt-2 w-full rounded-[14px] border border-hayat-border bg-white p-3 font-bold text-hayat-dark outline-hayat-blue" placeholder="Hayat Ağacı Derneği" />
            </label>
            <label className="text-sm font-black text-[#5d6b70]">
              Bağış Türü
              <input name="type" value={row.type || ""} onChange={(event) => update(index, "type", event.target.value)} className="mt-2 w-full rounded-[14px] border border-hayat-border bg-white p-3 font-bold text-hayat-dark outline-hayat-blue" placeholder="Genel Bağış" />
            </label>
            <label className="text-sm font-black text-[#5d6b70] md:col-span-2">
              IBAN
              <input name="iban" value={row.iban} onChange={(event) => update(index, "iban", event.target.value)} className="mt-2 w-full rounded-[14px] border border-hayat-border bg-white p-3 font-mono text-sm font-black text-hayat-dark outline-hayat-blue" placeholder="TR..." />
            </label>
            <label className="text-sm font-black text-[#5d6b70] md:col-span-2">
              Açıklama
              <input name="description" value={row.description || ""} onChange={(event) => update(index, "description", event.target.value)} className="mt-2 w-full rounded-[14px] border border-hayat-border bg-white p-3 font-bold text-hayat-dark outline-hayat-blue" placeholder="Açıklama kodu, hesap açıklaması veya özel not" />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
