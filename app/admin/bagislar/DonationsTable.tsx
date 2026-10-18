"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

export type DonationStatusKey = "PAID" | "PENDING" | "STALE" | "FAILED" | "CANCELLED" | "OTHER";

export type ClientDonation = {
  id: string;
  dateLabel: string;
  timeLabel: string;
  receiptNo: string;
  fullName: string;
  phone: string;
  amountLabel: string;
  type: string;
  typeLabel: string;
  description: string;
  status: string;
  statusKey: DonationStatusKey;
  statusLabel: string;
  paymentRef: string;
  isPaid: boolean;
};

type ColumnKey = "date" | "donor" | "amount" | "type" | "status" | "receipt" | "description" | "action";

const COLUMN_DEFS: { key: ColumnKey; label: string; toggleable: boolean }[] = [
  { key: "date", label: "Tarih", toggleable: true },
  { key: "donor", label: "Bağışçı", toggleable: true },
  { key: "amount", label: "Tutar", toggleable: true },
  { key: "type", label: "Tür", toggleable: true },
  { key: "status", label: "Durum", toggleable: true },
  { key: "receipt", label: "Makbuz / Banka Ref.", toggleable: true },
  { key: "description", label: "Açıklama", toggleable: true },
  { key: "action", label: "İşlem", toggleable: false }
];

const MIN_WIDTH = 70;
// Varsayilan genislikler admin icerik alanina (~1050px) yatay kaydirmadan sigar.
const DEFAULT_WIDTHS: Record<ColumnKey, number> = {
  date: 100,
  donor: 170,
  amount: 100,
  type: 100,
  status: 128,
  receipt: 140,
  description: 128,
  action: 92
};
const SELECT_COLUMN_WIDTH = 44;

const STATUS_STYLES: Record<DonationStatusKey, string> = {
  PAID: "bg-green-50 text-green-700 ring-green-600/20",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  STALE: "bg-orange-50 text-orange-700 ring-orange-600/25",
  FAILED: "bg-red-50 text-red-700 ring-red-600/20",
  CANCELLED: "bg-slate-100 text-slate-600 ring-slate-500/20",
  OTHER: "bg-slate-100 text-slate-600 ring-slate-500/20"
};

const STATUS_HINTS: Partial<Record<DonationStatusKey, string>> = {
  PENDING: "Bağışçı banka sayfasında; ödeme henüz sonuçlanmadı.",
  STALE: "Bağışçı banka sayfasında işlemi tamamlamadı (30 dakikadan uzun süredir bankadan dönüş yok). Ödeme alınmadı.",
  FAILED: "Banka ödemeyi onaylamadı veya işlem iptal edildi."
};

