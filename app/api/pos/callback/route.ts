import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const paymentRef = body.paymentRef as string | undefined;
  const status = body.status === "PAID" ? "PAID" : "FAILED";
  if (!paymentRef) return NextResponse.json({ error: "paymentRef gerekli" }, { status: 400 });
  await prisma.donation.update({ where: { paymentRef }, data: { status } });
  return NextResponse.json({ ok: true });
}
