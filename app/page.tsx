import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HomePopup } from "@/components/HomePopup";
import { ExpandableCard } from "@/components/ExpandableCard";
import { HeroImageSlider } from "@/components/HeroImageSlider";
import { ExpandableText } from "@/components/ExpandableText";
import { ActivityShowcaseSlider } from "@/components/ActivityShowcaseSlider";
import { MediaLightboxTile } from "@/components/MediaLightboxTile";
import { QuickDonationCard } from "@/components/QuickDonationCard";
import { NewsHeroSlider } from "@/components/NewsHeroSlider";
import { getHomeSections, allByType, firstByType } from "@/lib/site-content";
import { getActiveDonationTypes } from "@/lib/donation-types";
import { getSiteSettings, parseDonationImpacts } from "@/lib/site-settings";
import { normalizeMediaUrl } from "@/lib/media-url";
import { optimizedImageSrc } from "@/lib/image-src";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { ArrowRight, CalendarDays, ChevronRight, HandHeart, ImageIcon, Megaphone, PlayCircle, Quote, ShieldCheck } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SectionSlide = {
  src: string;
  alt: string;
};

type MediaItem = { id: string; section: any; slide?: SectionSlide };

function isCorporateIdentitySection(section: any) {
  const title = (section.title || "").toLocaleLowerCase("tr-TR");
  return section.type === "ABOUT" || title.includes("hakkımızda") || title.includes("hakkimizda") || title.includes("misyon") || title.includes("vizyon");
}

function sectionText(value: string | null | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value : fallback;
}

function sectionSlides(section: any, fallbackSrc?: string, fallbackAlt?: string): SectionSlide[] {
  const images = Array.isArray(section?.images) ? section.images : [];
  const slides: SectionSlide[] = images
    .filter((image: any) => image?.url)
    .map((image: any) => ({ src: normalizeMediaUrl(image.url) || image.url, alt: image.alt || section?.imageAlt || section?.title || fallbackAlt || "Görsel" }));

  if (section?.type === "HERO") {
    if (!section?.imageUrl) return slides;
    const imageUrl = normalizeMediaUrl(section.imageUrl) || section.imageUrl;
    return [
      { src: imageUrl, alt: section.imageAlt || section.title || fallbackAlt || "Görsel" },
      ...slides.filter((slide) => slide.src !== imageUrl)
    ];
  }

  if (slides.length) return slides;
  if (section?.imageUrl && section.type !== "HERO") return [{ src: normalizeMediaUrl(section.imageUrl) || section.imageUrl, alt: section.imageAlt || section.title || fallbackAlt || "Görsel" }];
  if (fallbackSrc) return [{ src: fallbackSrc, alt: fallbackAlt || section?.title || "Görsel" }];
  return [];
}

function firstSlide(section: any, fallbackSrc?: string, fallbackAlt?: string): SectionSlide | undefined {
  return sectionSlides(section, fallbackSrc, fallbackAlt)[0];
}

function isVideoSrc(src?: string | null) {
  return Boolean(src && (/(\.mp4|\.webm|\.ogg|\.mov)(\?.*)?$/i.test(src) || /(?:youtube\.com|youtu\.be|vimeo\.com)/i.test(src)));
}

function cleanMediaTitle(value: string | null | undefined, fallback: string) {
  const raw = (value || "").trim();
  if (!raw) return fallback;

  const hadExtension = /\.[a-z0-9]{2,5}(\?.*)?$/i.test(raw);
  const withoutExtension = raw.replace(/\.[a-z0-9]{2,5}(\?.*)?$/i, "").trim();
  const normalized = withoutExtension.toLocaleLowerCase("tr-TR");
  const genericNames = ["video", "resim", "image", "img", "foto", "photo", "galeri", "gallery"];
  const looksLikeFileName = /^(img|dsc|vid|video|foto|photo|whatsapp|p)[-_ ]?\d*/i.test(normalized) || (hadExtension && !/\s/.test(withoutExtension));

  if (!withoutExtension || genericNames.includes(normalized) || looksLikeFileName) {
    return fallback;
  }

  return withoutExtension;
}

function mediaItemTitle(item: MediaItem, fallback: string) {
  return cleanMediaTitle(item.slide?.alt || item.section?.title, fallback);
}

