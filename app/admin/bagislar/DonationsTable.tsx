"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

export type ClientDonation = {
  id: string;
  dateLabel: string;
  receiptNo: string;
  fullName: string;
  phone: string;
  amountLabel: string;
  type: string;
  description: string;
  status: string;
  statusLabel: string;
  paymentRef: string;
  isPaid: boolean;
};

type ColumnKey = "date" | "receipt" | "name" | "phone" | "amount" | "type" | "description" | "status" | "ref";
type WidthKey = "dar" | "orta" | "genis";

const COLUMN_DEFS: { key: ColumnKey; label: string }[] = [
  { key: "date", label: "Tarih" },
  { key: "receipt", label: "Makbuz No" },
  { key: "name", label: "Ad Soyad" },
  { key: "phone", label: "Telefon" },
  { key: "amount", label: "Tutar" },
  { key: "type", label: "Tür" },
  { key: "description", label: "Açıklama" },
  { key: "status", label: "Durum" },
  { key: "ref", label: "Ref" }
];

const WIDTH_PX: Record<WidthKey, number> = { dar: 90, orta: 150, genis: 260 };
const DEFAULT_WIDTHS: Record<ColumnKey, WidthKey> = {
  date: "orta",
  receipt: "orta",
  name: "orta",
  phone: "orta",
  amount: "dar",
  type: "dar",
  description: "genis",
  status: "dar",
  ref: "orta"
};

const STORAGE_KEY = "hayatder-bagislar-sutunlar-v1";

