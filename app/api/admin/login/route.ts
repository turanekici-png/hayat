import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSession } from "@/lib/auth-server";
import { ensureEnvAdminUser } from "@/lib/admin-bootstrap";
import { hashPassword, needsRehash, verifyPassword } from "@/lib/password";

function getBaseUrl(req: Request) {
  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || new URL(req.url).protocol.replace(":", "");
    return `${proto}://${host}`;
  }

  try {
    const url = new URL(req.url);
    return url.origin;
  } catch {
    return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4000";
  }
}

function redirectUrl(req: Request, path: string) {
  return new URL(path, getBaseUrl(req));
}

function safeAdminRedirect(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/admin";
  if (!value.startsWith("/admin")) return "/admin";
  if (value.startsWith("//")) return "/admin";
  return value;
}

function isHttpsRequest(req: Request) {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedProto) return forwardedProto.split(",")[0]?.trim() === "https";
  return new URL(req.url).protocol === "https:";
}

function clientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

// Basit bellek-ici hiz sinirlama: ayni IP'den 15 dakikada 8'den fazla deneme
// yapilirsa girisler geciktirilir. Tek instance production dagitimlari icin
// yeterli bir kaba korumadir (brute-force denemelerini yavaslatir).
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPT_LIMIT = 8;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string) {
  const now = Date.now();
  if (loginAttempts.size > 5000) loginAttempts.clear(); // olasi bellek sismesine karsi kaba guvenlik
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_ATTEMPT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LOGIN_ATTEMPT_LIMIT;
}

function clearRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.redirect(redirectUrl(req, "/admin/login?error=too_many"));
  }

  const form = await req.formData();
  const username = (form.get("username") as string || form.get("email") as string || "").trim().toLowerCase();
  const password = (form.get("password") as string || "").trim();
  const remember = Boolean(form.get("remember"));
  const redirectPath = safeAdminRedirect(form.get("redirect"));

  if (!username || !password) {
    return NextResponse.redirect(redirectUrl(req, "/admin/login"));
  }

  await ensureEnvAdminUser();

  const user = await prisma.adminUser.findFirst({
    where: {
      OR: [
        { username },
        { email: username }
      ]
    }
  });
  if (!user) return NextResponse.redirect(redirectUrl(req, "/admin/login?error=invalid"));

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) return NextResponse.redirect(redirectUrl(req, "/admin/login?error=invalid"));
  if (!user.isActive) return NextResponse.redirect(redirectUrl(req, "/admin/login?error=inactive"));

  // Basarili giris: eski (salt'siz SHA-256) hash bulunan hesaplar sessizce
  // bcrypt'e yukseltilir; sifir kesinti, kullaniciya ek islem yok.
  if (needsRehash(user.passwordHash)) {
    const upgradedHash = await hashPassword(password);
    await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash: upgradedHash } }).catch(() => null);
  }

  clearRateLimit(ip);

  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8; // 30 days vs 8 hours
  const token = signSession({ sub: user.id, role: user.role }, maxAge);

  const res = NextResponse.redirect(redirectUrl(req, redirectPath));
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isHttpsRequest(req),
    maxAge
  });

  return res;
}
