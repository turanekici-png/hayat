import { createHmac } from "crypto";

const SECRET = process.env.ADMIN_SESSION_SECRET || "dev_admin_secret_change_me";

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

export function signSession(payload: Record<string, any>, expiresInSeconds: number) {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };
  const json = JSON.stringify(body);
  const encoded = base64url(Buffer.from(json, "utf8"));
  const sig = createHmac("sha256", SECRET).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}
