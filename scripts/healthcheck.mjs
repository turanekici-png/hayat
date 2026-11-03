import { pathToFileURL } from "node:url";

export async function checkHealth(url, timeoutMs = 5000) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
    const body = await response.json();
    return response.ok && body.status === "ok";
  } catch {
    return false;
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const healthy = await checkHealth(`http://127.0.0.1:${process.env.PORT || "3000"}/api/health/live`);
  if (!healthy) console.error("Application health check failed");
  process.exit(healthy ? 0 : 1);
}
