import { createHash } from "crypto";
import { Buffer } from "buffer";

export type PosStartInput = {
  donationId: string;
  amount: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  clientIp?: string | null;
  cardHolderName?: string;
  cardNumber?: string;
  expiryMonth?: string | number;
  expiryYear?: string | number;
  cvv?: string;
};

export type PosStartResult = {
  provider: string;
  paymentRef: string;
  redirectUrl: string;
  paymentHtml?: string;
  status?: "PAID" | "PENDING" | "FAILED";
};

export type Vakif3dCompleteInput = {
  paymentRef: string;
  amount: string;
  donationId: string;
  formData: FormData;
};

export type Vakif3dCompleteResult = {
  paymentRef: string;
  status: "PAID" | "FAILED";
  responseMessage: string;
};

const VAKIF_3D_PAY_ENDPOINT = "https://boa.vakifkatilim.com.tr/VirtualPOS.Gateway/Home/ThreeDModelPayGate";
const VAKIF_3D_PROVISION_ENDPOINT = "https://boa.vakifkatilim.com.tr/VirtualPOS.Gateway/Home/ThreeDModelProvisionGate";
const VAKIF_COMMON_PAYMENT_ENDPOINT = "https://boa.vakifkatilim.com.tr/VirtualPOS.Gateway/CommonPaymentPage/CommonPaymentPage";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} POS ayarı eksik.`);
  return value;
}

function xmlEscape(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function htmlDecode(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function xmlRootStart() {
  return '<VPosMessageContract xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">';
}

function normalizeAmount(amount: string) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Geçerli bir bağış tutarı girin.");
  }
  return String(Math.round(numericAmount * 100));
}

function twoDigit(value: string | number | undefined) {
  return String(value ?? "").replace(/\D/g, "").padStart(2, "0").slice(-2);
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

function validateVakifCallbackBaseUrl() {
  const baseUrl = siteUrl();
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(baseUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL geçerli ve dışarıdan erişilebilir bir adres olmalı.");
  }

  const allowInsecure = process.env.VAKIF_POS_ALLOW_INSECURE_CALLBACKS === "true";
  const localHostNames = new Set(["localhost", "127.0.0.1", "::1"]);

  if (!allowInsecure && parsedUrl.protocol !== "https:") {
    throw new Error("Canlı Vakıf Katılım POS için NEXT_PUBLIC_SITE_URL HTTPS olmalı.");
  }

  if (!allowInsecure && localHostNames.has(parsedUrl.hostname)) {
    throw new Error("Canlı Vakıf Katılım POS callback adresi localhost olamaz.");
  }

  return baseUrl;
}

function vakifSettings() {
  const rawHashPassword = requiredEnv("VAKIF_POS_HASH_PASSWORD");
  return {
    merchantId: requiredEnv("VAKIF_POS_MERCHANT_ID"),
    customerId: requiredEnv("VAKIF_POS_CUSTOMER_ID"),
    userName: requiredEnv("VAKIF_POS_USERNAME"),
    hashPassword: normalizeVakifHashPassword(rawHashPassword)
  };
}

function normalizeVakifHashPassword(value: string) {
  const trimmed = value.trim();
  const looksLikeSha1Base64 = /^[A-Za-z0-9+/]{27}=$/.test(trimmed);
  if (looksLikeSha1Base64) return trimmed;
  return createHash("sha1").update(Buffer.from(trimmed, "latin1")).digest("base64");
}

function buildVakifHash(input: {
  merchantId: string;
  merchantOrderId: string;
  amount: string;
  okUrl: string;
  failUrl: string;
  userName: string;
  hashPassword: string;
}) {
  const configuredFields = process.env.VAKIF_POS_HASH_FIELDS;
  const separator = process.env.VAKIF_POS_HASH_SEPARATOR ?? "";
  const fieldMap = {
    merchantId: input.merchantId,
    merchantOrderId: input.merchantOrderId,
    amount: input.amount,
    okUrl: input.okUrl,
    failUrl: input.failUrl,
    userName: input.userName,
    hashPassword: input.hashPassword
  };
  const fields = configuredFields
    ? configuredFields.split(",").map((field) => field.trim()).filter(Boolean)
    : ["merchantId", "merchantOrderId", "amount", "okUrl", "failUrl", "userName", "hashPassword"];
  const hashString = fields.map((field) => fieldMap[field as keyof typeof fieldMap] ?? "").join(separator);
  return createHash("sha1").update(Buffer.from(hashString, "latin1")).digest("base64");
}

function readXmlTag(xml: string, tagName: string) {
  const match = xml.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i"));
  return match?.[1]?.trim() || "";
}

function htmlEscape(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formValue(formData: FormData, names: string[]) {
  for (const name of names) {
    const value = formData.get(name);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function urlsFor(paymentRef: string, donationId: string) {
  const baseUrl = validateVakifCallbackBaseUrl();
  return {
    okUrl: `${baseUrl}/api/pos/vakifkatilim/3d/ok?donationId=${encodeURIComponent(donationId)}&paymentRef=${encodeURIComponent(paymentRef)}`,
    failUrl: `${baseUrl}/api/pos/vakifkatilim/3d/fail?donationId=${encodeURIComponent(donationId)}&paymentRef=${encodeURIComponent(paymentRef)}`
  };
}

function vakifOrderId(donationId: string) {
  return `H${donationId.replace(/[^a-zA-Z0-9]/g, "").slice(-19).toUpperCase()}`;
}

async function postXml(endpoint: string, xml: string) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      Accept: "text/html, application/xml, text/xml, */*"
    },
    body: xml
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Banka bağlantısı başarısız oldu: ${response.status}`);
  }
  return text;
}

