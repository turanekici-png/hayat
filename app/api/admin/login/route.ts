import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSession } from "@/lib/auth-server";
import { createHash } from "crypto";

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

export async function POST(req: Request) {
  const form = await req.formData();
  const username = (form.get("username") as string || form.get("email") as string || "").trim().toLowerCase();
  const password = (form.get("password") as string || "").trim();
  const remember = Boolean(form.get("remember"));
  const redirectPath = safeAdminRedirect(form.get("redirect"));

  if (!username || !password) {
    return NextResponse.redirect(redirectUrl(req, "/admin/login"));
  }

  const user = await prisma.adminUser.findFirst({
    where: {
      OR: [
        { username },
        { email: username }
      ]
    }
  });
  if (!user) return NextResponse.redirect(redirectUrl(req, "/admin/login?error=invalid"));

  const hash = createHash("sha256").update(password).digest("hex");
  if (hash !== user.passwordHash) return NextResponse.redirect(redirectUrl(req, "/admin/login?error=invalid"));
  if (!user.isActive) return NextResponse.redirect(redirectUrl(req, "/admin/login?error=inactive"));

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
