import Link from "next/link";
import { Prisma } from "@prisma/client";
import { AdminShell } from "../AdminShell";
import { prisma } from "@/lib/prisma";

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
  secret?: string | string[];
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
  PENDING: "Bekliyor",
  FAILED: "Başarısız",
  CANCELLED: "İptal"
};

const statusColors: Record<string, string> = {
  PAID: "#6fb744",
  PENDING: "#f4b740",
  FAILED: "#ef4444",
  CANCELLED: "#64748b"
};

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
  const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const paidDonations = donations.filter((donation) => donation.status === "PAID");
  const paidAmount = paidDonations.reduce((sum, donation) => sum + donation.amount, 0);
  const averageAmount = donations.length ? totalAmount / donations.length : 0;
  const successRate = donations.length ? Math.round((paidDonations.length / donations.length) * 100) : 0;

  const statusItems = Object.entries(
    donations.reduce<Record<string, number>>((acc, donation) => {
      acc[donation.status] = (acc[donation.status] || 0) + 1;
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

  return { totalAmount, paidAmount, averageAmount, successRate, statusItems, typeItems, monthItems };
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[.18em] text-slate-400">{label}</p>
      <b className="mt-3 block text-3xl font-black text-hayat-dark">{value}</b>
      <p className="mt-2 text-sm font-semibold text-slate-500">{hint}</p>
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

function DonationAnalytics({ donations }: { donations: DonationRow[] }) {
  const summary = donationSummary(donations);
  const maxMonthAmount = Math.max(...summary.monthItems.map((item) => item.amount), 1);
  const maxTypeAmount = Math.max(...summary.typeItems.map((item) => item.amount), 1);
  const totalStatusCount = Math.max(summary.statusItems.reduce((sum, item) => sum + item.count, 0), 1);
  let statusOffset = 0;

  return (
    <section className="mt-8 space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Toplam bağış" value={`${currency(summary.totalAmount)} TL`} hint={`${donations.length} kayıt toplamı`} />
        <StatCard label="Ödenen tutar" value={`${currency(summary.paidAmount)} TL`} hint="Ödendi durumundaki bağışlar" />
        <StatCard label="Ortalama bağış" value={`${currency(summary.averageAmount)} TL`} hint="Kayıt başına ortalama" />
        <StatCard label="Başarı oranı" value={`%${summary.successRate}`} hint="Ödenen kayıt / toplam kayıt" />
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
              <b className="text-sm text-hayat-dark">{item.type}</b>
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
  const secret = firstParam(params.secret);

  if (secret !== process.env.ADMIN_SECRET) {
    return (
      <AdminShell activePath="/admin/bagislar" contentClassName="max-w-7xl">
        <section className="rounded-[2rem] bg-white p-10 font-bold text-slate-600 shadow-sm">Yetkisiz erişim.</section>
      </AdminShell>
    );
  }

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
  const exportParams = new URLSearchParams({
    secret,
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
      <h1 className="text-3xl font-black">Bağış Kayıtları</h1>
      <p className="mt-2 text-slate-500">Filtreye uyan son 300 bağış kaydı</p>

      <DonationAnalytics donations={donations} />

      <form className="mt-8 rounded-3xl bg-white p-5 shadow-sm">
        <input type="hidden" name="secret" value={secret} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_180px_180px_150px_150px_130px_130px_auto]">
          <FilterInput label="Arama" name="q" value={filters.query} placeholder="Ad, telefon, makbuz no, ref, açıklama" />
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
          <div className="flex items-end gap-2">
            <button className="h-11 rounded-xl bg-hayat-blue px-5 text-sm font-black text-white">Filtrele</button>
            <Link href={`/admin/bagislar?secret=${encodeURIComponent(secret)}`} className="grid h-11 place-items-center rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-600">
              Temizle
            </Link>
          </div>
        </div>
      </form>

      <form action="/admin/bagislar/export" method="get" className="mt-8 rounded-3xl bg-white shadow-sm">
        <input type="hidden" name="secret" value={secret} />
        <input type="hidden" name="scope" value="selected" />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <p className="text-sm font-bold text-slate-500">Telefon numarası listede ve XLSX aktarımında yer alır.</p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded-xl bg-hayat-green px-5 py-2.5 text-sm font-black text-white">
              Seçilenleri XLSX&apos;e Aktar
            </button>
            <Link href={`/admin/bagislar/export?${exportParams.toString()}`} className="rounded-xl bg-hayat-blue px-5 py-2.5 text-sm font-black text-white">
              Tümünü XLSX&apos;e Aktar
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-hayat-dark text-white">
              <tr>
                <th className="p-4">Seç</th>
                <th>Tarih</th>
                <th>Makbuz No</th>
                <th>Ad Soyad</th>
                <th>Telefon</th>
                <th>Tutar</th>
                <th>Tür</th>
                <th>Açıklama</th>
                <th>Durum</th>
                <th>Ref</th>
                <th>Makbuz</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation) => (
                <tr key={donation.id} className="border-b">
                  <td className="p-4">
                    <input name="ids" value={donation.id} type="checkbox" className="h-4 w-4 accent-hayat-green" aria-label={`${donation.fullName} bağışını seç`} />
                  </td>
                  <td>{donation.createdAt.toLocaleString("tr-TR")}</td>
                  <td className="font-mono text-xs">{donation.status === "PAID" ? donation.receiptNo || "-" : "-"}</td>
                  <td>{donation.fullName}</td>
                  <td>{donation.phone || "-"}</td>
                  <td>{currency(donation.amount)} TL</td>
                  <td>{donation.type}</td>
                  <td>{donation.description}</td>
                  <td><span className="rounded-full bg-slate-100 px-3 py-1 font-bold">{statusLabel(donation.status)}</span></td>
                  <td>{donation.paymentRef}</td>
                  <td>
                    {donation.status === "PAID" ? (
                      <Link href={`/bagis/makbuz/${donation.id}`} target="_blank" className="inline-flex rounded-full bg-hayat-green px-4 py-2 text-xs font-black text-white">
                        Makbuz Al
                      </Link>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">Ödeme yok</span>
                    )}
                  </td>
                </tr>
              ))}
              {!donations.length && (
                <tr>
                  <td colSpan={11} className="p-8 text-center font-bold text-slate-500">Filtreye uygun bağış kaydı yok.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </form>
    </AdminShell>
  );
}
