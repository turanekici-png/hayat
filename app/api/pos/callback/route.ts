import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentRequestIp, writePaymentLog } from "@/lib/payment-log";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const paymentRef = body.paymentRef as string | undefined;
  const status = body.status === "PAID" ? "PAID" : "FAILED";
  if (!paymentRef) return NextResponse.json({ error: "paymentRef gerekli" }, { status: 400 });
  const donation = await prisma.donation.update({ where: { paymentRef }, data: { status } });
  await writePaymentLog({
    donationId: donation.id,
    provider: donation.paymentProvider,
    event: "GENERIC_CALLBACK_RECEIVED",
    status,
    paymentRef,
    requestMethod: req.method,
    callbackUrl: req.url,
    ipAddress: paymentRequestIp(req),
    responseData: { receivedStatus: body.status }
  });
  return NextResponse.json({ ok: true });
}
