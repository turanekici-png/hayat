import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const BCRYPT_ROUNDS = 10;

function isBcryptHash(hash: string) {
  return /^\$2[aby]\$/.test(hash);
}

function legacySha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/** Yeni/degistirilen sifreler icin her zaman bcrypt kullanilir. */
export async function hashPassword(value: string) {
  return bcrypt.hash(value, BCRYPT_ROUNDS);
}

/**
 * Eski kayitlar duz SHA-256 (salt'siz) ile hashlenmisti. Bu fonksiyon her iki
 * formati da dogrular; boylece mevcut admin sifreleri sifirlanmadan bcrypt'e
 * gecis yapilabilir (bkz. upgradeLegacyHashIfNeeded).
 */
export async function verifyPassword(value: string, storedHash: string) {
  if (isBcryptHash(storedHash)) {
    return bcrypt.compare(value, storedHash);
  }
  return legacySha256(value) === storedHash;
}

export function needsRehash(storedHash: string) {
  return !isBcryptHash(storedHash);
}
