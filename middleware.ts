import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return;
  if (pathname.startsWith("/_next")) return;
  if (!pathname.startsWith("/admin")) return;

  const token = req.cookies.get("admin_session")?.value;
  if (!token || !(await verifySession(token))) {
    const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const host = forwardedHost || req.headers.get("host") || req.nextUrl.host;
    const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || req.nextUrl.protocol.replace(":", "");
    const loginUrl = new URL(`${proto}://${host}`);
    loginUrl.pathname = "/admin/login";
    loginUrl.search = `redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  return;
}

export const config = {
  matcher: ["/admin/:path*"]
};
