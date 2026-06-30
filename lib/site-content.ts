import { prisma } from "@/lib/prisma";
import { normalizeMediaUrl } from "@/lib/media-url";

import { unstable_cache } from "next/cache";

export type SectionType = string;
export type SectionLayout = string;
export type SectionTheme = string;

export type HomeSection = {
  id: string;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  badge?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  images?: Array<{
    id: string;
    url: string;
    alt?: string | null;
    sortOrder: number;
  }>;
  href?: string | null;
  buttonLabel?: string | null;
  secondaryHref?: string | null;
  secondaryButtonLabel?: string | null;
  customTitle?: string | null;
  type: SectionType;
  layout: SectionLayout;
  theme: SectionTheme;
  sortOrder: number;
  titleSize?: number;
  subtitleSize?: number;
  bodySize?: number;
  titleColor?: string | null;
  subtitleColor?: string | null;
  bodyColor?: string | null;
  textAlign?: string;
  contentWidth?: string;
  paddingY?: number;
  cardWidth?: string;
  minHeight?: number | null;
  cardPadding?: number;
  marginTop?: number;
  marginBottom?: number;
  borderRadius?: number;
  borderColor?: string | null;
  backgroundColor?: string | null;
};

export const fallbackSections: HomeSection[] = [
  {
    id: "managed-hero-main",
    title: "İyiliği güvenle büyüten yardım köprüsü",
    badge: "Hayat Ağacı Derneği",
    body: "Hayat Ağacı Derneği olarak bağışlarınızı kayıtlı, şeffaf ve takip edilebilir süreçlerle ihtiyaç sahiplerine ulaştırıyoruz.",
    imageUrl: "/brand/hayat-agaci-logo.jpg",
    imageAlt: "Hayat Ağacı Derneği",
    href: "/bagis",
    buttonLabel: "Bağış Yap",
    secondaryHref: "/#projeler",
    secondaryButtonLabel: "Projeleri İncele",
    type: "HERO",
    layout: "SPLIT",
    theme: "SOFT",
    sortOrder: 1,
    titleSize: 58,
    subtitleSize: 11,
    bodySize: 18,
    paddingY: 0,
    cardWidth: "full",
    cardPadding: 32,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 8
  },
  {
    id: "managed-feature-quick-donation",
    title: "Hızlı Bağış",
    subtitle: "Desteğinizi hemen ulaştırın",
    body: "Bağış kategorisi ve tutarınızı seçerek güvenli bağış ekranına geçebilirsiniz.",
    buttonLabel: "Şimdi Destek Ol",
    href: "/bagis",
    type: "FEATURE",
    layout: "BANNER",
    theme: "LIGHT",
    sortOrder: 2,
    titleSize: 32,
    subtitleSize: 15,
    bodySize: 15,
    paddingY: 56,
    cardWidth: "full",
    cardPadding: 32,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 8
  },
  {
    id: "managed-about-main",
    title: "Hakkımızda",
    badge: "Hakkımızda",
    body: "Hayat Ağacı Derneği olarak ihtiyaç sahiplerine güvenilir, şeffaf ve sürdürülebilir yardım ulaştırmak için çalışıyoruz.",
    imageUrl: "/brand/hayat-agaci-logo.jpg",
    imageAlt: "Kurumsal Güven",
    customTitle: "Kurumsal Güven",
    type: "ABOUT",
    layout: "SPLIT",
    theme: "SOFT",
    sortOrder: 80,
    titleSize: 64,
    subtitleSize: 11,
    bodySize: 18,
    paddingY: 96,
    cardWidth: "full",
    cardPadding: 32,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 8
  },
  {
    id: "managed-about-mission",
    title: "Misyonumuz",
    badge: "Misyon",
    body: "Bağışları en doğru ihtiyaç alanlarına ulaştırmak, yardım süreçlerini kayıtlı ve takip edilebilir şekilde yürütmek.",
    type: "ABOUT",
    layout: "CARD",
    theme: "LIGHT",
    sortOrder: 81,
    titleSize: 26,
    subtitleSize: 10,
    bodySize: 15,
    paddingY: 96,
    cardWidth: "third",
    cardPadding: 24,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 8
  },
  {
    id: "managed-about-vision",
    title: "Vizyonumuz",
    badge: "Vizyon",
    body: "Dayanışmayı büyüten, güven veren ve toplumda kalıcı iyilik etkisi oluşturan güçlü bir yardım köprüsü olmak.",
    type: "ABOUT",
    layout: "CARD",
    theme: "LIGHT",
    sortOrder: 82,
    titleSize: 26,
    subtitleSize: 10,
    bodySize: 15,
    paddingY: 96,
    cardWidth: "third",
    cardPadding: 24,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 8
  }
];

