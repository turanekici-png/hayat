// Bagiscinin baslattigi ama sonucu henuz bilinmeyen online bagis (sadece bagiscinin
// kendi tarayicisinda tutulur). Banka sayfasi yarida birakilirsa sitede uyari
// gostermek icin kullanilir. bkz. components/PendingDonationNotice.tsx

export type PendingDonation = {
  id: string;
  amount: string;
  typeCode: string;
  typeLabel: string;
  startedAt: number;
};

const STORAGE_KEY = "hayatder-bekleyen-bagis";
const MAX_AGE_MS = 48 * 60 * 60 * 1000;

export function savePendingDonation(value: Omit<PendingDonation, "startedAt">) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...value, startedAt: Date.now() }));
  } catch {
    // Ozel gezinti vb. durumlarda uyari gosterilemez; odeme akisi etkilenmez.
  }
}

export function readPendingDonation(): PendingDonation | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as PendingDonation;
    if (!value?.id || typeof value.startedAt !== "number" || Date.now() - value.startedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function clearPendingDonation() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // yok sayilir
  }
}
