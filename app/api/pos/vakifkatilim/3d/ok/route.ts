import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { completeVakifKatilim3dPayment } from "@/lib/pos";

const SUCCESS_CODES = new Set(["0", "00", "000", "0000"]);

function failRedirect(req: Request, message?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const url = new URL("/bagis", baseUrl);
  url.searchParams.set("odeme", "basarisiz");
  if (message) url.searchParams.set("mesaj", message.slice(0, 160));
  return NextResponse.redirect(url);
}

function receiptRedirect(req: Request, donationId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  return NextResponse.redirect(new URL(`/bagis/makbuz/${donationId}`, baseUrl));
}

function formValue(formData: FormData, names: string[]) {
  for (const name of names) {
    const value = formData.get(name);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function readXmlTag(xml: string, tagName: string) {
  const match = xml.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i"));
  return match?.[1]?.trim() || "";
}

function postedPaymentRef(formData: FormData) {
  return formValue(formData, ["MerchantOrderId", "merchantOrderId", "PaymentRef", "paymentRef"]);
}

async function findDonation(donationId: string, paymentRef: string) {
  if (donationId && paymentRef) {
    return prisma.donation.findFirst({ where: { id: donationId, paymentRef } });
  }

  if (paymentRef) {
    return prisma.donation.findFirst({ where: { paymentRef } });
  }

  return null;
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const formData = await req.formData();
  const returnedPaymentRef = postedPaymentRef(formData);
  const paymentRef = url.searchParams.get("paymentRef") || returnedPaymentRef;
  const donationId =
    url.searchParams.get("donationId") ||
    (paymentRef.startsWith("VKF-") ? paymentRef.slice(4) : "");
  const responseXml = formValue(formData, ["ResponseMessage", "responseMessage", "VPosMessage"]);
  const responseCode =
    formValue(formData, ["ResponseCode", "responseCode"]) || readXmlTag(responseXml, "ResponseCode");
  const responseMessage =
    formValue(formData, ["ResponseMessage", "responseMessage", "Message", "message"]) ||
    readXmlTag(responseXml, "ResponseMessage");

  if (!paymentRef) {
    return failRedirect(req, "Ödeme referansı alınamadı.");
  }

  const donation = await findDonation(donationId, paymentRef);
  if (!donation) {
    return failRedirect(req, "Bağış kaydı bulunamadı.");
  }

  try {
    const mode = process.env.VAKIF_POS_MODE || "common_page";
    const md = formValue(formData, ["MD", "md"]);
    const isCommonPaymentPage = mode === "common_page" || (!md && Boolean(responseCode));

    if (isCommonPaymentPage) {
      const isPaid = SUCCESS_CODES.has(responseCode);

      await prisma.donation.update({
        where: { id: donation.id },
        data: { status: isPaid ? "PAID" : "FAILED" }
      });

      if (!isPaid) {
        return failRedirect(req, responseMessage || "Banka ödeme işlemini onaylamadı.");
      }

      return receiptRedirect(req, donation.id);
    }

    const result = await completeVakifKatilim3dPayment({
      donationId,
      paymentRef,
      amount: String(donation.amount),
      formData
    });

    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: result.status }
    });

    if (result.status !== "PAID") {
      return failRedirect(req, result.responseMessage);
    }

    return receiptRedirect(req, donation.id);
  } catch (error) {
    await prisma.donation.update({ where: { id: donation.id }, data: { status: "FAILED" } });
    const message = error instanceof Error ? error.message : "Ödeme doğrulanamadı.";
    return failRedirect(req, message);
  }
}

export async function GET(req: Request) {
  return failRedirect(req, "Banka dönüşü POST olarak alınmalıdır.");
}
