import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Container liveness is independent of database availability: a database outage
// must not cause every web container to restart at the same time.
export function GET() {
  return NextResponse.json(
    { status: "ok", timestamp: new Date().toISOString(), uptimeSeconds: Math.floor(process.uptime()) },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