function autoSubmitForm(action: string, fields: Record<string, string | number>) {
  const inputs = Object.entries(fields)
    .map(([name, value]) => `<input type="hidden" name="${htmlEscape(name)}" value="${htmlEscape(value)}" />`)
    .join("\n");

  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <title>Güvenli Ödeme</title>
  </head>
  <body onload="document.forms[0].submit()">
    <form action="${htmlEscape(action)}" method="post">
      ${inputs}
      <noscript>
        <button type="submit">Güvenli ödeme sayfasına geç</button>
      </noscript>
    </form>
  </body>
</html>`;
}

function startVakifKatilimCommonPayment(input: PosStartInput): PosStartResult {
  const { merchantId, customerId, userName, hashPassword } = vakifSettings();
  const endpoint = process.env.VAKIF_POS_COMMON_PAYMENT_ENDPOINT || VAKIF_COMMON_PAYMENT_ENDPOINT;
  const paymentRef = vakifOrderId(input.donationId);
  const amount = normalizeAmount(input.amount);
  const currencyCode = process.env.VAKIF_POS_CURRENCY_CODE || "0949";
  const { okUrl, failUrl } = urlsFor(paymentRef, input.donationId);
  const hashData = buildVakifHash({
    merchantId,
    merchantOrderId: paymentRef,
    amount,
    okUrl,
    failUrl,
    userName,
    hashPassword
  });

  return {
    provider: "vakifkatilim",
    paymentRef,
    redirectUrl: okUrl,
    paymentHtml: autoSubmitForm(endpoint, {
      UserName: userName,
      HashPassword: hashPassword,
      MerchantId: merchantId,
      CustomerId: customerId,
      MerchantOrderId: paymentRef,
      InstallmentCount: "0",
      Amount: amount,
      DisplayAmount: amount,
      FECAmount: "0",
      FECCurrencyCode: currencyCode,
      OkUrl: okUrl,
      FailUrl: failUrl,
      APIVersion: "1.0.0",
      PaymentType: "1",
      TransactionSecurity: "3",
      HashData: hashData
    }),
    status: "PENDING"
  };
}

async function startVakifKatilim3dPayment(input: PosStartInput): Promise<PosStartResult> {
  const { merchantId, customerId, userName, hashPassword } = vakifSettings();
  const endpoint = process.env.VAKIF_POS_3D_PAY_ENDPOINT || process.env.VAKIF_POS_ENDPOINT || VAKIF_3D_PAY_ENDPOINT;
  const paymentRef = `VKF-${input.donationId}`;
  const amount = normalizeAmount(input.amount);
  const { okUrl, failUrl } = urlsFor(paymentRef, input.donationId);

  if (!input.cardHolderName || !input.cardNumber || !input.expiryMonth || !input.expiryYear || !input.cvv) {
    throw new Error("Kart bilgileri eksik.");
  }

  const hashData = buildVakifHash({
    merchantId,
    merchantOrderId: paymentRef,
    amount,
    okUrl,
    failUrl,
    userName,
    hashPassword
  });

  const cardNumber = input.cardNumber.replace(/\D/g, "");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
${xmlRootStart()}
  <OkUrl>${xmlEscape(okUrl)}</OkUrl>
  <FailUrl>${xmlEscape(failUrl)}</FailUrl>
  <HashData>${xmlEscape(hashData)}</HashData>
  <MerchantId>${xmlEscape(merchantId)}</MerchantId>
  <SubMerchantId>0</SubMerchantId>
  <CustomerId>${xmlEscape(customerId)}</CustomerId>
  <UserName>${xmlEscape(userName)}</UserName>
  <MerchantOrderId>${xmlEscape(paymentRef)}</MerchantOrderId>
  <InstallmentCount>0</InstallmentCount>
  <Amount>${xmlEscape(amount)}</Amount>
  <DisplayAmount>${xmlEscape(amount)}</DisplayAmount>
  <FECAmount>0</FECAmount>
  <FECCurrencyCode>0949</FECCurrencyCode>
  <AdditionalData>
    <AdditionalDataList>
      <VPosAdditionalData>
        <Key>DonationId</Key>
        <Data>${xmlEscape(input.donationId)}</Data>
        <Description>Bagis kaydi</Description>
      </VPosAdditionalData>
    </AdditionalDataList>
  </AdditionalData>
  <Addresses>
    <VPosAddressContract>
      <Type>1</Type>
      <Name>${xmlEscape(input.fullName)}</Name>
      <PhoneNumber>${xmlEscape(input.phone || "")}</PhoneNumber>
      <OrderId>0</OrderId>
      <AddressId>1</AddressId>
      <Email>${xmlEscape(input.email || "")}</Email>
    </VPosAddressContract>
  </Addresses>
  <APIVersion>1.0.0</APIVersion>
  <CardNumber>${xmlEscape(cardNumber)}</CardNumber>
  <CardExpireDateYear>${xmlEscape(twoDigit(input.expiryYear))}</CardExpireDateYear>
  <CardExpireDateMonth>${xmlEscape(twoDigit(input.expiryMonth))}</CardExpireDateMonth>
  <CardCVV2>${xmlEscape(input.cvv)}</CardCVV2>
  <CardHolderName>${xmlEscape(input.cardHolderName)}</CardHolderName>
  <PaymentType>1</PaymentType>
  <DebtId>0</DebtId>
  <SurchargeAmount>0</SurchargeAmount>
  <SGKDebtAmount>0</SGKDebtAmount>
  <InstallmentMaturityCommisionFlag>0</InstallmentMaturityCommisionFlag>
  <TransactionSecurity>3</TransactionSecurity>
</VPosMessageContract>`;

  const responseText = await postXml(endpoint, xml);
  const responseMessage = htmlDecode(readXmlTag(responseText, "ResponseMessage"));
  const paymentHtml = responseText.includes("<form") || responseText.includes("<html")
    ? responseText
    : responseMessage.includes("<form") || responseMessage.includes("<html")
      ? responseMessage
      : "";

  if (!paymentHtml) {
    throw new Error(responseMessage || "Banka 3D doğrulama sayfasını döndürmedi.");
  }

  return {
    provider: "vakifkatilim",
    paymentRef,
    redirectUrl: okUrl,
    paymentHtml,
    status: "PENDING"
  };
}