function sectionMediaItems(sections: any[]): MediaItem[] {
  return sections.flatMap((section): MediaItem[] => {
    const slides = sectionSlides(section);
    return slides.length
      ? slides.map((slide, index) => ({ id: `${section.id}-${index}`, section, slide }))
      : [{ id: `${section.id}-empty`, section, slide: undefined }];
  });
}

function formatDate(value: unknown) {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function safeAlign(value?: string | null): CSSProperties["textAlign"] {
  return value === "center" || value === "right" || value === "justify" ? value : "left";
}
function headingStyle(section: any, fallbackColor = "#1f3444", fallbackSize = 32): CSSProperties {
  return { color: section?.titleColor || fallbackColor, fontSize: `${section?.titleSize || fallbackSize}px`, textAlign: safeAlign(section?.textAlign) };
}
function bodyStyle(section: any, fallbackColor = "#607081", fallbackSize = 16): CSSProperties {
  return { color: section?.bodyColor || fallbackColor, fontSize: `${section?.bodySize || fallbackSize}px`, textAlign: safeAlign(section?.textAlign), whiteSpace: "pre-line" };
}

function formatNumber(value: number) {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

const getHomeGroupLabels = unstable_cache(
  () => prisma.sectionGroupLabel.findMany(),
  ["home-group-labels"],
  { revalidate: 300, tags: ["site-content"] }
);

const getHomeAnnouncements = unstable_cache(
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

const getHomePopup = unstable_cache(
  () => prisma.popupSetting.findFirst({ where: { isActive: true }, orderBy: { updatedAt: "desc" } }),
  ["home-popup"],
  { revalidate: 60, tags: ["home-popup"] }
);

function announcementLabel(type: string) {
  if (type === "ACIL") return "Acil";
  if (type === "KAMPANYA") return "Kampanya";
  if (type === "HABER") return "Haber";
  return "Duyuru";
}

/* ---------- Ortak parcalar ---------- */

function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1840px] px-3 sm:px-4 lg:px-4 ${className}`}>{children}</div>;
}

function SectionHeading({ eyebrow, title, href, linkLabel, dark = false }: { eyebrow: string; title: string; href?: string; linkLabel?: string; dark?: boolean }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className={`text-xs font-black uppercase tracking-[0.14em] ${dark ? "text-[#a9d47a]" : "text-[#3f7d17]"}`}>{eyebrow}</p>
        <h2 className={`mt-2 font-jakarta text-[28px] font-extrabold leading-tight sm:text-[36px] ${dark ? "text-white" : "text-hayat-dark"}`}>{title}</h2>
      </div>
      {href && (
        <Link href={href} className={`inline-flex items-center gap-1.5 text-[15px] font-black ${dark ? "text-[#cfe0ea] hover:text-white" : "text-[#0c5e8a] hover:text-hayat-dark"}`}>
          {linkLabel || "Tümü"} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [sections, groupLabels, donationTypes, announcements, popup, settings] = await Promise.all([
    getHomeSections(),
    getHomeGroupLabels(),
    getActiveDonationTypes(),
    getHomeAnnouncements(),
    getHomePopup(),
    getSiteSettings()
  ]);

  const getSectionTitle = (type: string, sectionsForType: any[], fallback: string) => {
    return groupLabels.find((label) => label.type === type)?.label || sectionsForType.find((section) => section.customTitle)?.customTitle || fallback;
  };

  const features = allByType(sections, "FEATURE");
  const activities = allByType(sections, "ACTIVITY");
  const campaigns = allByType(sections, "CAMPAIGN");
  const videos = allByType(sections, "VIDEO");
  const newsSections = allByType(sections, "NEWS");
  const gallery = allByType(sections, "GALLERY");
  const blogs = allByType(sections, "BLOG");
  const stories = allByType(sections, "STORY");
  const corporateIdentitySections = sections.filter(isCorporateIdentitySection);
  const cta = firstByType(sections, "CTA");
  const heroSection = firstByType(sections, "HERO");
  const customs = allByType(sections, "CUSTOM").filter((s) => {
    const key = `${s.title} ${s.customTitle || ""}`.toLocaleLowerCase("tr-TR");
    return !s.id.startsWith("system-") && !isCorporateIdentitySection(s) && !key.includes("istatistik") && !key.includes("bugüne kadar") && !key.includes("bugune kadar");
  });

  const quickDonation = features.find((s) => {
    const key = `${s.title} ${s.customTitle || ""}`.toLocaleLowerCase("tr-TR");
    return key.includes("hızlı bağış") || key.includes("hizli bagis");
  });
  const shortcutSections = features.filter((s) => s.id !== quickDonation?.id);

  const activitiesTitle = getSectionTitle("ACTIVITY", activities, "Faaliyetler & Yardımlar");
  const campaignsTitle = getSectionTitle("CAMPAIGN", campaigns, "Aktif Kampanyalar");
  const videosTitle = getSectionTitle("VIDEO", videos, "Video Blog");
  const galleryTitle = getSectionTitle("GALLERY", gallery, "Sahadan Kareler");
  const blogsTitle = getSectionTitle("BLOG", blogs, "Blog Yazıları");
  const storiesTitle = getSectionTitle("STORY", stories, "İyilik Hikâyeleri");
  const customsTitle = getSectionTitle("CUSTOM", customs, "Özel Alanlar");
  const corporateTitle = getSectionTitle("ABOUT", corporateIdentitySections, "Kurumsal Güven");

  const fallbackCorporateSections = [
    { id: "fallback-corp-main", title: corporateTitle, body: "Kurumsal bilgileriniz henüz eklenmedi.", type: "ABOUT", layout: "SPLIT", theme: "SOFT", sortOrder: 1 } as any
  ];
  const corporateDisplaySections = corporateIdentitySections.length ? corporateIdentitySections : fallbackCorporateSections;
  const mainCorporate = corporateDisplaySections.find((s) => s.layout === "SPLIT" || s.layout === "BANNER" || s.layout === "MINIMAL" || (s.title || "").toLocaleLowerCase("tr-TR").includes("ana") || (s.title || "").toLocaleLowerCase("tr-TR").includes("hakkımızda") || (s.title || "").toLocaleLowerCase("tr-TR").includes("hakkimizda")) || corporateDisplaySections[0];

  const newsItems = newsSections.slice(0, 8).map((item) => {
    const image = firstSlide(item);
    return {
      id: item.id,
      title: item.title,
      body: item.body,
      badge: item.badge,
      href: item.href || `/haberler/${item.id}`,
      buttonLabel: item.buttonLabel,
      date: formatDate((item as any).createdAt),
      image: image && !isVideoSrc(image.src) ? image : null
    };
  });

  const activityShowcaseItems = activities.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    body: item.body,
    badge: item.badge,
    href: item.href || `/faaliyetler/${item.id}`,
    buttonLabel: item.buttonLabel,
    titleSize: item.titleSize,
    subtitleSize: item.subtitleSize,
    bodySize: item.bodySize,
    titleColor: item.titleColor,
    subtitleColor: item.subtitleColor,
    bodyColor: item.bodyColor,
    textAlign: item.textAlign,
    slides: sectionSlides(item)
  }));

  const featuredCampaigns = campaigns.slice(0, 6);
  const videoMediaItems = sectionMediaItems(videos);
  const galleryMediaItems = sectionMediaItems(gallery).filter((item) => item.slide);
  const statsSection = sections.find((section) => section.type === "CUSTOM" && section.customTitle === "Bugüne Kadar");
  const parsedStats = statsSection?.body?.split("\n").map((line) => line.split("|")).filter((parts) => parts.length === 2) || [];
  const stats = parsedStats.length > 0 ? parsedStats : [["12.450+", "Ulaşılan aile"], ["7/24", "Online bağış"], ["%100", "Kayıtlı süreç"], ["Güvenli", "Başvuru takibi"]];
  const impacts = parseDonationImpacts(settings.donationImpacts);
  const stepsImage = galleryMediaItems.find((item) => item.slide && !isVideoSrc(item.slide.src))?.slide || firstSlide(mainCorporate);

  const donationShortcuts = shortcutSections.map((item) => ({
    id: item.id,
    label: sectionText((item.title || "").replace(/Kısayolu|Kisayolu/gi, "").trim(), item.body || "Bağış"),
    href: item.href || "/bagis",
    image: firstSlide(item)
  }));

  const quickDonationCard = (
    <QuickDonationCard
      donationTypes={donationTypes}
      title={quickDonation?.title || "Hızlı Bağış"}
      subtitle={quickDonation?.subtitle || "1 dakikada güvenle tamamlayın"}
      buttonLabel={quickDonation?.buttonLabel || "Bağış Yap"}
      impacts={impacts}
      sidePanel
    />
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-white font-montserrat text-hayat-ink selection:bg-hayat-blue selection:text-white">
      <HomePopup popup={popup ? { id: popup.id, title: popup.title, content: popup.content, imageUrl: normalizeMediaUrl(popup.imageUrl) || popup.imageUrl, imageAlt: popup.imageAlt, buttonLabel: popup.buttonLabel, buttonUrl: popup.buttonUrl, showOnce: popup.showOnce, delaySeconds: popup.delaySeconds } : null} />
      <Header />

      <main>
        {/* 1. GIRIS: Haberler + Hizli Bagis */}
        <section className="border-b border-[#e6edf2] bg-[#f6f8f4]">
          <Container className="grid items-stretch gap-5 py-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]">
            {newsItems.length > 0 ? (
              <NewsHeroSlider items={newsItems} />
            ) : (
              <div className="flex flex-col justify-center rounded-3xl bg-white p-7 sm:p-10">
                <p className="w-fit rounded-full bg-[#e4efd8] px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-[#2f5f10]">{heroSection?.badge || "Hayat Ağacı Derneği"}</p>
                <h1 className="mt-5 font-jakarta text-[34px] font-extrabold leading-[1.08] text-hayat-dark sm:text-[52px]">{heroSection?.title || "Bir bağış, bir ailenin bugününü değiştirir."}</h1>
                {heroSection?.body && <p className="mt-4 max-w-xl text-lg leading-8 text-[#44575f]">{heroSection.body}</p>}
              </div>
            )}
            {quickDonationCard}
          </Container>
        </section>

        {/* 2. FAALIYETLER + SON DUYURULAR */}
        {(activityShowcaseItems.length > 0 || announcements.length > 0) && (
          <section id="faaliyetler" className="bg-white py-12">
            <Container>
              <SectionHeading eyebrow="Bağışlarınızla yaptıklarımız" title={activitiesTitle} href="/faaliyetler" linkLabel="Tüm faaliyetler" />
              <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
                {activityShowcaseItems.length > 0 ? (
                  <ActivityShowcaseSlider items={activityShowcaseItems} splitMedia compactMedia reducedMedia blurMediaFill />
                ) : (
                  <div className="hidden lg:block" />
                )}
                <aside className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-[#e3eaef] bg-white lg:max-h-[482px]">
                  <div className="flex items-center justify-between gap-3 bg-hayat-dark px-5 py-4 text-white">
                    <h3 className="flex items-center gap-2 font-jakarta text-lg font-extrabold"><Megaphone size={19} /> Son Duyurular</h3>
                  </div>
                  {announcements.length > 0 ? (
                    <div className="min-h-0 flex-1 divide-y divide-[#eef2f5] overflow-y-auto">
                      {announcements.map((item) => (
                        <Link key={item.id} href={`/duyurular/${item.id}`} className="block px-5 py-4 transition hover:bg-[#f7fafc]">
                          <div className="flex items-center justify-between gap-2 text-xs font-black">
                            <span className={`rounded-full px-2.5 py-1 ${item.type === "ACIL" ? "bg-red-50 text-red-700" : "bg-[#eaf3df] text-[#2f5f10]"}`}>{announcementLabel(item.type)}</span>
                            <span className="inline-flex items-center gap-1 text-[#6a7c86]"><CalendarDays size={12} /> {new Date(item.createdAt).toLocaleDateString("tr-TR")}</span>
                          </div>
                          <p className="mt-2 font-extrabold leading-snug text-hayat-dark">{item.title}</p>
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#52646d]">{item.content}</p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                      <Megaphone className="text-[#3f7d17]" size={30} />
                      <p className="mt-3 font-black text-hayat-dark">Henüz aktif duyuru yok</p>
                    </div>
                  )}
                </aside>
              </div>
            </Container>
          </section>
        )}

        {/* 3. AKTIF KAMPANYALAR / PROJELER */}
        {featuredCampaigns.length > 0 && (
          <section id="projeler" className="border-t border-[#e6edf2] bg-[#f6f8f4] py-12">
            <Container>
              <SectionHeading eyebrow="Şu an destek bekleyenler" title={campaignsTitle} href="/projeler" linkLabel="Tüm projeler" />
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {featuredCampaigns.map((item) => {
                  const image = firstSlide(item);
                  const goal = item.goalValue && item.goalValue > 0 ? item.goalValue : null;
                  const current = Math.max(0, item.currentValue || 0);
                  const percent = goal ? Math.min(100, Math.round((current / goal) * 100)) : 0;
                  const unit = item.goalUnit ? ` ${item.goalUnit}` : "";
                  return (
                    <article key={item.id} className="flex flex-col overflow-hidden rounded-[20px] border border-[#e3eaef] bg-white shadow-[0_14px_34px_rgba(10,58,85,0.07)]">
                      <div className="relative h-[220px] bg-[#eef3f6]">
                        {image && !isVideoSrc(image.src) ? (
                          <img src={optimizedImageSrc(image.src, 828)} alt={image.alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-hayat-blue/40"><ImageIcon size={44} /></div>
                        )}
                        {item.badge && <span className="absolute left-3.5 top-3.5 rounded-full bg-[#b42318] px-3 py-1.5 text-xs font-black text-white">{item.badge}</span>}
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
                        {item.subtitle && <p className="text-xs font-black uppercase tracking-[0.1em] text-[#3f7d17]">{item.subtitle}</p>}
                        <h3 className="font-jakarta text-[22px] font-extrabold leading-tight text-hayat-dark">{item.title}</h3>
                        {item.body && <ExpandableText title={item.title} text={item.body} className="line-clamp-3 text-[15px] leading-7 text-[#52646d]" />}
                        {goal && (
                          <div className="mt-auto pt-1">
                            <div className="flex justify-between gap-3 text-sm font-black text-[#1f3440]">
                              <span>{formatNumber(current)}{unit}</span>
                              <span className="text-[#5b6e78]">Hedef: {formatNumber(goal)}{unit}</span>
                            </div>
                            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#e8eef2]" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.title} ilerleme`}>
                              <div className="h-full rounded-full bg-[#3f7d17]" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        )}
                        <Link href={item.href || `/projeler/${item.id}`} className={`${goal ? "mt-2" : "mt-auto"} flex h-12 items-center justify-center gap-2 rounded-xl bg-hayat-dark font-black text-white transition hover:bg-[#3f7d17]`}>
                          {item.buttonLabel || "Destek Ol"} <ArrowRight size={16} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Container>
          </section>
        )}

        {/* 4. BAGIS ALANLARI (kisayollar) */}
        {donationShortcuts.length > 0 && (
          <section className="bg-white py-12">
            <Container>
              <SectionHeading eyebrow="Bağış alanları" title="Desteğiniz nereye ulaşsın?" href="/bagis" linkLabel="Online bağış" />
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
                {donationShortcuts.map((item) => (
                  <Link key={item.id} href={item.href} className="group overflow-hidden rounded-[18px] border border-[#e3eaef] bg-white transition hover:-translate-y-0.5 hover:border-[#3f7d17] hover:shadow-[0_14px_30px_rgba(10,58,85,0.1)]">
                    {item.image && !isVideoSrc(item.image.src) ? (
                      <img src={optimizedImageSrc(item.image.src, 640)} alt="" loading="lazy" decoding="async" className="h-28 w-full object-cover sm:h-32" />
                    ) : (
                      <div className="grid h-28 place-items-center bg-[#f1f7ea] text-[#3f7d17] sm:h-32"><HandHeart size={34} /></div>
                    )}
                    <div className="flex items-center justify-between gap-2 px-4 py-3.5 font-extrabold text-hayat-dark">
                      <span className="min-w-0 truncate">{item.label}</span>
                      <ChevronRight size={18} className="shrink-0 text-[#3f7d17] transition group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* 5. VIDEO BLOG */}
        {videoMediaItems.length > 0 && (
          <section id="video" className="bg-[#082f45] py-12 text-white">
            <Container>
              <SectionHeading dark eyebrow="Video Blog" title={videosTitle} href="/video" linkLabel="Tüm videolar" />
              {/* Sabit yukseklik: dikey (telefon) videolar alani uzatmaz, kutuya sigacak sekilde kirpilir. */}
              <div className={`grid gap-4 ${videoMediaItems.length > 1 ? "lg:h-[440px] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:grid-rows-2" : ""}`}>
                {videoMediaItems.slice(0, 3).map((item, index) => (
                  <article key={item.id} className={`group relative aspect-video overflow-hidden rounded-[20px] bg-black ${videoMediaItems.length > 1 ? "lg:aspect-auto lg:h-full" : "lg:mx-auto lg:h-[440px] lg:w-auto"} ${index === 0 || videoMediaItems.length === 2 ? "lg:row-span-2" : ""}`}>
                    <MediaLightboxTile src={item.slide?.src} alt={mediaItemTitle(item, "Video")} isVideo={isVideoSrc(item.slide?.src)} className="h-full w-full object-cover" videoClassName="h-full w-full bg-black object-cover" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent p-4 pt-14 sm:p-5">
                      <PlayCircle size={index === 0 ? 30 : 24} className="shrink-0 text-white" />
                      <p className={`line-clamp-2 font-extrabold leading-tight ${index === 0 ? "text-xl sm:text-2xl" : "text-base"}`}>{mediaItemTitle(item, "Video")}</p>
                    </div>
                  </article>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* 6. GALERI */}
        {galleryMediaItems.length > 0 && (
          <section id="galeri" className="bg-white py-12">
            <Container>
              <SectionHeading eyebrow="Galeri" title={galleryTitle} href="/galeri" linkLabel="Tüm galeri" />
              <div className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[180px] md:grid-cols-4">
                {galleryMediaItems.slice(0, 5).map((item, index) => (
                  <div key={item.id} className={`overflow-hidden rounded-[18px] bg-[#eef3f6] ${index === 0 ? "col-span-2 row-span-2" : ""}`}>
                    <MediaLightboxTile src={item.slide?.src} alt={mediaItemTitle(item, "Galeri")} isVideo={isVideoSrc(item.slide?.src)} className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" videoClassName="h-full w-full bg-black object-cover" sizes={index === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"} />
                  </div>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* 7. BLOG YAZILARI + IYILIK HIKAYELERI */}
        {(blogs.length > 0 || stories.length > 0) && (
          <section className="border-t border-[#e6edf2] bg-[#f6f8f4] py-12">
            <Container className={`grid gap-10 ${blogs.length > 0 && stories.length > 0 ? "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : ""}`}>
              {blogs.length > 0 && (
                <div id="blog" className="min-w-0">
                  <SectionHeading eyebrow="Blog" title={blogsTitle} />
                  <div className={`grid gap-4 ${stories.length > 0 ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
                    {blogs.slice(0, stories.length > 0 ? 2 : 3).map((item) => {
                      const image = firstSlide(item);
                      return (
                        <ExpandableCard key={item.id} title={item.title} subtitle={item.subtitle} body={item.body} imageUrl={image?.src} imageAlt={image?.alt} label="Blog" className="cursor-zoom-in overflow-hidden rounded-[18px] border border-[#e3eaef] bg-white text-left transition hover:shadow-[0_14px_30px_rgba(10,58,85,0.1)]">
                          {image && !isVideoSrc(image.src) && <img src={optimizedImageSrc(image.src, 640)} alt="" loading="lazy" decoding="async" className="h-40 w-full object-cover" />}
                          <div className="p-5">
                            {formatDate((item as any).createdAt) && <p className="text-xs font-black text-[#6a7c86]">{formatDate((item as any).createdAt)}</p>}
                            <h3 className="mt-1.5 text-lg font-extrabold leading-snug text-hayat-dark">{item.title}</h3>
                            {item.body && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#52646d]">{item.body}</p>}
                          </div>
                        </ExpandableCard>
                      );
                    })}
                  </div>
                </div>
              )}
              {stories.length > 0 && (
                <div id="hikayeler" className="min-w-0">
                  <SectionHeading eyebrow="Hikâyeler" title={storiesTitle} />
                  <div className="grid gap-4">
                    {stories.slice(0, 3).map((item) => (
                      <figure key={item.id} className="rounded-[18px] border border-[#e3eaef] bg-white p-5">
                        <Quote size={26} className="text-[#3f7d17]" aria-hidden="true" />
                        <ExpandableText title={item.title} text={item.body || item.title} className="mt-2 line-clamp-4 text-[15px] font-semibold leading-7 text-[#1f3440]" />
                        <figcaption className="mt-3 text-sm font-black text-[#5b6e78]">{item.subtitle || item.title}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}
            </Container>
          </section>
        )}

        {/* 8. OZEL ALANLAR */}
        {customs.length > 0 && (
          <section id="ozel-alanlar" className="bg-white py-12">
            <Container>
              <SectionHeading eyebrow="Özel Alanlar" title={customsTitle} />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {customs.map((item) => {
                  const image = firstSlide(item);
                  return (
                    <ExpandableCard key={item.id} title={item.title} subtitle={item.subtitle} body={item.body} imageUrl={image?.src} imageAlt={image?.alt} label={item.badge || "Özel"} className="cursor-zoom-in overflow-hidden rounded-[18px] border border-[#e3eaef] bg-white text-left transition hover:shadow-[0_14px_30px_rgba(10,58,85,0.1)]">
                      <div className="flex items-center gap-4 p-4">
                        {image && !isVideoSrc(image.src) ? (
                          <img src={optimizedImageSrc(image.src, 256)} alt="" loading="lazy" decoding="async" className="h-24 w-24 shrink-0 rounded-[14px] object-cover" />
                        ) : (
                          <span className="grid h-24 w-24 shrink-0 place-items-center rounded-[14px] bg-[#f1f7ea] text-[#3f7d17]"><HandHeart size={30} /></span>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-lg font-extrabold leading-snug text-hayat-dark">{item.title}</h3>
                          {item.body && <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#52646d]">{item.body}</p>}
                          {item.buttonLabel && <Link href={item.href || "/"} className="mt-2 inline-flex text-sm font-black text-[#0c5e8a]">{item.buttonLabel} →</Link>}
                        </div>
                      </div>
                    </ExpandableCard>
                  );
                })}
              </div>
            </Container>
          </section>
        )}

        {/* 9. BAGISINIZ NASIL ULASIR */}
        <section className="border-t border-[#e6edf2] bg-white py-12">
          <Container className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#3f7d17]">Şeffaflık</p>
              <h2 className="mt-2 font-jakarta text-[28px] font-extrabold leading-tight text-hayat-dark sm:text-[36px]">Bağışınız ihtiyaç sahibine nasıl ulaşır?</h2>
              <ol className="mt-6 grid gap-5">
                {[
                  ["Bağışınız kayda alınır", "Ödeme biter bitmez numaralı bağış makbuzunuzu siteden görüntüleyip indirebilirsiniz."],
                  ["İhtiyaç yerinde tespit edilir", "Başvurular ekibimizce incelenir ve yerinde doğrulanır."],
                  ["Teslim edilir, raporlanır", "Yardım teslim edilir; faaliyetler haber ve galeri sayfalarında paylaşılır."]
                ].map(([title, text], index) => (
                  <li key={title} className="flex gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-hayat-dark text-lg font-black text-white">{index + 1}</span>
                    <div>
                      <p className="text-lg font-extrabold text-hayat-dark">{title}</p>
                      <p className="mt-1 text-[15px] leading-7 text-[#52646d]">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            {stepsImage && !isVideoSrc(stepsImage.src) && (
              <img src={optimizedImageSrc(stepsImage.src, 1080)} alt={stepsImage.alt} loading="lazy" decoding="async" className="h-[300px] w-full rounded-3xl object-cover sm:h-[400px]" />
            )}
          </Container>
        </section>

        {/* 10. KURUMSAL GUVEN (eski gorunum) */}
        <section id="kurumsal" className="border-t border-[#e6edf2] bg-white py-12" style={{ backgroundColor: mainCorporate?.backgroundColor || "#ffffff" }}>
          <div className={`mx-auto px-3 sm:px-4 lg:px-4 ${mainCorporate?.contentWidth === "full" ? "w-full max-w-none" : "w-full max-w-[1840px]"}`}>
            <div className="grid items-stretch gap-7 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
              <div className="relative min-h-[360px] overflow-hidden rounded-[24px] border border-[#dbe6ee] bg-hayat-soft shadow-[0_24px_70px_rgba(10,58,85,0.12)] lg:min-h-[480px]" style={{ borderColor: mainCorporate?.borderColor || undefined }}>
                <HeroImageSlider images={sectionSlides(mainCorporate, undefined, corporateTitle)} className="h-full w-full rounded-[24px]" showOverlay fitToParent />
                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/92 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-hayat-green shadow-sm">
                  <ShieldCheck size={15} /> Kurumsal Güven
                </div>
              </div>

              <div className="flex flex-col justify-center rounded-[24px] border border-[#dbe6ee] bg-[#f8fbfd] p-6 shadow-[0_18px_50px_rgba(10,58,85,0.08)] sm:p-8 lg:p-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-hayat-mint text-hayat-green shadow-sm">
                  <ShieldCheck size={34} />
                </div>
                <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-hayat-green">Dayanışmayla Büyüyoruz</p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-[#1f3444] sm:text-4xl md:text-6xl" style={headingStyle(mainCorporate, "#1f3444", 58)}>{corporateTitle}</h2>
                {mainCorporate?.body && (
                  <div className="mt-5 max-w-4xl">
                    {/* Uzun kurumsal metin karti uzatmasin: 6 satir, tamami tiklayinca acilir. */}
                    <ExpandableText title={corporateTitle} text={mainCorporate.body} className="line-clamp-6 text-base font-semibold leading-8 text-[#607081] sm:text-lg sm:leading-9" style={bodyStyle(mainCorporate)} />
                  </div>
                )}

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {["Şeffaf Süreç", "Yerel Dayanışma", "Güvenli Takip"].map((label) => (
                    <div key={label} className="rounded-[16px] border border-[#dbe6ee] bg-white px-4 py-4 shadow-sm">
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-hayat-mint text-hayat-green">
                        <ShieldCheck size={18} />
                      </div>
                      <p className="text-sm font-black text-[#1f3444]">{label}</p>
                    </div>
                  ))}
                </div>

                {(mainCorporate?.buttonLabel || mainCorporate?.secondaryButtonLabel) && (
                  <div className="mt-7 flex flex-wrap gap-3">
                    {mainCorporate.buttonLabel && <Link href={mainCorporate.href || "/kurumsal"} className="inline-flex h-[52px] items-center justify-center rounded-[14px] bg-hayat-green px-7 text-sm font-black text-white shadow-green transition hover:-translate-y-0.5 hover:bg-hayat-dark">{mainCorporate.buttonLabel}</Link>}
                    {mainCorporate.secondaryButtonLabel && <Link href={mainCorporate.secondaryHref || "/iletisim"} className="inline-flex h-[52px] items-center justify-center rounded-[14px] border border-[#d9e4ec] bg-white px-7 text-sm font-black text-hayat-dark shadow-sm transition hover:-translate-y-0.5 hover:border-hayat-green hover:text-hayat-green">{mainCorporate.secondaryButtonLabel}</Link>}
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* 11. SON CAGRI */}
        <section className="bg-[#3f7d17] text-white">
          <Container className="flex flex-col gap-5 py-10 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h2 className="font-jakarta text-[28px] font-extrabold leading-tight sm:text-[36px]">{cta?.title || "Bugün bir iyiliğe ortak olun."}</h2>
              <p className="mt-2 text-[17px] font-semibold text-[#e3f0d6]">{cta?.body || "Küçük ya da büyük, her bağış bir ailenin yükünü hafifletir."}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={cta?.href || "/bagis"} className="inline-flex h-14 items-center rounded-xl bg-white px-7 text-[17px] font-black text-[#2f5f10] transition hover:bg-hayat-dark hover:text-white">{cta?.buttonLabel || "Online Bağış Yap"}</Link>
              <Link href={cta?.secondaryHref || "/hesap-numaralarimiz"} className="inline-flex h-14 items-center rounded-xl border-2 border-white/75 px-7 text-[17px] font-black text-white transition hover:bg-white hover:text-[#2f5f10]">{cta?.secondaryButtonLabel || "Hesap Numaraları"}</Link>
            </div>
          </Container>
        </section>

        {/* 12. RAKAMLAR (Etki Ozeti) */}
        <section className="bg-hayat-dark text-white">
          <Container className="grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
            {stats.map(([value, label]) => (
              <div key={label} className="border-l-[3px] border-hayat-green pl-4">
                <b className="block font-jakarta text-[30px] font-extrabold leading-none sm:text-[40px]">{value}</b>
                <span className="mt-2 block text-sm font-bold text-[#b9cfdc]">{label}</span>
              </div>
            ))}
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}