export function DonationsTable({
  donations,
  exportAllHref,
  deleteDonation,
  deleteSelectedDonations
}: {
  donations: ClientDonation[];
  exportAllHref: string;
  deleteDonation: (formData: FormData) => Promise<void>;
  deleteSelectedDonations: (formData: FormData) => Promise<void>;
}) {
  const [visible, setVisible] = useState<Record<ColumnKey, boolean>>(() =>
    COLUMN_DEFS.reduce((acc, col) => ({ ...acc, [col.key]: true }), {} as Record<ColumnKey, boolean>)
  );
  const [widths, setWidths] = useState<Record<ColumnKey, WidthKey>>(DEFAULT_WIDTHS);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { visible?: Partial<Record<ColumnKey, boolean>>; widths?: Partial<Record<ColumnKey, WidthKey>> };
      if (saved.visible) setVisible((prev) => ({ ...prev, ...saved.visible }));
      if (saved.widths) setWidths((prev) => ({ ...prev, ...saved.widths }));
    } catch {
      // localStorage okunamazsa varsayılanlarla devam edilir.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ visible, widths }));
    } catch {
      // localStorage yazılamazsa sessizce yok sayılır (özel gezinti vb.).
    }
  }, [visible, widths]);

  const rows = useMemo(() => donations.filter((donation) => !removedIds.has(donation.id)), [donations, removedIds]);

  function toggleSelected(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleDeleteOne(id: string, label: string) {
    if (!window.confirm(`"${label}" kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
    setRemovedIds((prev) => new Set(prev).add(id));
    const formData = new FormData();
    formData.set("id", id);
    startTransition(async () => {
      await deleteDonation(formData);
    });
  }

  function handleDeleteSelected() {
    if (!selected.size) return;
    if (!window.confirm(`Seçili ${selected.size} kaydı silmek istediğinize emin misiniz? Ödendi durumundaki kayıtlar korunur, sadece geçersiz kayıtlar silinir.`)) return;
    const formData = new FormData();
    selected.forEach((id) => formData.append("ids", id));
    setRemovedIds((prev) => {
      const next = new Set(prev);
      selected.forEach((id) => next.add(id));
      return next;
    });
    setSelected(new Set());
    startTransition(async () => {
      await deleteSelectedDonations(formData);
    });
  }

  const selectedInvalidCount = rows.filter((row) => selected.has(row.id) && !row.isPaid).length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <p className="text-sm font-bold text-slate-500">Telefon numarası listede ve XLSX aktarımında yer alır.</p>
        <div className="relative flex flex-wrap gap-2">
          <button type="submit" className="rounded-xl bg-hayat-green px-5 py-2.5 text-sm font-black text-white">
            Seçilenleri XLSX&apos;e Aktar
          </button>
          <Link href={exportAllHref} className="rounded-xl bg-hayat-blue px-5 py-2.5 text-sm font-black text-white">
            Tümünü XLSX&apos;e Aktar
          </Link>
          <button
            type="button"
            onClick={() => setColumnsOpen((open) => !open)}
            className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-black text-slate-600"
          >
            Sütunlar
          </button>
          <button
            type="button"
            disabled={!selectedInvalidCount || isPending}
            onClick={handleDeleteSelected}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Seçilenleri Sil {selectedInvalidCount ? `(${selectedInvalidCount})` : ""}
          </button>

          {columnsOpen && (
            <div className="absolute right-0 top-full z-10 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Görünür sütunlar ve genişlik</p>
              <div className="space-y-2">
                {COLUMN_DEFS.map((col) => (
                  <div key={col.key} className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-hayat-green"
                        checked={visible[col.key]}
                        onChange={(e) => setVisible((prev) => ({ ...prev, [col.key]: e.target.checked }))}
                      />
                      {col.label}
                    </label>
                    <select
                      value={widths[col.key]}
                      disabled={!visible[col.key]}
                      onChange={(e) => setWidths((prev) => ({ ...prev, [col.key]: e.target.value as WidthKey }))}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600 disabled:opacity-40"
                    >
                      <option value="dar">Dar</option>
                      <option value="orta">Orta</option>
                      <option value="genis">Geniş</option>
                    </select>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setColumnsOpen(false)}
                className="mt-4 h-9 w-full rounded-xl bg-hayat-dark text-xs font-black text-white"
              >
                Kapat
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-hayat-dark text-white">
            <tr>
              <th className="whitespace-nowrap p-4">Seç</th>
              {COLUMN_DEFS.filter((col) => visible[col.key]).map((col) => (
                <th key={col.key} className="whitespace-nowrap p-4" style={{ minWidth: WIDTH_PX[widths[col.key]] }}>
                  {col.label}
                </th>
              ))}
              <th className="whitespace-nowrap p-4">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((donation) => (
              <tr key={donation.id} className="border-b align-middle">
                <td className="whitespace-nowrap p-4">
                  <input
                    name="ids"
                    value={donation.id}
                    type="checkbox"
                    checked={selected.has(donation.id)}
                    onChange={(e) => toggleSelected(donation.id, e.target.checked)}
                    className="h-4 w-4 accent-hayat-green"
                    aria-label={`${donation.fullName} bağışını seç`}
                  />
                </td>
                {visible.date && <td className="whitespace-nowrap p-4">{donation.dateLabel}</td>}
                {visible.receipt && <td className="whitespace-nowrap p-4 font-mono text-xs">{donation.receiptNo}</td>}
                {visible.name && <td className="whitespace-nowrap p-4">{donation.fullName}</td>}
                {visible.phone && <td className="whitespace-nowrap p-4">{donation.phone}</td>}
                {visible.amount && <td className="whitespace-nowrap p-4">{donation.amountLabel}</td>}
                {visible.type && <td className="whitespace-nowrap p-4">{donation.type}</td>}
                {visible.description && <td className="max-w-xs p-4">{donation.description}</td>}
                {visible.status && (
                  <td className="whitespace-nowrap p-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-bold">{donation.statusLabel}</span>
                  </td>
                )}
                {visible.ref && <td className="whitespace-nowrap p-4">{donation.paymentRef}</td>}
                <td className="whitespace-nowrap p-4">
                  <div className="flex items-center gap-2">
                    {donation.isPaid ? (
                      <Link href={`/bagis/makbuz/${donation.id}`} target="_blank" className="inline-flex rounded-full bg-hayat-green px-4 py-2 text-xs font-black text-white">
                        Makbuz Al
                      </Link>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">Ödeme yok</span>
                    )}
                    {!donation.isPaid && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDeleteOne(donation.id, donation.fullName)}
                        className="inline-flex rounded-full bg-red-600 px-4 py-2 text-xs font-black text-white disabled:opacity-40"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={COLUMN_DEFS.length + 2} className="p-8 text-center font-bold text-slate-500">
                  Filtreye uygun bağış kaydı yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
