"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { defaultIbanLabels, type BankAccount } from "@/lib/bank-accounts";
import { MediaField } from "../MediaField";

type MediaItem = {
  id: string;
  title: string | null;
  url: string;
  filename: string;
  mimeType: string | null;
};

const emptyAccount: BankAccount = {
  bank: "",
  logoUrl: "",
  branch: "",
  accountName: "Hayat Ağacı Derneği",
  type: "",
  description: "",
  ibans: defaultIbanLabels.map((label) => ({ label, iban: "" }))
};

function withMinimumIbans(account: BankAccount): BankAccount {
  return {
    ...account,
    logoUrl: account.logoUrl || "",
    ibans: defaultIbanLabels.map((label, index) => ({
      label,
      iban: account.ibans?.[index]?.iban || ""
    }))
  };
}

function createEmptyAccount(): BankAccount {
  return {
    ...emptyAccount,
    ibans: defaultIbanLabels.map((label) => ({ label, iban: "" }))
  };
}

function ibanFieldName(index: number) {
  if (index === 0) return "tlIban";
  if (index === 1) return "dolarIban";
  return "euroIban";
}

export function BankAccountsEditor({ accounts, media }: { accounts: BankAccount[]; media: MediaItem[] }) {
  const [rows, setRows] = useState<BankAccount[]>(accounts.length ? accounts.map(withMinimumIbans) : [createEmptyAccount()]);

  function update(index: number, key: keyof Omit<BankAccount, "ibans">, value: string) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  }

  function updateIban(accountIndex: number, ibanIndex: number, value: string) {
    setRows((current) => current.map((row, rowIndex) => {
      if (rowIndex !== accountIndex) return row;
      return {
        ...row,
        ibans: withMinimumIbans(row).ibans.map((iban, currentIbanIndex) => currentIbanIndex === ibanIndex ? { ...iban, iban: value } : iban)
      };
    }));
  }

  function addRow() {
    setRows((current) => [...current, createEmptyAccount()]);
  }

  function removeRow(index: number) {
    setRows((current) => current.length > 1 ? current.filter((_, rowIndex) => rowIndex !== index) : [createEmptyAccount()]);
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-hayat-dark">Banka hesapları</h2>
          <p className="mt-1 text-sm font-bold text-[#5d6b70]">Her banka için logo, bağış grubu ve TL, Dolar, Euro IBAN bilgilerini girin. Boş IBAN alanları sitede gösterilmez.</p>
        </div>
        <button type="button" onClick={addRow} className="inline-flex items-center gap-2 rounded-[14px] bg-hayat-blue px-4 py-3 text-sm font-black text-white shadow-stk">
          <Plus size={17} /> Banka Ekle
        </button>
      </div>

      {rows.map((row, index) => (
        <div key={index} className="rounded-[20px] border border-hayat-border bg-hayat-soft p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-black text-hayat-dark">Banka {index + 1}</p>
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
              Banka Logosu
              <MediaField name="logoUrl" defaultValue={row.logoUrl || ""} placeholder="/uploads/banka-logo.png" media={media} inputClassName="w-full rounded-[14px] border border-hayat-border bg-white p-3 font-bold text-hayat-dark outline-hayat-blue" />
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
              Bağış Türü / Grup
              <input name="type" value={row.type || ""} onChange={(event) => update(index, "type", event.target.value)} className="mt-2 w-full rounded-[14px] border border-hayat-border bg-white p-3 font-bold text-hayat-dark outline-hayat-blue" placeholder="Genel Bağış" />
            </label>
            <label className="text-sm font-black text-[#5d6b70] md:col-span-2">
              Açıklama
              <input name="description" value={row.description || ""} onChange={(event) => update(index, "description", event.target.value)} className="mt-2 w-full rounded-[14px] border border-hayat-border bg-white p-3 font-bold text-hayat-dark outline-hayat-blue" placeholder="Açıklama kodu, hesap açıklaması veya özel not" />
            </label>
          </div>

          <div className="mt-4 grid gap-3">
            {withMinimumIbans(row).ibans.map((iban, ibanIndex) => (
              <label key={iban.label} className="grid gap-2 rounded-[16px] border border-hayat-border bg-white p-3 text-sm font-black text-[#5d6b70] md:grid-cols-[160px_1fr] md:items-center">
                <span>{iban.label}</span>
                <input name={ibanFieldName(ibanIndex)} value={iban.iban} onChange={(event) => updateIban(index, ibanIndex, event.target.value)} className="w-full rounded-[12px] border border-hayat-border bg-hayat-soft p-3 font-mono text-sm font-black text-hayat-dark outline-hayat-blue" placeholder="TR..." />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