const STORAGE_KEY = "hayatder-bagislar-sutunlar-v3";

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
        className={`absolute right-0 top-0 h-full w-2 cursor-col-resize select-none ${resizingKey === columnKey ? "bg-hayat-blue/40" : "hover:bg-slate-300/60"}`}
        aria-hidden
      />
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-black text-hayat-dark">Bağış kayıtları <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-500">{rows.length}</span></h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">Sütun genişliğini başlığın sağ kenarından sürükleyerek değiştirebilirsiniz.</p>
        </div>
        <div className="relative flex flex-wrap gap-2">
          <button type="submit" disabled={!selected.size} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-hayat-dark transition hover:border-hayat-dark disabled:cursor-not-allowed disabled:opacity-40">
            Seçilenleri Excel&apos;e Aktar {selected.size ? `(${selected.size})` : ""}
          </button>
          <Link href={exportAllHref} className="inline-flex h-10 items-center rounded-xl bg-hayat-dark px-4 text-sm font-black text-white transition hover:bg-[#3f7d17]">
            Tümünü Excel&apos;e Aktar
          </Link>
          <button
            type="button"
            onClick={() => setColumnsOpen((open) => !open)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition hover:border-hayat-dark"
          >
            Sütunlar
          </button>
          <button
            type="button"
            disabled={!selectedInvalidCount || isPending}
            onClick={handleDeleteSelected}
            className="h-10 rounded-xl bg-red-600 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-30"
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
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="px-3 py-3" style={{ width: SELECT_COLUMN_WIDTH }}>
                <span className="sr-only">Seç</span>
              </th>
              {visibleColumns.map((col) => (
                <th key={col.key} className={`relative overflow-hidden text-ellipsis whitespace-nowrap px-3 py-3 ${col.key === "amount" ? "text-right" : ""}`} style={{ width: widths[col.key] }}>
                  {col.label}
                  <ResizeHandle columnKey={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((donation) => (
              <tr key={donation.id} className={`align-middle transition-colors hover:bg-slate-50 ${selected.has(donation.id) ? "bg-blue-50/60" : ""}`}>
                <td className="px-3 py-3" style={{ width: SELECT_COLUMN_WIDTH }}>
                  <input
                    name="ids"
                    value={donation.id}
                    type="checkbox"
                    checked={selected.has(donation.id)}
                    onChange={(e) => toggleSelected(donation.id, e.target.checked)}
                    className="h-4 w-4 accent-hayat-dark"
                    aria-label={`${donation.fullName} bağışını seç`}
                  />
                </td>
                {visible.date && (
                  <td className="px-3 py-3" style={{ width: widths.date }}>
                    <span className="block font-bold text-hayat-dark">{donation.dateLabel}</span>
                    <span className="block text-xs font-semibold text-slate-400">{donation.timeLabel}</span>
                  </td>
                )}
                {visible.donor && (
                  <td className="px-3 py-3" style={{ width: widths.donor }}>
                    <span className="block truncate font-bold text-hayat-dark" title={donation.fullName}>{donation.fullName}</span>
                    {donation.phone !== "-" ? (
                      <a href={`tel:${donation.phone}`} className="block text-xs font-semibold text-slate-500 hover:text-hayat-blue">{donation.phone}</a>
                    ) : (
                      <span className="block text-xs font-semibold text-slate-400">Telefon yok</span>
                    )}
                  </td>
                )}
                {visible.amount && (
                  <td className="px-3 py-3 text-right font-black tabular-nums text-hayat-dark" style={{ width: widths.amount }}>
                    {donation.amountLabel}
                  </td>
                )}
                {visible.type && (
                  <td className="px-3 py-3" style={{ width: widths.type }}>
                    <span className="inline-block max-w-full truncate rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700" title={donation.typeLabel}>{donation.typeLabel}</span>
                  </td>
                )}
                {visible.status && (
                  <td className="px-3 py-3" style={{ width: widths.status }}>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ring-1 ring-inset ${STATUS_STYLES[donation.statusKey]}`} title={STATUS_HINTS[donation.statusKey]}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                      {donation.statusLabel}
                    </span>
                  </td>
                )}
                {visible.receipt && (
                  <td className="px-3 py-3" style={{ width: widths.receipt }}>
                    <span className={`block truncate text-xs ${donation.isPaid ? "font-mono font-bold text-hayat-dark" : "font-semibold text-slate-400"}`}>{donation.receiptNo}</span>
                    <span className="block truncate font-mono text-[11px] text-slate-400" title={donation.paymentRef}>{donation.paymentRef || "—"}</span>
                  </td>
                )}
                {visible.description && (
                  <td className="px-3 py-3" style={{ width: widths.description }}>
                    <span className="line-clamp-2 text-xs font-semibold text-slate-600" title={donation.description}>{donation.description || "—"}</span>
                  </td>
                )}
                {visible.action && (
                  <td className="px-3 py-3" style={{ width: widths.action }}>
                    {donation.isPaid ? (
                      <Link href={`/bagis/makbuz/${donation.id}`} target="_blank" className="inline-flex h-8 items-center rounded-lg bg-hayat-dark px-3 text-xs font-black text-white transition hover:bg-[#3f7d17]">
                        Makbuz
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDeleteOne(donation.id, donation.fullName)}
                        className="inline-flex h-8 items-center rounded-lg border border-red-200 px-3 text-xs font-black text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                      >
                        Sil
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-10 text-center font-bold text-slate-500">
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