export async function completeVakifKatilim3dPayment(input: Vakif3dCompleteInput): Promise<Vakif3dCompleteResult> {
  const { merchantId, userName, hashPassword } = vakifSettings();
  const amount = normalizeAmount(input.amount);
  const { okUrl, failUrl } = urlsFor(input.paymentRef, input.donationId);
  const md = formValue(input.formData, ["MD", "md"]);
  const responseXml = formValue(input.formData, ["ResponseMessage", "responseMessage", "VPosMessage"]);
  const responseCode = formValue(input.formData, ["ResponseCode", "responseCode"]) || readXmlTag(responseXml, "ResponseCode");
  const bankMessage = formValue(input.formData, ["Message", "message"]) || readXmlTag(responseXml, "ResponseMessage");

  if (!md) {
    return {
      paymentRef: input.paymentRef,
      status: "FAILED",
      responseMessage: bankMessage || "3D doğrulama verisi bankadan alınamadı."
    };
  }

  if (responseCode && !["0", "00", "000", "0000"].includes(responseCode)) {
    return {
      paymentRef: input.paymentRef,
      status: "FAILED",
      responseMessage: bankMessage || "3D doğrulama banka tarafından onaylanmadı."
    };
  }

  const hashData = buildVakifHash({
    merchantId,
    merchantOrderId: input.paymentRef,
    amount,
    okUrl,
    failUrl,
    userName,
    hashPassword
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
${xmlRootStart()}
  <OkUrl>${xmlEscape(okUrl)}</OkUrl>
  <FailUrl>${xmlEscape(failUrl)}</FailUrl>
  <HashData>${xmlEscape(hashData)}</HashData>
  <MerchantId>${xmlEscape(merchantId)}</MerchantId>
  <SubMerchantId>0</SubMerchantId>
  <MerchantOrderId>${xmlEscape(input.paymentRef)}</MerchantOrderId>
  <InstallmentCount>0</InstallmentCount>
  <Amount>${xmlEscape(amount)}</Amount>
  <FECAmount>0</FECAmount>
  <AdditionalData>
    <AdditionalDataList>
      <VPosAdditionalData>
        <Key>MD</Key>
        <Data>${xmlEscape(md)}</Data>
      </VPosAdditionalData>
    </AdditionalDataList>
  </AdditionalData>
  <PaymentType>1</PaymentType>
  <DebtId>0</DebtId>
  <SurchargeAmount>0</SurchargeAmount>
  <SGKDebtAmount>0</SGKDebtAmount>
  <InstallmentMaturityCommisionFlag>0</InstallmentMaturityCommisionFlag>
  <TransactionSecurity>3</TransactionSecurity>
</VPosMessageContract>`;

  const endpoint = process.env.VAKIF_POS_3D_PROVISION_ENDPOINT || VAKIF_3D_PROVISION_ENDPOINT;
  const provisionResponse = await postXml(endpoint, xml);
  const provisionCode = readXmlTag(provisionResponse, "ResponseCode");
  const provisionMessage = readXmlTag(provisionResponse, "ResponseMessage") || bankMessage || "Banka cevabı alınamadı.";
  const isPaid = ["0", "00", "000", "0000"].includes(provisionCode);

  return {
    paymentRef: input.paymentRef,
    status: isPaid ? "PAID" : "FAILED",
    responseMessage: provisionMessage
  };
}

export async function startPayment(input: PosStartInput): Promise<PosStartResult> {
  const provider = process.env.POS_PROVIDER || "demo";
  const baseUrl = siteUrl();

  if (provider === "demo") {
    return {
      provider,
      paymentRef: `DEMO-${input.donationId}`,
      redirectUrl: `${baseUrl}/bagis/makbuz/${input.donationId}?demo=1`,
      status: "PAID"
    };
  }

  if (provider === "vakifkatilim") {
    const mode = process.env.VAKIF_POS_MODE || "common_page";
    return mode === "api_3d" ? startVakifKatilim3dPayment(input) : startVakifKatilimCommonPayment(input);
  }

  if (provider === "paytr") {
    const merchantId = process.env.PAYTR_MERCHANT_ID;
    const merchantKey = process.env.PAYTR_MERCHANT_KEY;
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT;

    if (!merchantId || !merchantKey || !merchantSalt) {
      throw new Error("PayTR API bilgileri (.env) eksik.");
    }

    console.log("PayTR entegrasyonu tetiklendi, token bekleniyor...");

    return {
      provider: "paytr",
      paymentRef: `PAYTR-${input.donationId}`,
      redirectUrl: `${baseUrl}/api/pos/paytr-iframe?id=${input.donationId}`,
      status: "PENDING"
    };
  }

  throw new Error(`${provider} POS entegrasyonu için .env dosyasına gerekli bilgiler girilmeli.`);
}
