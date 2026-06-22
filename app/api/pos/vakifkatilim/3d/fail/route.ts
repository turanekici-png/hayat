import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function redirectToDonation(req: Request, message?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const url = new URL("/bagis", baseUrl);
  url.searchParams.set("odeme", "basarisiz");
  if (message) url.searchParams.set("mesaj", message.slice(0, 160));
  return NextResponse.redirect(url);
}

function formValue(formData: FormData, names: string[]) {
  for (const name of names) {
    const value = formData.get(name);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

async function markFailed(donationId: string, paymentRef: string) {
  if (donationId && paymentRef) {
    await prisma.donation.updateMany({
      where: { id: donationId, paymentRef },
      data: { status: "FAILED" }
    });
    return;
  }

  if (paymentRef) {
    await prisma.donation.updateMany({
      where: { paymentRef },
      data: { status: "FAILED" }
    });
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const formData = await req.formData();
  const donationId = url.searchParams.get("donationId") || "";
  const returnedPaymentRef = formValue(formData, ["MerchantOrderId", "merchantOrderId", "PaymentRef", "paymentRef"]);
  const paymentRef = url.searchParams.get("paymentRef") || returnedPaymentRef;
  const message =
    formValue(formData, ["ResponseMessage", "responseMessage", "Message", "message"]) ||
    "3D güvenli ödeme iptal edildi veya onaylanmadı.";

  await markFailed(donationId, paymentRef);

  return redirectToDonation(req, message);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const donationId = url.searchParams.get("donationId") || "";
  const paymentRef = url.searchParams.get("paymentRef") || "";
  const message = url.searchParams.get("ResponseMessage") || url.searchParams.get("message") || undefined;

  await markFailed(donationId, paymentRef);

  return redirectToDonation(req, message);
}
