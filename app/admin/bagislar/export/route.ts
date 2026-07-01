import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createXlsx } from "@/lib/xlsx";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DonationExportFilters = {
  query: string;
  status: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
};

function validDate(value: string, endOfDay = false) {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildDonationWhere(filters: DonationExportFilters): Prisma.DonationWhereInput {
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

function value(params: URLSearchParams, key: string) {
  return params.get(key)?.trim() || "";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PAID: "Ödendi",
    PENDING: "Bekliyor",
    FAILED: "Başarısız",
    CANCELLED: "İptal"
  };
  return labels[status] || status;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scope = value(url.searchParams, "scope") || "all";

  const selectedIds = url.searchParams.getAll("ids").map((id) => id.trim()).filter(Boolean);
  if (scope === "selected" && !selectedIds.length) {
    return NextResponse.json({ error: "XLSX aktarımı için en az bir bağış seçin." }, { status: 400 });
  }
  const filters: DonationExportFilters = {
    query: value(url.searchParams, "q"),
    status: value(url.searchParams, "status"),
    type: value(url.searchParams, "type"),
    dateFrom: value(url.searchParams, "dateFrom"),
    dateTo: value(url.searchParams, "dateTo"),
    minAmount: value(url.searchParams, "minAmount"),
    maxAmount: value(url.searchParams, "maxAmount")
  };

  const donations = await prisma.donation.findMany({
    where: selectedIds.length ? { id: { in: selectedIds } } : buildDonationWhere(filters),
    orderBy: { createdAt: "desc" },
    select: {
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

  const rows = [
    ["Tarih", "Makbuz No", "Bağışçı", "Telefon", "Tutar", "Bağış Türü", "Açıklama", "Durum", "Ödeme Referansı"],
    ...donations.map((donation) => [
      donation.createdAt,
      donation.status === "PAID" ? donation.receiptNo || "" : "",
      donation.fullName,
      donation.phone || "",
      donation.amount,
      donation.type,
      donation.description || "",
      statusLabel(donation.status),
      donation.paymentRef || ""
    ])
  ];
  const file = createXlsx(rows);
  const today = new Date().toISOString().slice(0, 10);
  const fileScope = selectedIds.length ? "secilen" : "tum";

  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bagis-listesi-${fileScope}-${today}.xlsx"`,
      "Cache-Control": "no-store"
    }
  });
}
