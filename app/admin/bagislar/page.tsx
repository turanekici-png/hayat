import Link from "next/link";
import { Prisma } from "@prisma/client";
import { AdminShell } from "../AdminShell";
import { prisma } from "@/lib/prisma";
import { deleteDonation, deleteSelectedDonations } from "../actions";
import { DonationsTable, type ClientDonation, type DonationStatusKey } from "./DonationsTable";
import { AlertTriangle, CheckCircle2, PiggyBank, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DonationFilters = {
  query: string;
  status: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
};

type AdminDonationSearchParams = Promise<{
  q?: string | string[];
  status?: string | string[];
  type?: string | string[];
  dateFrom?: string | string[];
  dateTo?: string | string[];
  minAmount?: string | string[];
  maxAmount?: string | string[];
}>;

const statusLabels: Record<string, string> = {
  PAID: "Ödendi",
  PENDING: "Ödeme Bekleniyor",
  STALE: "Yarım Kaldı",
  FAILED: "Başarısız",
  CANCELLED: "İptal"
};

const statusColors: Record<string, string> = {
  PAID: "#3f7d17",
  PENDING: "#f4b740",
  STALE: "#ea580c",
  FAILED: "#dc2626",
  CANCELLED: "#64748b"
};

// Bu sureden uzun suredir bankadan donus gelmeyen odeme "Yarim Kaldi" sayilir
// (bagisci banka sayfasini kapatmis/geri donmus). Sadece gorunumde hesaplanir.
const STALE_PENDING_MS = 30 * 60 * 1000;

function displayStatusKey(status: string, createdAt: Date, now = Date.now()): DonationStatusKey {
  if (status === "PENDING") return now - createdAt.getTime() > STALE_PENDING_MS ? "STALE" : "PENDING";
  if (status === "PAID" || status === "FAILED" || status === "CANCELLED") return status;
  return "OTHER";
}

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function currency(value: number) {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value);
}

function statusLabel(status: string) {
  return statusLabels[status] || status;
}

function statusColor(status: string) {
  return statusColors[status] || "#2563eb";
}

function validDate(value: string, endOfDay = false) {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildDonationWhere(filters: DonationFilters): Prisma.DonationWhereInput {
  const where: Prisma.DonationWhereInput = {};
  const query = filters.query.trim();

  if (query) {
    where.OR = [
      { fullName: { contains: query, mode: "insensitive" } },
      { phone: { contains: query, mode: "insensitive" } },
      { receiptNo: { contains: query, mode: "insensitive" } },
      { paymentRef: { contains: query, mode: "insensitive" } },
      { type: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } }
    ];
  }

  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;

  const from = validDate(filters.dateFrom);
  const to = validDate(filters.dateTo, true);
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {})
    };
  }

  const minAmount = Number(filters.minAmount);
  const maxAmount = Number(filters.maxAmount);
  if ((Number.isFinite(minAmount) && filters.minAmount) || (Number.isFinite(maxAmount) && filters.maxAmount)) {
    where.amount = {
      ...(Number.isFinite(minAmount) && filters.minAmount ? { gte: minAmount } : {}),
      ...(Number.isFinite(maxAmount) && filters.maxAmount ? { lte: maxAmount } : {})
    };
  }

  return where;
}

async function getDonations(filters: DonationFilters) {
  return prisma.donation.findMany({
    where: buildDonationWhere(filters),
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true,
      receiptNo: true,
      createdAt: true,
      fullName: true,
      phone: true,
      amount: true,
      type: true,
      description: true,
      status: true,
      paymentRef: true
    }
  });
}

type DonationRow = Awaited<ReturnType<typeof getDonations>>[number];

