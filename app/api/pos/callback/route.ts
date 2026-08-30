import { NextResponse } from "next/server";
import { paymentRequestIp, writePaymentLog } from "@/lib/payment-log";
import { updateDonationWithReceiptOnPaid } from "@/lib/receipt-number";

// Bu genel amacli callback herhangi bir POS saglayicisi tarafindan su an
// kullanilmiyor (bkz. lib/pos.ts). Imzasiz/yetkisiz cagrilarla "paymentRef"
// bilen herkesin bir bagisi sahte olarak PAID isaretleyebilmesini engellemek
// icin, PAYMENT_CALLBACK_SECRET ortam degiskeni tanimli ve eslesmedigi surece
// istekler reddedilir.
function isAuthorizedCallback(req: Request) {
  const expected = process.env.PAYMENT_CALLBACK_SECRET;
  if (!expected) return false;
  const provided = req.headers.get("x-callback-secret");
  return provided === expected;
}

export async function POST(req: Request) {
  if (!isAuthorizedCallback(req)) {
    return NextResponse.json({ error: "Yetkisiz istek." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const paymentRef = body.paymentRef as string | undefined;
  const status = body.status === "PAID" ? "PAID" : "FAILED";
  if (!paymentRef) return NextResponse.json({ error: "paymentRef gerekli" }, { status: 400 });
  const donation = await updateDonationWithReceiptOnPaid({ paymentRef }, { status });
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
