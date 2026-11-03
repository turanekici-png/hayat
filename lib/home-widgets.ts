import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const cachedGroupLabels = unstable_cache(
  () => prisma.sectionGroupLabel.findMany(),
  ["home-group-labels"],
  { revalidate: 300, tags: ["site-content"] }
);

const cachedAnnouncements = unstable_cache(
  async () => {
    const now = new Date();
    return prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }]
      },
      orderBy: [{ isPinned: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      take: 5
    });
  },
  ["home-announcements"],
  { revalidate: 60, tags: ["home-announcements"] }
);

const cachedPopup = unstable_cache(
  () => prisma.popupSetting.findFirst({ where: { isActive: true }, orderBy: { updatedAt: "desc" } }),
  ["home-popup"],
  { revalidate: 60, tags: ["home-popup"] }
);

async function optionalWidget<T>(widget: string, load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code
      : "unavailable";
    // Log a useful event without exposing connection strings or query data.
    console.error(JSON.stringify({ event: "home_widget_unavailable", widget, code, timestamp: new Date().toISOString() }));
    return fallback;
  }
}

// Catch outside the cache: a transient failure must not replace cached content
// with an empty result. Cold-cache failures only omit the affected widget.
export function getHomeGroupLabels() {
  return optionalWidget("group-labels", cachedGroupLabels, []);
}

export function getHomeAnnouncements() {
  return optionalWidget("announcements", cachedAnnouncements, []);
}

export function getHomePopup() {
  return optionalWidget("popup", cachedPopup, null);
}
