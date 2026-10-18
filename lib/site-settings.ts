import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export type SiteSettingsData = {
  registryNo: string | null;
  affiliationNote: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  footerAbout: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  donationImpacts: string | null;
  applicationsEnabled: boolean;
  applicationUrl: string | null;
};

// Kayit yoksa veya veritabanina ulasilamazsa sitenin mevcut sabit bilgileri kullanilir.
export const defaultSiteSettings: SiteSettingsData = {
  registryNo: null,
  affiliationNote: "Sivas Belediyesi İştirakidir",
  phone: "+90 346 221 41 00",
  email: "bilgi@hayatder.org.tr",
  address: "Sularbaşı Mh. 4. Sk. No: 8 Merkez/Sivas",
  footerAbout: "\"Alan elin veren eli görmediği\", şeffaf ve güvenilir bir yardımlaşma ekosistemi inşa ediyoruz. Sivas merkezli derneğimizle tüm ihtiyaç sahiplerine umut oluyoruz.",
  facebookUrl: null,
  instagramUrl: null,
  twitterUrl: null,
  youtubeUrl: null,
  donationImpacts: null,
  applicationsEnabled: true,
  applicationUrl: null
};

function pick(value: string | null | undefined, fallback: string | null) {
  return value && value.trim() ? value.trim() : fallback;
}

async function loadSiteSettings(): Promise<SiteSettingsData> {
  const row = await prisma.siteSettings.findUnique({ where: { id: "default" } }).catch(() => null);
  if (!row) return defaultSiteSettings;
  return {
    registryNo: pick(row.registryNo, defaultSiteSettings.registryNo),
    affiliationNote: pick(row.affiliationNote, defaultSiteSettings.affiliationNote),
    phone: pick(row.phone, defaultSiteSettings.phone),
    email: pick(row.email, defaultSiteSettings.email),
    address: pick(row.address, defaultSiteSettings.address),
    footerAbout: pick(row.footerAbout, defaultSiteSettings.footerAbout),
    facebookUrl: pick(row.facebookUrl, null),
    instagramUrl: pick(row.instagramUrl, null),
    twitterUrl: pick(row.twitterUrl, null),
    youtubeUrl: pick(row.youtubeUrl, null),
    donationImpacts: pick(row.donationImpacts, null),
    applicationsEnabled: row.applicationsEnabled,
    applicationUrl: pick(row.applicationUrl, null)
  };
}

export const getSiteSettings = unstable_cache(loadSiteSettings, ["site-settings"], {
  revalidate: 300,
  tags: ["site-settings"]
});

/** "500|bir ailenin aylik gida kolisi" satirlarini { 500: "..." } haritasina cevirir. */
export function parseDonationImpacts(value: string | null | undefined) {
  const impacts: Record<number, string> = {};
  for (const line of (value || "").split("\n")) {
    const [rawAmount, ...rest] = line.split("|");
    const amount = Number((rawAmount || "").replace(/[^\d]/g, ""));
    const text = rest.join("|").trim();
    if (amount > 0 && text) impacts[amount] = text;
  }
  return impacts;
}

export function phoneHref(phone: string | null | undefined) {
  const digits = (phone || "").replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : undefined;
}

/** "Yardim Basvurusu" butonunun gidecegi adres: admin linki verdiyse o, yoksa sitedeki form. */
export function applicationHref(settings: Pick<SiteSettingsData, "applicationUrl">) {
  return settings.applicationUrl || "/basvuru";
}

export function isExternalUrl(href: string) {
  return /^https?:\/\//i.test(href);
}

/**
 * Basvuru kabul edilip edilmeyecegini onbellege takilmadan dogrudan veritabanindan okur
 * (admin kapattigi anda API'nin de basvuru almayi birakmasi icin).
 */
export async function areApplicationsOpen() {
  const row = await prisma.siteSettings.findUnique({ where: { id: "default" }, select: { applicationsEnabled: true } }).catch(() => null);
  return row ? row.applicationsEnabled : defaultSiteSettings.applicationsEnabled;
}
