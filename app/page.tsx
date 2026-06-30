﻿import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HomePopup } from "@/components/HomePopup";
import { ExpandableCard } from "@/components/ExpandableCard";
import { HeroImageSlider } from "@/components/HeroImageSlider";
import { ExpandableText } from "@/components/ExpandableText";
import { AutoScrollRow } from "@/components/AutoScrollRow";
import { ActivityShowcaseSlider } from "@/components/ActivityShowcaseSlider";
import { MediaLightboxTile } from "@/components/MediaLightboxTile";
import { QuickDonationCard } from "@/components/QuickDonationCard";
import { getHomeSections, allByType, firstByType } from "@/lib/site-content";
import { getActiveDonationTypes } from "@/lib/donation-types";
import { normalizeMediaUrl } from "@/lib/media-url";
import { prisma } from "@/lib/prisma";
import { ArrowRight, CalendarDays, Camera, ChevronRight, ImageIcon, Megaphone, PlayCircle, ShieldCheck, Video } from "lucide-react";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SectionSlide = {
  src: string;
  alt: string;
};

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

function safeAlign(value?: string | null): CSSProperties["textAlign"] {
  return value === "center" || value === "right" || value === "justify" ? value : "left";
}
function headingStyle(section: any, fallbackColor = "#1f3444", fallbackSize = 32): CSSProperties {
  return { color: section?.titleColor || fallbackColor, fontSize: `${section?.titleSize || fallbackSize}px`, textAlign: safeAlign(section?.textAlign) };
}
function subtitleStyle(section: any, fallbackColor = "#6FB744", fallbackSize = 14): CSSProperties {
  return { color: section?.subtitleColor || fallbackColor, fontSize: `${section?.subtitleSize || fallbackSize}px`, textAlign: safeAlign(section?.textAlign) };
}
function bodyStyle(section: any, fallbackColor = "#607081", fallbackSize = 16): CSSProperties {
  return { color: section?.bodyColor || fallbackColor, fontSize: `${section?.bodySize || fallbackSize}px`, textAlign: safeAlign(section?.textAlign), whiteSpace: "pre-line" };
}
function sectionStyle(section: any, fallbackPaddingY = 56): CSSProperties {
  const paddingY = Math.min(section?.paddingY ?? fallbackPaddingY, 24);
  return { paddingTop: `${paddingY}px`, paddingBottom: `${paddingY}px` };
}
function cardStyle(section: any, defaults: CSSProperties = {}): CSSProperties {
  const style: CSSProperties = { ...defaults };
  if (section?.cardPadding !== undefined && section?.cardPadding !== null) style.padding = `${section.cardPadding}px`;
  if (section?.minHeight) style.minHeight = `${section.minHeight}px`;
  if (section?.marginTop) style.marginTop = `${section.marginTop}px`;
  if (section?.marginBottom) style.marginBottom = `${section.marginBottom}px`;
  if (section?.borderRadius !== undefined && section?.borderRadius !== null) style.borderRadius = `${section.borderRadius}px`;
  if (section?.borderColor) { style.borderColor = section.borderColor; style.borderWidth = "1px"; }
  if (section?.backgroundColor) style.backgroundColor = section.backgroundColor;
  return style;
}

function cardWidthClass(section: any) {
  const value = section?.cardWidth || "normal";
  if (value === "third") return "w-[85vw] sm:w-[calc(50vw-28px)] lg:w-[calc((1320px-48px)/3)]";
  if (value === "half") return "w-[85vw] sm:w-[calc(50vw-28px)] lg:w-[calc((1320px-24px)/2)]";
  if (value === "wide") return "w-[85vw] sm:w-[calc(66vw-28px)] lg:w-[520px]";
  if (value === "full") return "w-[85vw] sm:w-[calc(100vw-64px)] lg:w-[1320px]";
  return "w-[85vw] sm:w-[calc(50vw-28px)] lg:w-[360px]";
}

