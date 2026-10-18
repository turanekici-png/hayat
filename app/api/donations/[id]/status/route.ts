import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Bagiscinin kendi tarayicisinda sakladigi bagis kimligi icin sadece odeme
 * durumunu dondurur (kisisel bilgi donmez). Yarim kalan odeme uyarisi bunu kullanir.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || id.length > 40) return NextResponse.json({ status: "UNKNOWN" }, { status: 400 });

  const donation = await prisma.donation.findUnique({
    where: { id },
    select: { status: true, amount: true, createdAt: true }
  }).catch(() => null);

  if (!donation) return NextResponse.json({ status: "UNKNOWN" }, { status: 404 });

  return NextResponse.json(
    { status: donation.status, amount: donation.amount, createdAt: donation.createdAt },
    { headers: { "Cache-Control": "no-store" } }
  );
}
