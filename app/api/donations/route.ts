import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDefaultDonationTypes } from "@/lib/donation-types";
import { startPayment } from "@/lib/pos";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  fullName: z.string().min(3),
  email: z.string().email().optional().or(z.literal("")),
  amount: z.coerce.number().positive(),
  type: z.string().min(1),
  description: z.string().optional(),
  kvkkConsent: z.literal("true"),
  privacyConsent: z.literal("true"),
  refundConsent: z.literal("true")
});

function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const parsed = schema.parse(Object.fromEntries(form.entries()));
    await ensureDefaultDonationTypes();

    const donationType = await prisma.donationType.findFirst({
      where: { code: parsed.type, isActive: true }
    });
    if (!donationType) {
      return NextResponse.json({ error: "Geçerli bir bağış türü seçin." }, { status: 400 });
    }

    const ipAddress = clientIp(req);
    const receiptNo = `HB-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const donation = await prisma.donation.create({
      data: {
        receiptNo,
        fullName: parsed.fullName,
        phone: null,
        email: parsed.email || null,
        amount: parsed.amount,
        type: parsed.type,
        description: parsed.description || null,
        kvkkConsent: true,
        privacyConsent: true,
        refundConsent: true,
        consentAt: new Date(),
        ipAddress
      }
    });

    try {
      const payment = await startPayment({
        donationId: donation.id,
        amount: String(donation.amount),
        fullName: donation.fullName,
        email: donation.email,
        description: donation.description,
        clientIp: ipAddress
      });

      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          paymentProvider: payment.provider,
          paymentRef: payment.paymentRef,
          status: payment.status || (payment.provider === "demo" ? "PAID" : "PENDING")
        }
      });

      return NextResponse.json({
        redirectUrl: payment.redirectUrl,
        paymentHtml: payment.paymentHtml || null
      });
    } catch (paymentError) {
      await prisma.donation.update({ where: { id: donation.id }, data: { status: "FAILED" } });
      throw paymentError;
    }
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Bağış bilgileri ve yasal onaylar kontrol edilemedi. Lütfen zorunlu alanları işaretleyin.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