function donationSummary(donations: DonationRow[]) {
  const now = Date.now();
  const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const paidDonations = donations.filter((donation) => donation.status === "PAID");
  const paidAmount = paidDonations.reduce((sum, donation) => sum + donation.amount, 0);
  const averageAmount = paidDonations.length ? paidAmount / paidDonations.length : 0;
  const successRate = donations.length ? Math.round((paidDonations.length / donations.length) * 100) : 0;
  const incomplete = donations.filter((donation) => {
    const key = displayStatusKey(donation.status, donation.createdAt, now);
    return key === "STALE" || key === "FAILED" || key === "CANCELLED";
  });
  const incompleteAmount = incomplete.reduce((sum, donation) => sum + donation.amount, 0);

  const statusItems = Object.entries(
    donations.reduce<Record<string, number>>((acc, donation) => {
      const key = displayStatusKey(donation.status, donation.createdAt, now);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));

  const typeItems = Object.entries(
    donations.reduce<Record<string, number>>((acc, donation) => {
      acc[donation.type] = (acc[donation.type] || 0) + donation.amount;
      return acc;
    }, {})
  )
    .map(([type, amount]) => ({ type, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const monthFormatter = new Intl.DateTimeFormat("tr-TR", { month: "short" });
  const monthItems = Object.entries(
    donations.reduce<Record<string, { label: string; amount: number; count: number }>>((acc, donation) => {
      const key = `${donation.createdAt.getFullYear()}-${String(donation.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[key]) acc[key] = { label: monthFormatter.format(donation.createdAt), amount: 0, count: 0 };
      acc[key].amount += donation.amount;
      acc[key].count += 1;
      return acc;
    }, {})
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([, value]) => value);

  return { totalAmount, paidAmount, paidCount: paidDonations.length, averageAmount, successRate, incompleteCount: incomplete.length, incompleteAmount, statusItems, typeItems, monthItems };
}

function StatCard({ label, value, hint, icon: Icon, tone }: { label: string; value: string; hint: string; icon: typeof PiggyBank; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[.14em] text-slate-500">{label}</p>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={18} /></span>
      </div>
      <b className="mt-2 block text-[28px] font-black tabular-nums text-hayat-dark">{value}</b>
      <p className="mt-1 text-sm font-semibold text-slate-500">{hint}</p>
    </div>
  );
}

function FilterInput({ label, name, value, type = "text", placeholder }: { label: string; name: string; value: string; type?: string; placeholder?: string }) {
  return (
    <label className="text-xs font-black uppercase text-slate-500">
      {label}
      <input
        name={name}
        defaultValue={value}
        type={type}
        placeholder={placeholder}
        className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold normal-case text-hayat-dark outline-hayat-blue"
      />
    </label>
  );
}

function DonationAnalytics({ donations, typeLabels }: { donations: DonationRow[]; typeLabels: Map<string, string> }) {
  const summary = donationSummary(donations);
  const maxMonthAmount = Math.max(...summary.monthItems.map((item) => item.amount), 1);
  const maxTypeAmount = Math.max(...summary.typeItems.map((item) => item.amount), 1);
  const totalStatusCount = Math.max(summary.statusItems.reduce((sum, item) => sum + item.count, 0), 1);
  let statusOffset = 0;

  return (
    <section className="mt-8 space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={PiggyBank} tone="bg-green-50 text-green-700" label="Tahsil edilen" value={`${currency(summary.paidAmount)} TL`} hint={`${summary.paidCount} başarılı bağış`} />
        <StatCard icon={TrendingUp} tone="bg-blue-50 text-blue-700" label="Ortalama bağış" value={`${currency(summary.averageAmount)} TL`} hint="Başarılı bağış başına" />
        <StatCard icon={AlertTriangle} tone="bg-orange-50 text-orange-700" label="Tamamlanmayan" value={`${summary.incompleteCount}`} hint={`${currency(summary.incompleteAmount)} TL · yarım kalan / başarısız`} />
        <StatCard icon={CheckCircle2} tone="bg-slate-100 text-slate-700" label="Başarı oranı" value={`%${summary.successRate}`} hint="Başarılı / toplam kayıt" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-hayat-dark">Durum dağılımı</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Filtrelenen bağış kayıtlarının ödeme durumları</p>

          <div className="mt-6 grid items-center gap-6 sm:grid-cols-[180px_1fr]">
            <svg viewBox="0 0 42 42" className="mx-auto h-44 w-44 -rotate-90" aria-label="Durum dağılımı grafiği">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#edf2f7" strokeWidth="7" />
              {summary.statusItems.map((item) => {
                const percent = (item.count / totalStatusCount) * 100;
                const circle = (
                  <circle
                    key={item.status}
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke={statusColor(item.status)}
                    strokeDasharray={`${percent} ${100 - percent}`}
                    strokeDashoffset={-statusOffset}
                    strokeWidth="7"
                  />
                );
                statusOffset += percent;
                return circle;
              })}
            </svg>

            <div className="space-y-3">
              {summary.statusItems.length ? summary.statusItems.map((item) => (
                <div key={item.status} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                  <span className="flex items-center gap-2 text-sm font-black text-slate-700">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: statusColor(item.status) }} />
                    {statusLabel(item.status)}
                  </span>
                  <b className="text-hayat-dark">{item.count}</b>
                </div>
              )) : (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">Filtreye uygun bağış kaydı yok.</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-hayat-dark">Aylık bağış hacmi</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Filtrelenen kayıtların aylık tutar hareketi</p>
          <div className="mt-6 flex h-64 items-end gap-3 rounded-2xl bg-slate-50 p-4">
            {summary.monthItems.length ? summary.monthItems.map((item) => (
              <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
                <div className="flex min-h-10 items-end justify-center rounded-t-xl bg-hayat-green" style={{ height: `${Math.max((item.amount / maxMonthAmount) * 100, 8)}%` }}>
                  <span className="mb-2 text-[10px] font-black text-white">{item.count}</span>
                </div>
                <div className="text-center">
                  <p className="truncate text-xs font-black text-hayat-dark">{item.label}</p>
                  <p className="truncate text-[10px] font-bold text-slate-500">{currency(item.amount)} TL</p>
                </div>
              </div>
            )) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-500">Grafik oluşturacak kayıt yok.</div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-hayat-dark">Bağış türlerine göre tutar</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">Filtrelenen kayıtların bağış türü dağılımı</p>
        <div className="mt-6 space-y-3">
          {summary.typeItems.length ? summary.typeItems.map((item) => (
            <div key={item.type} className="grid gap-2 md:grid-cols-[180px_1fr_120px] md:items-center">
              <b className="text-sm text-hayat-dark">{typeLabels.get(item.type) || item.type}</b>
              <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-hayat-blue" style={{ width: `${Math.max((item.amount / maxTypeAmount) * 100, 4)}%` }} />
              </div>
              <span className="text-sm font-black text-slate-600 md:text-right">{currency(item.amount)} TL</span>
            </div>
          )) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">Bağış türü analizi için kayıt yok.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function AdminDonations({ searchParams }: { searchParams: AdminDonationSearchParams }) {
  const params = await searchParams;

  const filters: DonationFilters = {
    query: firstParam(params.q).trim(),
    status: firstParam(params.status).trim(),
    type: firstParam(params.type).trim(),
    dateFrom: firstParam(params.dateFrom).trim(),
    dateTo: firstParam(params.dateTo).trim(),
    minAmount: firstParam(params.minAmount).trim(),
    maxAmount: firstParam(params.maxAmount).trim()
  };

  const [donations, donationTypes, statusGroups] = await Promise.all([
    getDonations(filters),
    prisma.donationType.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }], select: { code: true, label: true } }),
    prisma.donation.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } })
  ]);
  const typeLabels = new Map(donationTypes.map((type) => [type.code, type.label]));
  const now = Date.now();
  const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Istanbul" });
  const timeFormatter = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
  const clientDonations: ClientDonation[] = donations.map((donation) => {
    const statusKey = displayStatusKey(donation.status, donation.createdAt, now);
    return {
      id: donation.id,
      dateLabel: dateFormatter.format(donation.createdAt),
      timeLabel: timeFormatter.format(donation.createdAt),
      receiptNo: donation.status === "PAID" ? donation.receiptNo || "-" : "Makbuz yok",
      fullName: donation.fullName,
      phone: donation.phone || "-",
      amountLabel: `${currency(donation.amount)} TL`,
      type: donation.type,
      typeLabel: typeLabels.get(donation.type) || donation.type,
      description: donation.description || "",
      status: donation.status,
      statusKey,
      statusLabel: statusLabel(statusKey),
      paymentRef: donation.paymentRef || "",
      isPaid: donation.status === "PAID"
    };
  });

  const exportParams = new URLSearchParams({
    scope: "all",
    q: filters.query,
    status: filters.status,
    type: filters.type,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    minAmount: filters.minAmount,
    maxAmount: filters.maxAmount
  });

  return (
    <AdminShell activePath="/admin/bagislar" contentClassName="max-w-7xl">
      <div className="rounded-2xl bg-hayat-dark p-6 text-white shadow-soft">
        <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[#a9d47a]"><PiggyBank size={17} /> Bağış Listesi</p>
        <h1 className="mt-2 text-3xl font-black">Bağış kayıtları</h1>
        <p className="mt-1 text-white/75">Filtreye uyan son 300 kayıt. <strong className="text-white">Yarım Kaldı</strong>: bağışçı banka sayfasında ödemeyi tamamlamadı, tahsilat yapılmadı.</p>
      </div>

      <DonationAnalytics donations={donations} typeLabels={typeLabels} />

      <form className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-[minmax(0,1.6fr)_repeat(6,minmax(0,1fr))_auto]">
          <div className="sm:col-span-2 lg:col-span-2 2xl:col-span-1"><FilterInput label="Arama" name="q" value={filters.query} placeholder="Ad, telefon, makbuz no, ref, açıklama" /></div>
          <label className="text-xs font-black uppercase text-slate-500">
            Durum
            <select name="status" defaultValue={filters.status} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold normal-case text-hayat-dark outline-hayat-blue">
              <option value="">Tümü</option>
              {statusGroups.map((group) => (
                <option key={group.status} value={group.status}>{statusLabel(group.status)} ({group._count._all})</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-black uppercase text-slate-500">
            Bağış Türü
            <select name="type" defaultValue={filters.type} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold normal-case text-hayat-dark outline-hayat-blue">
              <option value="">Tümü</option>
              {donationTypes.map((type) => (
                <option key={type.code} value={type.code}>{type.label}</option>
              ))}
            </select>
          </label>
          <FilterInput label="Başlangıç" name="dateFrom" value={filters.dateFrom} type="date" />
          <FilterInput label="Bitiş" name="dateTo" value={filters.dateTo} type="date" />
          <FilterInput label="Min Tutar" name="minAmount" value={filters.minAmount} type="number" />
          <FilterInput label="Max Tutar" name="maxAmount" value={filters.maxAmount} type="number" />
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
            <button className="h-11 rounded-xl bg-hayat-dark px-5 text-sm font-black text-white transition hover:bg-[#3f7d17]">Filtrele</button>
            <Link href="/admin/bagislar" className="grid h-11 place-items-center rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-600">
              Temizle
            </Link>
          </div>
        </div>
      </form>

      <form action="/admin/bagislar/export" method="get" className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <input type="hidden" name="scope" value="selected" />
        <DonationsTable
          donations={clientDonations}
          exportAllHref={`/admin/bagislar/export?${exportParams.toString()}`}
          deleteDonation={deleteDonation}
          deleteSelectedDonations={deleteSelectedDonations}
        />
      </form>
    </AdminShell>
  );
}
