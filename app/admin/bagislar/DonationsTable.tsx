"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

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

type ColumnKey = "date" | "receipt" | "name" | "phone" | "amount" | "type" | "description" | "status" | "ref" | "action";

const COLUMN_DEFS: { key: ColumnKey; label: string; toggleable: boolean }[] = [
  { key: "date", label: "Tarih", toggleable: true },
  { key: "receipt", label: "Makbuz No", toggleable: true },
  { key: "name", label: "Ad Soyad", toggleable: true },
  { key: "phone", label: "Telefon", toggleable: true },
  { key: "amount", label: "Tutar", toggleable: true },
  { key: "type", label: "Tür", toggleable: true },
  { key: "description", label: "Açıklama", toggleable: true },
  { key: "status", label: "Durum", toggleable: true },
  { key: "ref", label: "Ref", toggleable: true },
  { key: "action", label: "İşlem", toggleable: false }
];

const MIN_WIDTH = 70;
const DEFAULT_WIDTHS: Record<ColumnKey, number> = {
  date: 150,
  receipt: 150,
  name: 160,
  phone: 150,
  amount: 100,
  type: 100,
  description: 240,
  status: 100,
  ref: 150,
  action: 170
};
const SELECT_COLUMN_WIDTH = 56;

const STORAGE_KEY = "hayatder-bagislar-sutunlar-v2";

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
  const [widths, setWidths] = useState<Record<ColumnKey, number>>(DEFAULT_WIDTHS);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [resizingKey, setResizingKey] = useState<ColumnKey | null>(null);
  const resizeState = useRef<{ key: ColumnKey; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { visible?: Partial<Record<ColumnKey, boolean>>; widths?: Partial<Record<ColumnKey, number>> };
      if (saved.visible) setVisible((prev) => ({ ...prev, ...saved.visible }));
      if (saved.widths) {
        setWidths((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(saved.widths || {}) as ColumnKey[]) {
            const value = saved.widths?.[key];
            if (typeof value === "number" && Number.isFinite(value)) next[key] = Math.max(MIN_WIDTH, value);
          }
          return next;
        });
      }
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

  const stopResizing = useCallback(() => {
    resizeState.current = null;
    setResizingKey(null);
  }, []);

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const state = resizeState.current;
      if (!state) return;
      const delta = e.clientX - state.startX;
      const nextWidth = Math.max(MIN_WIDTH, Math.round(state.startWidth + delta));
      setWidths((prev) => (prev[state.key] === nextWidth ? prev : { ...prev, [state.key]: nextWidth }));
    }
    function handleUp() {
      stopResizing();
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [stopResizing]);

  function startResize(key: ColumnKey, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    resizeState.current = { key, startX: e.clientX, startWidth: widths[key] };
    setResizingKey(key);
  }

  function resetWidths() {
    setWidths(DEFAULT_WIDTHS);
  }

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
  const visibleColumns = COLUMN_DEFS.filter((col) => visible[col.key]);

  function ResizeHandle({ columnKey }: { columnKey: ColumnKey }) {
    return (
      <div
        onMouseDown={(e) => startResize(columnKey, e)}
        className={`absolute right-0 top-0 h-full w-2 cursor-col-resize select-none ${resizingKey === columnKey ? "bg-hayat-gold/70" : "hover:bg-white/30"}`}
        aria-hidden
      />
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <p className="text-sm font-bold text-slate-500">Başlıkların sağ kenarını sürükleyerek genişliği ayarlayabilirsiniz, tercihiniz kaydedilir.</p>
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
            <div className="absolute right-0 top-full z-10 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Görünür sütunlar</p>
              <div className="space-y-2">
                {COLUMN_DEFS.filter((col) => col.toggleable).map((col) => (
                  <label key={col.key} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-hayat-green"
                      checked={visible[col.key]}
                      onChange={(e) => setVisible((prev) => ({ ...prev, [col.key]: e.target.checked }))}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={resetWidths}
                  className="h-9 flex-1 rounded-xl bg-slate-100 text-xs font-black text-slate-600"
                >
                  Genişlikleri Sıfırla
                </button>
                <button
                  type="button"
                  onClick={() => setColumnsOpen(false)}
                  className="h-9 flex-1 rounded-xl bg-hayat-dark text-xs font-black text-white"
                >
                  Kapat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-left text-sm" style={{ tableLayout: "fixed", width: "max-content", minWidth: "100%" }}>
          <thead className="bg-hayat-dark text-white">
            <tr>
              <th className="p-4" style={{ width: SELECT_COLUMN_WIDTH }}>
                Seç
              </th>
              {visibleColumns.map((col) => (
                <th key={col.key} className="relative overflow-hidden text-ellipsis whitespace-nowrap p-4" style={{ width: widths[col.key] }}>
                  {col.label}
                  <ResizeHandle columnKey={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((donation) => (
              <tr key={donation.id} className="border-b align-middle">
                <td className="p-4" style={{ width: SELECT_COLUMN_WIDTH }}>
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
                {visible.date && (
                  <td className="overflow-hidden text-ellipsis whitespace-nowrap p-4" style={{ width: widths.date }}>
                    {donation.dateLabel}
                  </td>
                )}
                {visible.receipt && (
                  <td className="overflow-hidden text-ellipsis whitespace-nowrap p-4 font-mono text-xs" style={{ width: widths.receipt }}>
                    {donation.receiptNo}
                  </td>
                )}
                {visible.name && (
                  <td className="overflow-hidden text-ellipsis whitespace-nowrap p-4" style={{ width: widths.name }}>
                    {donation.fullName}
                  </td>
                )}
                {visible.phone && (
                  <td className="overflow-hidden text-ellipsis whitespace-nowrap p-4" style={{ width: widths.phone }}>
                    {donation.phone}
                  </td>
                )}
                {visible.amount && (
                  <td className="overflow-hidden text-ellipsis whitespace-nowrap p-4" style={{ width: widths.amount }}>
                    {donation.amountLabel}
                  </td>
                )}
                {visible.type && (
                  <td className="overflow-hidden text-ellipsis whitespace-nowrap p-4" style={{ width: widths.type }}>
                    {donation.type}
                  </td>
                )}
                {visible.description && (
                  <td className="whitespace-normal break-words p-4 align-top" style={{ width: widths.description }}>
                    {donation.description}
                  </td>
                )}
                {visible.status && (
                  <td className="overflow-hidden text-ellipsis whitespace-nowrap p-4" style={{ width: widths.status }}>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-bold">{donation.statusLabel}</span>
                  </td>
                )}
                {visible.ref && (
                  <td className="overflow-hidden text-ellipsis whitespace-nowrap p-4" style={{ width: widths.ref }}>
                    {donation.paymentRef}
                  </td>
                )}
                {visible.action && (
                  <td className="overflow-hidden p-4" style={{ width: widths.action }}>
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
                )}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-8 text-center font-bold text-slate-500">
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
