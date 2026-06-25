import { prisma } from "@/lib/prisma";

type PaymentLogInput = {
  donationId?: string | null;
  provider?: string | null;
  event: string;
  status: string;
  paymentRef?: string | null;
  responseCode?: string | null;
  message?: string | null;
  requestMethod?: string | null;
  callbackUrl?: string | null;
  ipAddress?: string | null;
  requestData?: Record<string, unknown> | null;
  responseData?: Record<string, unknown> | null;
  details?: Record<string, unknown> | null;
};

const SENSITIVE_KEY_PATTERN = /(card|cvv|cvc|password|hash|secret|token|authorization|cookie)/i;

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[depth-limited]";
  if (value == null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value.slice(0, 1000);
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizeValue(item, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 100)
        .map(([key, item]) => [
          key,
          SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : sanitizeValue(item, depth + 1)
        ])
    );
  }
  return String(value).slice(0, 1000);
}

function safeText(value?: string | null, maxLength = 1000) {
  return value?.trim().slice(0, maxLength) || null;
}

function safeJson(value?: Record<string, unknown> | null) {
  return value ? JSON.stringify(sanitizeValue(value)).slice(0, 20000) : null;
}

export async function writePaymentLog(input: PaymentLogInput) {
  const data = {
    donationId: input.donationId || null,
    provider: safeText(input.provider, 50) || "vakifkatilim",
    event: safeText(input.event, 80) || "UNKNOWN",
    status: safeText(input.status, 40) || "INFO",
    paymentRef: safeText(input.paymentRef, 120),
    responseCode: safeText(input.responseCode, 40),
    message: safeText(input.message, 1000),
    requestMethod: safeText(input.requestMethod, 12),
    callbackUrl: safeText(input.callbackUrl, 2000),
    ipAddress: safeText(input.ipAddress, 100),
    requestData: safeJson(input.requestData),
    responseData: safeJson(input.responseData),
    details: safeJson(input.details)
  };

  try {
    await prisma.paymentLog.create({ data });
  } catch (error) {
    if (data.donationId) {
      try {
        await prisma.paymentLog.create({ data: { ...data, donationId: null } });
        return;
      } catch {
        // The final error below is enough; payment flow must not fail because logging failed.
      }
    }
    console.error("[PaymentLog] Kayıt yazılamadı:", error instanceof Error ? error.message : error);
  }
}

export function paymentRequestIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
}

export function safeFormDetails(formData: FormData) {
  const result: Record<string, string> = {};

  for (const [key, rawValue] of formData.entries()) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      result[key] = "[redacted]";
      continue;
    }

    if (typeof rawValue === "string") {
      result[key] = rawValue.slice(0, 1000);
    } else {
      result[key] = `[file:${rawValue.name || "unnamed"}]`;
    }
  }

  return result;
}