export default async function HomePage() {
  const now = new Date();
  const [sections, groupLabels, donationTypes, announcements, popup] = await Promise.all([
    getHomeSections(),
    prisma.sectionGroupLabel.findMany(),
    getActiveDonationTypes(),
    prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }]
      },
      orderBy: [{ isPinned: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      take: 5
    }),
    prisma.popupSetting.findFirst({ where: { isActive: true }, orderBy: { updatedAt: "desc" } })
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
  const customs = allByType(sections, "CUSTOM").filter((s) => {
    const key = `${s.title} ${s.customTitle || ""}`.toLocaleLowerCase("tr-TR");
    return !s.id.startsWith("system-") && !isCorporateIdentitySection(s) && !key.includes("istatistik") && !key.includes("bugüne kadar") && !key.includes("bugune kadar");
  });

  const quickDonation = features.find((s) => {
    const key = `${s.title} ${s.customTitle || ""}`.toLocaleLowerCase("tr-TR");
    return key.includes("hızlı bağış") || key.includes("hizli bagis");
  });
  const shortcutSections = features.filter((s) => s.id !== quickDonation?.id);

  const activitiesTitle = getSectionTitle("ACTIVITY", activities, "Yardım Faaliyetleri");
  const campaignsTitle = "Projelerimiz";
  const videosTitle = getSectionTitle("VIDEO", videos, "Video Blog");
  const galleryTitle = getSectionTitle("GALLERY", gallery, "Sahadan Kareler");
  const blogsTitle = getSectionTitle("BLOG", blogs, "Blog Yazıları");
  const storiesTitle = getSectionTitle("STORY", stories, "İyilik Hikayeleri");
  const customsTitle = getSectionTitle("CUSTOM", customs, "Özel Alanlar");
  const corporateTitle = getSectionTitle("ABOUT", corporateIdentitySections, "Kurumsal Güven");

  const fallbackCorporateSections = [
    { id: "fallback-corp-main", title: corporateTitle, body: "Kurumsal bilgileriniz henüz eklenmedi.", type: "ABOUT", layout: "SPLIT", theme: "SOFT", sortOrder: 1 } as any
  ];
  const corporateDisplaySections = corporateIdentitySections.length ? corporateIdentitySections : fallbackCorporateSections;

  const mainCorporate = corporateDisplaySections.find(s => s.layout === "SPLIT" || s.layout === "BANNER" || s.layout === "MINIMAL" || (s.title || "").toLocaleLowerCase("tr-TR").includes("ana") || (s.title || "").toLocaleLowerCase("tr-TR").includes("hakkımızda") || (s.title || "").toLocaleLowerCase("tr-TR").includes("hakkimizda")) || corporateDisplaySections[0];

  const featuredCampaigns = campaigns.slice(0, 8);
  const heroNews = newsSections.slice(0, 8);
  const heroNewsLead = heroNews[0];
  const featuredGallery = gallery.slice(0, 6);
  const featuredVideos = videos.slice(0, 3);
  const galleryMediaItems = gallery.flatMap((section): { id: string; section: any; slide?: SectionSlide }[] => {
    const slides = sectionSlides(section);
    return slides.length
      ? slides.map((slide, index) => ({ id: `${section.id}-${index}`, section, slide }))
      : [{ id: `${section.id}-empty`, section, slide: undefined }];
  });
  const videoMediaItems = videos.flatMap((section): { id: string; section: any; slide?: SectionSlide }[] => {
    const slides = sectionSlides(section);
    return slides.length
      ? slides.map((slide, index) => ({ id: `${section.id}-${index}`, section, slide }))
      : [{ id: `${section.id}-empty`, section, slide: undefined }];
  });
  const activityItems = activities.slice(0, 8);
  const activityShowcaseItems = activityItems.map((item) => ({
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
  const heroNewsItems = heroNews.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    body: item.body,
    badge: item.badge,
    href: item.href || `/haberler/${item.id}`,
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

  const activityLead = activityItems[0];
  const campaignLead = featuredCampaigns[0];
  const videoLead = featuredVideos[0];
  const galleryLead = featuredGallery[0];
  const blogLead = blogs[0];
  const storyLead = stories[0];
  const customLead = customs[0];
  const statsSection = sections.find((section) => section.type === "CUSTOM" && section.customTitle === "Bugüne Kadar");

  const parsedStats = statsSection?.body?.split("\n").map(line => line.split("|")).filter(parts => parts.length === 2) || [];
  const stats = parsedStats.length > 0 ? parsedStats : [["12.450+", "Ulaşılan aile"], ["7/24", "Online bağış"], ["%100", "Kayıtlı süreç"], ["Güvenli", "Başvuru takibi"]];
  const shouldScrollProjects = featuredCampaigns.length > 5;
  const shouldScrollVideos = videoMediaItems.length > 5;
  const shouldScrollGallery = galleryMediaItems.length > 5;
  const shouldScrollBlogs = blogs.length > 5;
  const shouldScrollStories = stories.length > 5;
  const shouldScrollCustoms = customs.length > 5;

  const donationShortcuts = shortcutSections.map((item) => [
    sectionText((item.title || "").replace(/Kısayolu|Kisayolu/gi, "").trim(), item.body || "Bağış"),
    item.href || "/bagis"
  ]);
  const renderQuickDonation = (sidePanel = false) => (
    <QuickDonationCard
      donationTypes={donationTypes}
      title={quickDonation?.title || "Hızlı Bağış"}
      subtitle={quickDonation?.subtitle || "Bağış türünü ve tutarını seç, anında destek ol"}
      buttonLabel={quickDonation?.buttonLabel || "Şimdi Destek Ol"}
      sidePanel={sidePanel}
      className={`mx-auto ${quickDonation?.contentWidth === "full" && !sidePanel ? "w-full max-w-none" : sidePanel ? "w-full h-[calc(560px+4cm)] sm:h-[calc(600px+4cm)] lg:h-[calc(520px+4cm)]" : "max-w-[1840px]"}`}
      style={{ ...cardStyle(quickDonation, { padding: 24 }), backgroundColor: "#6fae2e", borderColor: "rgba(79, 138, 30, 0.35)", borderRadius: 20 }}
    />
  );
  const renderProjectCard = (item: any, scrolling: boolean) => {
    const image = firstSlide(item);
    const href = item.href || `/projeler/${item.id}`;
    const widthClass = scrolling ? "w-[min(86vw,430px)] shrink-0 snap-start" : "w-full";

    return (
      <ExpandableCard key={item.id} title={item.title} subtitle={item.subtitle} body={item.body} imageUrl={image?.src} imageAlt={image?.alt} label="Proje" className={`group ${widthClass} cursor-zoom-in overflow-hidden rounded-[24px] border border-[#dbe6ee] bg-white text-left shadow-[0_18px_46px_rgba(10,58,85,0.1)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(10,58,85,0.16)]`} style={cardStyle(item, { padding: "0px" })}>
        <div className="relative h-[290px] overflow-hidden bg-[linear-gradient(135deg,#e8f4fb,#f5fafc)]">
          {image ? (
            <img src={image.src} alt={image.alt} loading="lazy" decoding="async" className="h-full w-full bg-white object-cover transition duration-700 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-hayat-blue/50">
              <ImageIcon size={44} />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a3a55]/90 via-[#0a3a55]/30 to-transparent p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-hayat-blue shadow-sm">
                {item.badge || "Proje"}
              </span>
              {item.subtitle && (
                <span className="rounded-full bg-hayat-green px-3 py-1.5 text-[11px] font-black text-white shadow-sm">
                  {item.subtitle}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex min-h-[235px] flex-col p-5 sm:p-6">
          <h3 className="text-2xl font-black leading-tight text-hayat-dark" style={headingStyle(item, "#0a3a55", 26)}>{item.title}</h3>
          <div className="mt-4 flex-1">
            <ExpandableText title={item.title} text={item.body || ""} className="line-clamp-3 text-[15px] font-semibold leading-7 text-[#5d6b70]" style={bodyStyle(item, "#5d6b70", 15)} />
          </div>
          <Link href={href} className="mt-5 inline-flex h-12 w-fit items-center justify-center gap-2 rounded-[14px] bg-hayat-blue px-5 text-sm font-black text-white shadow-[0_14px_26px_rgba(25,151,207,0.2)] transition hover:-translate-y-0.5 hover:bg-hayat-green">
            Projeyi İncele <ArrowRight size={16} />
          </Link>
        </div>
      </ExpandableCard>
    );
  };
  const renderVideoCard = (item: { id: string; section: any; slide?: SectionSlide }, scrolling: boolean) => (
    <article key={item.id} className={`group relative aspect-video ${scrolling ? `shrink-0 snap-start ${cardWidthClass(item.section)}` : "w-full"} overflow-hidden rounded-[26px] border border-white/12 bg-[#06283b] shadow-[0_24px_70px_rgba(0,22,36,0.35)] ring-1 ring-white/10 transition hover:-translate-y-1 hover:border-hayat-green/60 hover:shadow-[0_30px_90px_rgba(0,22,36,0.48)]`} style={cardStyle(item.section, { padding: "0px" })}>
      <MediaLightboxTile src={item.slide?.src} alt={item.slide?.alt || item.section.title} isVideo={isVideoSrc(item.slide?.src)} className="h-full w-full bg-white object-contain" videoClassName="h-full w-full bg-black object-contain" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061f2e]/85 via-transparent to-[#061f2e]/20 opacity-90" />
      <div className="pointer-events-none absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-hayat-blue shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
        <Video size={14} /> Video Blog
      </div>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-hayat-blue shadow-[0_18px_42px_rgba(0,0,0,0.25)] transition duration-300 group-hover:scale-110 group-hover:bg-hayat-green group-hover:text-white">
          <PlayCircle size={34} />
        </span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
        <p className="line-clamp-2 max-w-[90%] text-lg font-black leading-tight text-white drop-shadow">{item.slide?.alt || item.section.title}</p>
      </div>
    </article>
  );
  const renderGalleryCard = (item: { id: string; section: any; slide?: SectionSlide }, scrolling: boolean) => (
    <article key={item.id} className={`group relative h-[270px] ${scrolling ? "w-[min(82vw,430px)] shrink-0 snap-start lg:w-[460px]" : "w-full"} overflow-hidden rounded-[26px] border border-[#dbe6ee] bg-white shadow-[0_20px_54px_rgba(10,58,85,0.12)] ring-1 ring-white transition hover:-translate-y-1 hover:border-hayat-blue/35 hover:shadow-[0_28px_72px_rgba(10,58,85,0.18)] sm:h-[330px]`} style={cardStyle(item.section, { padding: "0px" })}>
      <MediaLightboxTile src={item.slide?.src} alt={item.slide?.alt || item.section.title} isVideo={isVideoSrc(item.slide?.src)} className="h-full w-full bg-white object-cover transition duration-700 group-hover:scale-105" videoClassName="h-full w-full bg-black object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a3a55]/82 via-[#0a3a55]/12 to-transparent" />
      <div className="pointer-events-none absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-hayat-green shadow-[0_12px_28px_rgba(10,58,85,0.16)]">
        <Camera size={14} /> Sahadan
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
        <span className="inline-flex max-w-full rounded-full bg-white px-4 py-2 text-[12px] font-black text-hayat-blue shadow-[0_12px_30px_rgba(10,58,85,0.18)]">
          {item.slide?.alt || item.section.title}
        </span>
      </div>
    </article>
  );
  const renderContentCard = (item: any, label: string, scrolling: boolean) => (
    <ExpandableCard key={item.id} title={item.title} subtitle={item.subtitle} body={item.body} imageUrl={firstSlide(item)?.src} imageAlt={firstSlide(item)?.alt} label={label} className={`group ${scrolling ? `${cardWidthClass(item)} shrink-0 snap-start` : "w-full"} cursor-zoom-in overflow-hidden border border-[#e9eef2] bg-white shadow-stk transition hover:-translate-y-1 hover:shadow-stk-hover`} style={cardStyle(item, { padding: "0px" })}>
      {firstSlide(item, undefined) && (
        <div className="h-64 overflow-hidden bg-hayat-soft">
          <HeroImageSlider images={sectionSlides(item, undefined, item.title)} className="relative h-full w-full overflow-hidden bg-hayat-soft" showOverlay={false} fitToParent />
        </div>
      )}
      <div className="p-7">
        <h3 className="mb-4 text-2xl font-black leading-tight text-[#1f3444]" style={headingStyle(item, "#1f3444", 24)}>{item.title}</h3>
        <div className="mt-2 min-h-[80px]">
          <ExpandableText title={item.title} text={item.body} className="text-sm font-semibold leading-8 text-[#607081]" style={bodyStyle(item, "#607081", 14)} />
        </div>
        {(item.buttonLabel || item.secondaryButtonLabel) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {item.buttonLabel && <Link href={item.href || "/"} className="inline-flex h-12 items-center justify-center rounded-md bg-hayat-blue text-xs font-black uppercase tracking-widest text-white transition hover:bg-hayat-blueDark">{item.buttonLabel}</Link>}
            {item.secondaryButtonLabel && <Link href={item.secondaryHref || "/"} className="inline-flex h-12 items-center justify-center rounded-md border-2 border-[#dfe7ed] text-xs font-black uppercase tracking-widest text-[#1f3444] transition hover:border-hayat-green hover:text-hayat-green">{item.secondaryButtonLabel}</Link>}
          </div>
        )}
      </div>
    </ExpandableCard>
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-hayat-soft font-montserrat text-hayat-ink selection:bg-hayat-blue selection:text-white">
      <HomePopup popup={popup ? { id: popup.id, title: popup.title, content: popup.content, imageUrl: normalizeMediaUrl(popup.imageUrl) || popup.imageUrl, imageAlt: popup.imageAlt, buttonLabel: popup.buttonLabel, buttonUrl: popup.buttonUrl, showOnce: popup.showOnce, delaySeconds: popup.delaySeconds } : null} />
      <Header />
      
      <main>
        {/* 1. NEWS WELCOME */}
        {heroNewsItems.length > 0 && (
          <section className="relative overflow-hidden border-b border-[#d5e4ec]" style={{ backgroundColor: heroNewsLead?.backgroundColor || "#eef5f8", paddingTop: `${heroNewsLead?.paddingY || 0}px`, paddingBottom: `${heroNewsLead?.paddingY || 0}px` }}>
            <div className={`mx-auto grid ${heroNewsLead?.contentWidth === "full" ? "w-full max-w-none" : "max-w-[1840px]"} items-stretch gap-4 px-3 py-1 sm:px-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-4 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_430px]`}>
              <div className="min-w-0">
                <ActivityShowcaseSlider items={heroNewsItems} defaultHref="/haberler" defaultButtonLabel="Haberi İncele" dotLabel="haber" showDefaultButton splitMedia compactMedia extendedMedia mediaFirst mediaWide mediaExtraWidth showFullMedia />
              </div>
              {renderQuickDonation(true)}
            </div>
          </section>
        )}

        {/* 2. QUICK DONATION FALLBACK */}
        {heroNewsItems.length === 0 && (
          <section className="quick-donation-section px-3 sm:px-4 lg:px-4" style={{ backgroundColor: quickDonation?.backgroundColor || "#eef5f8", paddingTop: 12, paddingBottom: 12 }}>
            {renderQuickDonation()}
          </section>
        )}

        {/* 3. DONATION SHORTCUTS */}
        {donationShortcuts.length > 0 && (
          <section className="px-3 py-3 sm:px-4 lg:px-4" style={{ backgroundColor: shortcutSections[0]?.backgroundColor || "#ffffff" }}>
            <div className={`mx-auto grid ${shortcutSections[0]?.contentWidth === "full" ? "w-full max-w-none" : "max-w-[1840px]"} gap-4 md:grid-cols-5`}>
              {donationShortcuts.map(([label, href], index) => {
                const source = shortcutSections[index];
                return (
                <Link key={label} href={href} className="group flex min-h-24 items-center justify-between rounded-lg border border-[#e9eef2] bg-white px-5 text-sm font-black text-[#1f3444] shadow-stk transition hover:-translate-y-1 hover:border-hayat-green hover:text-hayat-green" style={source ? cardStyle(source) : undefined}>
                  {label}
                  <ChevronRight size={18} className="transition group-hover:translate-x-1" />
                </Link>
              )})}
            </div>
          </section>
        )}

        {/* 4. ACTIVITIES */}
        {activityItems.length > 0 && (
          <section id="faaliyetler" className="px-3 sm:px-4 lg:px-4" style={{ backgroundColor: activityLead?.backgroundColor || "#f5f9fb", paddingTop: 16, paddingBottom: 24 }}>
            <div className={`mx-auto ${activityLead?.contentWidth === "full" ? "w-full max-w-none" : "max-w-[1840px]"}`}>
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="mt-1 text-3xl font-black tracking-tight text-[#1f3444] sm:text-4xl md:text-6xl" style={activityLead ? headingStyle(activityLead, "#1f3444", 56) : undefined}>{activitiesTitle}</h2>
                </div>
                <Link href="/faaliyetler" className="inline-flex w-fit items-center gap-2 rounded-md border-2 border-[#dfe7ed] bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-[#1f3444] transition hover:border-hayat-green hover:text-hayat-green">
                  Tüm Faaliyetler <ArrowRight size={16} />
                </Link>
              </div>
              <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_440px] 2xl:grid-cols-[minmax(0,1fr)_480px]">
                <ActivityShowcaseSlider items={activityShowcaseItems} splitMedia compactMedia reducedMedia blurMediaFill />
                <aside className="flex h-[522px] min-h-0 flex-col overflow-hidden rounded-lg border border-[#dfe7ed] bg-white shadow-stk sm:h-[562px] lg:h-[482px]">
                <div className="flex items-center justify-between border-b border-[#e9eef2] bg-hayat-green px-5 py-4 text-white">
                  <div>
                    <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/80">
                      <Megaphone size={15} /> Duyurular
                    </p>
                    <h3 className="mt-1 text-2xl font-black leading-tight">Son Duyurular</h3>
                  </div>
                  <Link href="/haberler" className="hidden items-center gap-1 rounded-md bg-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-hayat-green sm:inline-flex">
                    Tümü <ArrowRight size={13} />
                  </Link>
                </div>
                <div className="announcement-scroll-window relative min-h-0 flex-1 overflow-hidden bg-[#f8fbfd] p-4">
                  {announcements.length > 0 ? (
                    <div className="announcement-scroll-track space-y-3">
                      {[...announcements, ...announcements].map((item, index) => (
                        <div key={`${item.id}-${index}`}>
                          <ExpandableCard title={item.title} subtitle={item.type} body={item.content} label={item.type === "ACIL" ? "Acil" : item.type === "KAMPANYA" ? "Kampanya" : item.type === "HABER" ? "Haber" : "Duyuru"} className="rounded-lg border border-[#e9eef2] bg-white p-0 shadow-sm">
                            <div className="p-4">
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <span className="rounded-md bg-hayat-mint px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-hayat-green">
                                  {item.type === "ACIL" ? "Acil" : item.type === "KAMPANYA" ? "Kampanya" : item.type === "HABER" ? "Haber" : "Duyuru"}
                                </span>
                                <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-black text-[#607081]">
                                  <CalendarDays size={12} /> {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                                </span>
                              </div>
                              <h4 className="text-base font-black leading-snug text-[#1f3444]">{item.title}</h4>
                              <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-[#607081]">{item.content}</p>
                              <div className="mt-3">
                                <Link href={`/duyurular/${item.id}`} className="text-xs font-black text-hayat-blue transition hover:text-hayat-green">Detay</Link>
                              </div>
                            </div>
                          </ExpandableCard>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-[#d5e4ec] bg-white p-6 text-center">
                      <Megaphone className="text-hayat-green" size={34} />
                      <p className="mt-3 font-black text-[#1f3444]">Henüz aktif duyuru yok</p>
                      <p className="mt-1 text-sm font-semibold text-[#607081]">Duyuru eklendiğinde burada görünecek.</p>
                    </div>
                  )}
                </div>
                </aside>
              </div>
            </div>
          </section>
        )}

        {/* 5. CAMPAIGNS */}
        {featuredCampaigns.length > 0 && (
          <section id="projeler" className="bg-white px-3 sm:px-4 lg:px-4" style={{ backgroundColor: campaignLead?.backgroundColor || "#ffffff", ...sectionStyle(campaignLead, 90) }}>
            <div className={`mx-auto ${campaignLead?.contentWidth === "full" ? "w-full max-w-none" : "max-w-[1840px]"}`}>
              <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-hayat-green">Devam Eden Destekler</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-[#1f3444] sm:text-4xl md:text-6xl" style={campaignLead ? headingStyle(campaignLead, "#1f3444", 56) : undefined}>{campaignsTitle}</h2>
                  <p className="mt-3 max-w-2xl text-base font-semibold leading-8 text-[#607081]">
                    İhtiyaç sahiplerine dokunan projelerimizi inceleyin, yürüyen destek çalışmalarına güvenle katkı sunun.
                  </p>
                </div>
                <Link href="/projeler" className="inline-flex h-12 w-fit items-center gap-2 rounded-[14px] border border-[#d9e4ec] bg-white px-5 text-xs font-black uppercase tracking-widest text-[#1f3444] shadow-stk transition hover:-translate-y-0.5 hover:border-hayat-green hover:text-hayat-green">
                  Tüm Projeler <ArrowRight size={16} />
                </Link>
              </div>
              {shouldScrollProjects ? (
                <AutoScrollRow animate setClassName="gap-5">
                  {featuredCampaigns.map((item) => renderProjectCard(item, true))}
                </AutoScrollRow>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                  {featuredCampaigns.map((item) => renderProjectCard(item, false))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 6. VIDEOS */}
        {videoMediaItems.length > 0 && (
          <section id="video" className="relative overflow-hidden border-y border-white/10 bg-[#082f45] px-3 text-white sm:px-4 lg:px-4" style={{ backgroundColor: videoLead?.backgroundColor || "#082f45", ...sectionStyle(videoLead, 96) }}>
            <div className={`mx-auto ${videoLead?.contentWidth === "full" ? "w-full max-w-none" : "max-w-[1840px]"}`}>
              <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#8addf8] ring-1 ring-white/12">
                    <Video size={16} /> Video Blog
                  </div>
                  <h2 className="mt-1 text-3xl font-black sm:text-4xl md:text-6xl" style={videoLead ? headingStyle(videoLead, "#ffffff", 56) : undefined}>{videosTitle}</h2>
                  <p className="mt-3 max-w-2xl text-base font-semibold leading-8 text-white/68">
                    Sahadaki çalışmalarımızı, ziyaretleri ve destek süreçlerini video akışıyla daha yakından izleyin.
                  </p>
                </div>
                <Link href={videoLead?.href || "/video"} className="inline-flex h-12 w-fit items-center gap-2 rounded-[14px] border border-white/15 bg-white/10 px-5 text-xs font-black uppercase tracking-widest text-white shadow-[0_14px_34px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:border-hayat-green hover:bg-hayat-green hover:text-white">
                  {videoLead?.buttonLabel || "Tüm Videolar"} <ArrowRight size={16} />
                </Link>
              </div>
              {shouldScrollVideos ? (
                <AutoScrollRow animate>
                  {videoMediaItems.map((item) => renderVideoCard(item, true))}
                </AutoScrollRow>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                  {videoMediaItems.map((item) => renderVideoCard(item, false))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 9. GALLERY */}
        {galleryMediaItems.length > 0 && (
          <section id="galeri" className="bg-[#f4f9fb] px-3 sm:px-4 lg:px-4" style={{ backgroundColor: galleryLead?.backgroundColor || "#f4f9fb", ...sectionStyle(galleryLead, 90) }}>
            <div className={`mx-auto ${galleryLead?.contentWidth === "full" ? "w-full max-w-none" : "max-w-[1840px]"}`}>
              <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-hayat-green shadow-[0_12px_28px_rgba(10,58,85,0.08)] ring-1 ring-[#dbe6ee]">
                    <Camera size={16} /> Sahadan Gelenler
                  </div>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-[#1f3444] sm:text-4xl md:text-6xl" style={galleryLead ? headingStyle(galleryLead, "#1f3444", 56) : undefined}>{galleryTitle}</h2>
                  <p className="mt-3 max-w-2xl text-base font-semibold leading-8 text-[#607081]">
                    Sahadan yansıyan çalışmalarımızı, ziyaretlerimizi ve destek süreçlerimizi tek bir görsel akışta keşfedin.
                  </p>
                </div>
                <Link href="/tum-resimler" className="inline-flex h-12 w-fit items-center gap-2 rounded-[14px] border border-[#d9e4ec] bg-white px-5 text-xs font-black uppercase tracking-widest text-[#1f3444] shadow-stk transition hover:-translate-y-0.5 hover:border-hayat-green hover:text-hayat-green">
                  Tüm Resimler <ArrowRight size={16} />
                </Link>
              </div>
              {shouldScrollGallery ? (
                <AutoScrollRow animate setClassName="gap-5">
                  {galleryMediaItems.map((item) => renderGalleryCard(item, true))}
                </AutoScrollRow>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                  {galleryMediaItems.map((item) => renderGalleryCard(item, false))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 10. BLOGS */}
        {blogs.length > 0 && (
          <section id="blog" className="px-3 sm:px-4 lg:px-4" style={{ backgroundColor: blogLead?.backgroundColor || "#f5f9fb", ...sectionStyle(blogLead, 96) }}>
            <div className={`mx-auto ${blogLead?.contentWidth === "full" ? "w-full max-w-none" : "max-w-[1840px]"}`}>
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="mt-1 text-3xl font-black tracking-tight text-[#1f3444] sm:text-4xl md:text-6xl" style={blogLead ? headingStyle(blogLead, "#1f3444", 56) : undefined}>{blogsTitle}</h2>
                </div>
                {blogLead?.buttonLabel && (
                  <Link href={blogLead.href || "/blog"} className="inline-flex w-fit items-center gap-2 rounded-md border-2 border-[#dfe7ed] px-6 py-3 text-xs font-black uppercase tracking-widest text-[#1f3444] transition hover:border-hayat-green hover:text-hayat-green">{blogLead.buttonLabel} <ArrowRight size={16} /></Link>
                )}
              </div>
              {shouldScrollBlogs ? (
                <AutoScrollRow animate setClassName="gap-7">
                  {blogs.map((item) => renderContentCard(item, "Blog", true))}
                </AutoScrollRow>
              ) : (
                <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                  {blogs.map((item) => renderContentCard(item, "Blog", false))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 11. STORIES */}
        {stories.length > 0 && (
          <section id="hikayeler" className="px-3 sm:px-4 lg:px-4" style={{ backgroundColor: storyLead?.backgroundColor || "#ffffff", ...sectionStyle(storyLead, 96) }}>
            <div className={`mx-auto ${storyLead?.contentWidth === "full" ? "w-full max-w-none" : "max-w-[1840px]"}`}>
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="mt-1 text-3xl font-black tracking-tight text-[#1f3444] sm:text-4xl md:text-6xl" style={storyLead ? headingStyle(storyLead, "#1f3444", 56) : undefined}>{storiesTitle}</h2>
                </div>
                {storyLead?.buttonLabel && (
                  <Link href={storyLead.href || "/hikayeler"} className="inline-flex w-fit items-center gap-2 rounded-md border-2 border-[#dfe7ed] px-6 py-3 text-xs font-black uppercase tracking-widest text-[#1f3444] transition hover:border-hayat-green hover:text-hayat-green">{storyLead.buttonLabel} <ArrowRight size={16} /></Link>
                )}
              </div>
              {shouldScrollStories ? (
                <AutoScrollRow animate setClassName="gap-7">
                  {stories.map((item) => renderContentCard(item, "Hikaye", true))}
                </AutoScrollRow>
              ) : (
                <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                  {stories.map((item) => renderContentCard(item, "Hikaye", false))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 12. CUSTOMS */}
        {customs.length > 0 && (
          <section id="ozel-alanlar" className="px-3 sm:px-4 lg:px-4" style={{ backgroundColor: customLead?.backgroundColor || "#f5f9fb", ...sectionStyle(customLead, 96) }}>
            <div className={`mx-auto ${customLead?.contentWidth === "full" ? "w-full max-w-none" : "max-w-[1840px]"}`}>
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="mt-1 text-3xl font-black tracking-tight text-[#1f3444] sm:text-4xl md:text-6xl" style={customLead ? headingStyle(customLead, "#1f3444", 56) : undefined}>{customsTitle}</h2>
                </div>
                {customLead?.buttonLabel && (
                  <Link href={customLead.href || "/"} className="inline-flex w-fit items-center gap-2 rounded-md border-2 border-[#dfe7ed] px-6 py-3 text-xs font-black uppercase tracking-widest text-[#1f3444] transition hover:border-hayat-green hover:text-hayat-green">{customLead.buttonLabel} <ArrowRight size={16} /></Link>
                )}
              </div>
              {shouldScrollCustoms ? (
                <AutoScrollRow animate setClassName="gap-7">
                  {customs.map((item) => renderContentCard(item, item.badge || "Özel", true))}
                </AutoScrollRow>
              ) : (
                <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                  {customs.map((item) => renderContentCard(item, item.badge || "Özel", false))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 13. CORPORATE */}
        <section id="kurumsal" className="bg-white px-3 sm:px-4 lg:px-4" style={{ backgroundColor: mainCorporate?.backgroundColor || "#ffffff", ...sectionStyle(mainCorporate, 90) }}>
          <div className={`mx-auto ${mainCorporate?.contentWidth === "full" ? "w-full max-w-none" : "max-w-[1840px]"}`}>
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
                <p className="mt-5 max-w-4xl text-base font-semibold leading-8 text-[#607081] sm:text-lg sm:leading-9" style={bodyStyle(mainCorporate)}>{mainCorporate?.body}</p>

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

        {/* 14. STATS */}
        {stats.length > 0 && (
          <section className="relative overflow-hidden bg-[#0b3f38] px-3 py-10 text-white sm:px-4 lg:px-4">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(111,183,68,0.95),rgba(17,92,75,0.96)_52%,rgba(7,52,72,0.98))]" />
            <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
            <div className="relative mx-auto flex w-full max-w-[1840px] flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 lg:max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Etki Özeti</p>
                <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl" style={statsSection ? headingStyle(statsSection, "#ffffff", 46) : undefined}>{statsSection?.title || "Desteklerinizle büyüyen iyilik ağı"}</h2>
                <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-white/75 md:text-base">
                  Bağış, başvuru ve sosyal destek süreçlerini şeffaf, izlenebilir ve güvenli biçimde büyütüyoruz.
                </p>
              </div>
              <div className="grid min-w-0 flex-1 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 lg:max-w-4xl">
                {stats.map(([value, label]) => (
                  <div key={label} className="min-w-0 rounded-[18px] border border-white/18 bg-white/10 p-5 shadow-[0_18px_38px_rgba(0,0,0,0.12)] backdrop-blur" style={statsSection ? cardStyle(statsSection, { padding: "20px" }) : undefined}>
                    <b className="block break-words text-3xl font-black leading-none lg:text-4xl">{value}</b>
                    <span className="mt-3 block text-[11px] font-black uppercase tracking-[0.18em] text-white/75">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 14. CTA */}
        {cta && (
          <section className="px-3 text-white sm:px-4 lg:px-4" style={{ backgroundColor: cta?.backgroundColor || "#102033", ...cardStyle(cta), ...sectionStyle(cta, 80) }}>
            <div className={`mx-auto flex ${cta?.contentWidth === "full" ? "w-full max-w-none" : "max-w-[1840px]"} flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
              <div>
                <h2 className="mt-1 max-w-4xl text-3xl font-black leading-tight sm:text-4xl md:text-6xl" style={headingStyle(cta, "#ffffff", 56)}>{cta.title}</h2>
                <p className="mt-2 max-w-3xl text-lg font-semibold leading-8 text-white/75" style={bodyStyle(cta, "rgba(255,255,255,.75)")}>{cta.body}</p>
              </div>
              <div className="flex w-full shrink-0 flex-wrap gap-3 md:w-auto md:gap-4">
                {cta.buttonLabel && <Link href={cta.href || "/bagis"} className="inline-flex h-14 w-full shrink-0 items-center justify-center gap-3 rounded-md bg-white px-6 text-xs font-black uppercase tracking-widest text-hayat-dark transition hover:bg-hayat-green hover:text-white sm:text-sm md:h-16 md:w-auto md:px-9">{cta.buttonLabel}</Link>}
                {cta.secondaryButtonLabel && <Link href={cta.secondaryHref || "/basvuru"} className="inline-flex h-14 w-full shrink-0 items-center justify-center gap-3 rounded-md border-2 border-white bg-transparent px-6 text-xs font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-hayat-dark sm:text-sm md:h-16 md:w-auto md:px-9">{cta.secondaryButtonLabel}</Link>}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
