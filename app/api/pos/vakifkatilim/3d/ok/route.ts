import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentRequestIp, safeFormDetails, writePaymentLog } from "@/lib/payment-log";
import { completeVakifKatilim3dPayment } from "@/lib/pos";
import { updateDonationWithReceiptOnPaid } from "@/lib/receipt-number";

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

  await writePaymentLog({
    donationId: donationId || null,
    provider: "vakifkatilim",
    event: "BANK_OK_CALLBACK_RECEIVED",
    status: "INFO",
    paymentRef,
    responseCode,
    message: responseMessage,
    requestMethod: req.method,
    callbackUrl: req.url,
    ipAddress: paymentRequestIp(req),
    responseData: safeFormDetails(formData)
  });

  if (!paymentRef) {
    return failRedirect(req, "Ödeme referansı alınamadı.");
  }

  const donation = await findDonation(donationId, paymentRef);
  if (!donation) {
    await writePaymentLog({
      provider: "vakifkatilim",
      event: "BANK_OK_CALLBACK_UNMATCHED",
      status: "FAILED",
      paymentRef,
      responseCode,
      message: "Bağış kaydı bulunamadı.",
      requestMethod: req.method,
      callbackUrl: req.url,
      ipAddress: paymentRequestIp(req),
      responseData: safeFormDetails(formData)
    });
    return failRedirect(req, "Bağış kaydı bulunamadı.");
  }

  try {
    const mode = process.env.VAKIF_POS_MODE || "common_page";
    const md = formValue(formData, ["MD", "md"]);
    const isCommonPaymentPage = mode === "common_page" || (!md && Boolean(responseCode));

    if (isCommonPaymentPage) {
      const isPaid = SUCCESS_CODES.has(responseCode);

      await updateDonationWithReceiptOnPaid(
        { id: donation.id },
        { status: isPaid ? "PAID" : "FAILED" }
      );

      await writePaymentLog({
        donationId: donation.id,
        provider: "vakifkatilim",
        event: "BANK_PAYMENT_RESULT",
        status: isPaid ? "PAID" : "FAILED",
        paymentRef,
        responseCode,
        message: responseMessage || (isPaid ? "Ödeme banka tarafından onaylandı." : "Ödeme banka tarafından onaylanmadı."),
        requestMethod: req.method,
        callbackUrl: req.url,
        ipAddress: paymentRequestIp(req),
        responseData: safeFormDetails(formData)
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

    await updateDonationWithReceiptOnPaid(
      { id: donation.id },
      { status: result.status }
    );

    await writePaymentLog({
      donationId: donation.id,
      provider: "vakifkatilim",
      event: "BANK_PROVISION_RESULT",
      status: result.status,
      paymentRef,
      responseCode,
      message: result.responseMessage,
      requestMethod: req.method,
      callbackUrl: req.url,
      ipAddress: paymentRequestIp(req),
      responseData: safeFormDetails(formData)
    });

    if (result.status !== "PAID") {
      return failRedirect(req, result.responseMessage);
    }

    return receiptRedirect(req, donation.id);
  } catch (error) {
    await prisma.donation.update({ where: { id: donation.id }, data: { status: "FAILED", receiptNo: null } });
    const message = error instanceof Error ? error.message : "Ödeme doğrulanamadı.";
    await writePaymentLog({
      donationId: donation.id,
      provider: "vakifkatilim",
      event: "BANK_CALLBACK_PROCESSING_FAILED",
      status: "FAILED",
      paymentRef,
      responseCode,
      message,
      requestMethod: req.method,
      callbackUrl: req.url,
      ipAddress: paymentRequestIp(req),
      responseData: safeFormDetails(formData)
    });
    return failRedirect(req, message);
  }
}

export async function GET(req: Request) {
  await writePaymentLog({
    provider: "vakifkatilim",
    event: "BANK_OK_CALLBACK_INVALID_METHOD",
    status: "FAILED",
    requestMethod: req.method,
    callbackUrl: req.url,
    ipAddress: paymentRequestIp(req),
    message: "Banka dönüşü POST yerine GET olarak alındı."
  });
  return failRedirect(req, "Banka dönüşü POST olarak alınmalıdır.");
}