export async function ensureManagedSectionsOnce() {
  try {
    for (const section of fallbackSections) {
      const existing = await prisma.siteSection.findFirst({
        where: {
          OR: [
            { id: section.id },
            { type: section.type, title: section.title }
          ]
        }
      });

      if (!existing) {
        await prisma.siteSection.create({
          data: {
            id: section.id,
            title: section.title,
            subtitle: section.subtitle,
            body: section.body,
            badge: section.badge,
            imageUrl: section.imageUrl,
            imageAlt: section.imageAlt,
            href: section.href,
            buttonLabel: section.buttonLabel,
            secondaryHref: section.secondaryHref,
            secondaryButtonLabel: section.secondaryButtonLabel,
            customTitle: section.customTitle,
            type: section.type,
            layout: section.layout,
            theme: section.theme,
            sortOrder: section.sortOrder,
            titleSize: section.titleSize || 32,
            subtitleSize: section.subtitleSize || 14,
            bodySize: section.bodySize || 16,
            textAlign: section.textAlign || "left",
            contentWidth: section.contentWidth || "normal",
            paddingY: section.paddingY || 56,
            cardWidth: section.cardWidth || "normal",
            minHeight: section.minHeight,
            cardPadding: section.cardPadding || 32,
            marginTop: section.marginTop || 0,
            marginBottom: section.marginBottom || 0,
            borderRadius: section.borderRadius || 8,
            borderColor: section.borderColor,
            backgroundColor: section.backgroundColor,
            titleColor: section.titleColor,
            subtitleColor: section.subtitleColor,
            bodyColor: section.bodyColor,
            isActive: true
          }
        });
      }
    }
  } catch {
    return;
  }
}

export async function ensureLegacySectionImages() {
  try {
    const sections = await prisma.siteSection.findMany({
      where: {
        imageUrl: { not: null }
      },
      include: {
        images: true
      }
    });

    for (const section of sections) {
      if (!section.imageUrl || section.images.some((image) => image.url === section.imageUrl)) continue;
      await prisma.siteSectionImage.create({
        data: {
          sectionId: section.id,
          url: section.imageUrl,
          alt: section.imageAlt,
          sortOrder: 0
        }
      });
    }
  } catch {
    return;
  }
}

function withNormalizedMedia<T extends HomeSection>(section: T): T {
  return {
    ...section,
    imageUrl: normalizeMediaUrl(section.imageUrl) || section.imageUrl,
    images: section.images?.map((image) => ({
      ...image,
      url: normalizeMediaUrl(image.url) || image.url
    }))
  };
}

function compareSections(a: HomeSection, b: HomeSection) {
  const orderDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
  if (orderDiff !== 0) return orderDiff;
  return a.title.localeCompare(b.title, "tr");
}

async function loadHomeSections() {
  try {
    const activeRows = await prisma.siteSection.findMany({
      where: { isActive: true },
      include: {
        images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });

    const seen = new Set<string>();
    return activeRows.filter((section) => {
      const key = `${section.id}::${section.type}::${section.title.trim().toLocaleLowerCase("tr-TR")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(withNormalizedMedia).sort(compareSections);
  } catch {
    return fallbackSections.map(withNormalizedMedia).sort(compareSections);
  }
}

export const getHomeSections = unstable_cache(loadHomeSections, ["home-sections"], {
  revalidate: 60,
  tags: ["site-content"]
});

async function loadSectionsByType(type: SectionType) {
  try {
    const activeRows = await prisma.siteSection.findMany({
      where: { isActive: true, type },
      include: {
        images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });

    return (activeRows.length ? activeRows : fallbackSections.filter((section) => section.type === type)).map(withNormalizedMedia).sort(compareSections);
  } catch {
    return fallbackSections.filter((section) => section.type === type).map(withNormalizedMedia).sort(compareSections);
  }
}

export const getSectionsByType = unstable_cache(loadSectionsByType, ["sections-by-type"], {
  revalidate: 60,
  tags: ["site-content"]
});

async function loadSectionGroupLabel(type: string) {
  return prisma.sectionGroupLabel.findFirst({ where: { type } });
}

export const getSectionGroupLabel = unstable_cache(loadSectionGroupLabel, ["section-group-label"], {
  revalidate: 60,
  tags: ["site-content"]
});

export function firstByType(sections: HomeSection[], type: SectionType) {
  return sections.filter((s) => s.type === type).sort(compareSections)[0];
}

export function allByType(sections: HomeSection[], type: SectionType) {
  return sections.filter((s) => s.type === type).sort(compareSections);
}
