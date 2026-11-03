import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Reuse an outstanding query so repeated probes cannot fill the connection pool
// while the database is unavailable. The HTTP timeout does not cancel SQL.
let pendingProbe: Promise<boolean> | undefined;

function checkDatabase(): Promise<boolean> {
  if (pendingProbe) return pendingProbe;
  const probe = prisma.$queryRaw`SELECT 1`
    .then(() => true, () => false)
    .finally(() => { pendingProbe = undefined; });
  pendingProbe = probe;
  return probe;
}

export async function GET() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let databaseReady: boolean;
  try {
    databaseReady = await Promise.race([
      checkDatabase(),
      new Promise<boolean>((resolve) => { timer = setTimeout(() => resolve(false), 3000); })
    ]);
  } finally {
    clearTimeout(timer);
  }

  if (!databaseReady) {
    console.error(JSON.stringify({ event: "health_check_failed", check: "database", timestamp: new Date().toISOString() }));
  }

  return NextResponse.json(
    {
      status: databaseReady ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks: { application: "ok", database: databaseReady ? "ok" : "unavailable" }
    },
    { status: databaseReady ? 200 : 503, headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
