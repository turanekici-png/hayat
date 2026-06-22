import { prisma } from "@/lib/prisma";

import { unstable_cache } from "next/cache";

export const defaultDonationTypes = [
  { code: "GENEL_BAGIS", label: "Genel Bağış", sortOrder: 1 },
  { code: "ZEKAT", label: "Zekat", sortOrder: 2 },
  { code: "FITRE", label: "Fitre", sortOrder: 3 },
  { code: "FIDYE", label: "Fidye", sortOrder: 4 },
  { code: "SADAKA", label: "Sadaka", sortOrder: 5 },
  { code: "KURBAN", label: "Kurban", sortOrder: 6 },
  { code: "GIDA", label: "Gıda", sortOrder: 7 },
  { code: "EGITIM", label: "Eğitim", sortOrder: 8 }
];

export async function ensureDefaultDonationTypes() {
  try {
    for (const item of defaultDonationTypes) {
      await prisma.donationType.upsert({
        where: { code: item.code },
        create: item,
        update: {}
      });
    }
  } catch {
    return;
  }
}

const fallbackDonationTypes = () => defaultDonationTypes.map((type) => ({ ...type, id: type.code, description: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }));

async function loadActiveDonationTypes() {
  try {
    const rows = await prisma.donationType.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }]
    });
    return rows.length ? rows : fallbackDonationTypes();
  } catch {
    return fallbackDonationTypes();
  }
}

export const getActiveDonationTypes = unstable_cache(loadActiveDonationTypes, ["active-donation-types"], {
  revalidate: 300,
  tags: ["donation-types"]
});

export async function getDonationTypeLabel(code: string) {
  await ensureDefaultDonationTypes();
  try {
    const type = await prisma.donationType.findUnique({ where: { code } });
    return type?.label || defaultDonationTypes.find((item) => item.code === code)?.label || code;
  } catch {
    return defaultDonationTypes.find((item) => item.code === code)?.label || code;
  }
}
