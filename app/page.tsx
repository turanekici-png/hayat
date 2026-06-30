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
import { ArrowRight, ChevronRight, ShieldCheck, CalendarDays, Megaphone } from "lucide-react";
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
  return Boolean(src && /\.(mp4|webm|ogg|mov)$/i.test(src));
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
  const campaignsTitle = getSectionTitle("CAMPAIGN", campaigns, "Bağış Vitrini");
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
      style={{ ...cardStyle(quickDonation, { padding: 24 }), backgroundColor: "#ffffff", borderColor: "#e2ddd0", borderRadius: 20 }}
    />
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
                <ActivityShowcaseSlider items={activityShowcaseItems} splitMedia compactMedia />
                <aside className="flex h-[560px] min-h-0 flex-col overflow-hidden rounded-lg border border-[#dfe7ed] bg-white shadow-stk sm:h-[600px] lg:h-[520px]">
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
          <section id="projeler" className="px-3 sm:px-4 lg:px-4" style={{ backgroundColor: campaignLead?.backgroundColor || "#ffffff", ...sectionStyle(campaignLead, 96) }}>
            <div className={`mx-auto ${campaignLead?.contentWidth === "full" ? "w-full max-w-none" : "max-w-[1840px]"}`}>
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="mt-1 text-3xl font-black tracking-tight text-[#1f3444] sm:text-4xl md:text-6xl" style={campaignLead ? headingStyle(campaignLead, "#1f3444", 56) : undefined}>{campaignsTitle}</h2>
                </div>
                <Link href="/projeler" className="inline-flex w-fit items-center gap-2 rounded-md border-2 border-[#dfe7ed] bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-[#1f3444] transition hover:border-hayat-green hover:text-hayat-green">
                  Tüm Projeler <ArrowRight size={16} />
                </Link>
              </div>
              <AutoScrollRow animate={featuredCampaigns.length > 1}>
                {featuredCampaigns.map((item) => {
                  const slides = sectionSlides(item);
                  const image = slides[0];
                  return (
                  <ExpandableCard key={item.id} title={item.title} subtitle={item.subtitle} body={item.body} imageUrl={image?.src} imageAlt={image?.alt} label="Proje" className={`group shrink-0 snap-start ${cardWidthClass(item)} cursor-zoom-in overflow-hidden border border-[#e9eef2] bg-white shadow-stk transition hover:-translate-y-1 hover:shadow-stk-hover`} style={cardStyle(item, { padding: "0px" })}>
                    {slides.length > 0 && (
                      <div className="relative aspect-w-16 aspect-h-9 overflow-hidden bg-hayat-soft">
                        <HeroImageSlider images={slides} className="relative h-full w-full overflow-hidden bg-hayat-soft" showOverlay={false} fitToParent />
                        <span className="absolute left-5 top-5 rounded-md bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-hayat-green shadow-stk" style={subtitleStyle(item, "#6FB744", 10)}>{item.badge || "Aktif Proje"}</span>
                      </div>
                    )}
                    <div className="p-6">
                      {slides.length === 0 && <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-hayat-green" style={subtitleStyle(item, "#6FB744", 10)}>{item.badge || "Aktif Proje"}</p>}
                      <h3 className="min-h-[4rem] text-2xl font-black leading-tight text-[#1f3444]" style={headingStyle(item, "#1f3444", 24)}>{item.title}</h3>
                      <div className="mt-4 min-h-[100px]">
                        <ExpandableText title={item.title} text={item.body} className="text-sm font-semibold leading-8 text-[#607081]" style={bodyStyle(item, "#607081", 14)} />
                      </div>
                    </div>
                  </ExpandableCard>
                )})}
              </AutoScrollRow>
            </div>
          </section>
        )}

        {/* 6. VIDEOS */}
        {videoMediaItems.length > 0 && (
          <section id="video" className="px-3 text-white sm:px-4 lg:px-4" style={{ backgroundColor: videoLead?.backgroundColor || "#102f47", ...sectionStyle(videoLead, 96) }}>
            <div className={`mx-auto ${videoLead?.contentWidth === "full" ? "w-full max-w-none" : "max-w-[1840px]"}`}>
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="mt-1 text-3xl font-black sm:text-4xl md:text-6xl" style={videoLead ? headingStyle(videoLead, "#ffffff", 56) : undefined}>{videosTitle}</h2>
                </div>
                <Link href={videoLead?.href || "/video"} className="inline-flex w-fit items-center gap-2 rounded-md border-2 border-white/15 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:border-hayat-green hover:text-hayat-green">
                  {videoLead?.buttonLabel || "Tüm Videolar"} <ArrowRight size={16} />
                </Link>
              </div>
              <AutoScrollRow animate={videoMediaItems.length > 1}>
                {videoMediaItems.map((item) => {
                  return (
                    <article key={item.id} className={`relative aspect-video shrink-0 snap-start ${cardWidthClass(item.section)} overflow-hidden bg-hayat-dark shadow-2xl`} style={cardStyle(item.section, { padding: "0px" })}>
                      <MediaLightboxTile src={item.slide?.src} alt={item.slide?.alt || item.section.title} isVideo={isVideoSrc(item.slide?.src)} className="h-full w-full bg-white object-contain" videoClassName="h-full w-full bg-black object-contain" />
                    </article>
                  );
                })}
              </AutoScrollRow>
            </div>
          </section>
        )}

        {/* 9. GALLERY */}
        {galleryMediaItems.length > 0 && (
          <section id="galeri" className="px-3 sm:px-4 lg:px-4" style={{ backgroundColor: galleryLead?.backgroundColor || "#ffffff", ...sectionStyle(galleryLead, 96) }}>
            <div className={`mx-auto ${galleryLead?.contentWidth === "full" ? "w-full max-w-none" : "max-w-[1840px]"}`}>
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="mt-1 text-3xl font-black tracking-tight text-[#1f3444] sm:text-4xl md:text-6xl" style={galleryLead ? headingStyle(galleryLead, "#1f3444", 56) : undefined}>{galleryTitle}</h2>
                </div>
                <Link href="/tum-resimler" className="inline-flex w-fit items-center gap-2 rounded-md border-2 border-[#dfe7ed] bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-[#1f3444] transition hover:border-hayat-green hover:text-hayat-green">
                  Tüm Resimler <ArrowRight size={16} />
                </Link>
              </div>
              <AutoScrollRow animate={galleryMediaItems.length > 1} setClassName="gap-5">
                {galleryMediaItems.map((item) => {
                  return (
                    <article key={item.id} className={`relative h-[220px] shrink-0 snap-start ${cardWidthClass(item.section)} overflow-hidden bg-hayat-soft sm:h-[280px]`} style={cardStyle(item.section, { padding: "0px" })}>
                      <MediaLightboxTile src={item.slide?.src} alt={item.slide?.alt || item.section.title} isVideo={isVideoSrc(item.slide?.src)} className="h-full w-full bg-white object-contain" videoClassName="h-full w-full bg-black object-contain" />
                    </article>
                  );
                })}
              </AutoScrollRow>
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
              <AutoScrollRow animate={blogs.length > 1} setClassName="gap-7">
                {blogs.map((item) => (
                  <ExpandableCard key={item.id} title={item.title} subtitle={item.subtitle} body={item.body} imageUrl={firstSlide(item)?.src} imageAlt={firstSlide(item)?.alt} label="Blog" className={`group ${cardWidthClass(item)} shrink-0 snap-start cursor-zoom-in overflow-hidden border border-[#e9eef2] bg-white shadow-stk transition hover:-translate-y-1 hover:shadow-stk-hover`} style={cardStyle(item, { padding: "0px" })}>
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
                ))}
              </AutoScrollRow>
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
              <AutoScrollRow animate={stories.length > 1} setClassName="gap-7">
                {stories.map((item) => (
                  <ExpandableCard key={item.id} title={item.title} subtitle={item.subtitle} body={item.body} imageUrl={firstSlide(item)?.src} imageAlt={firstSlide(item)?.alt} label="Hikaye" className={`group ${cardWidthClass(item)} shrink-0 snap-start cursor-zoom-in overflow-hidden border border-[#e9eef2] bg-white shadow-stk transition hover:-translate-y-1 hover:shadow-stk-hover`} style={cardStyle(item, { padding: "0px" })}>
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
                ))}
              </AutoScrollRow>
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
              <AutoScrollRow animate={customs.length > 1} setClassName="gap-7">
                {customs.map((item) => (
                  <ExpandableCard key={item.id} title={item.title} subtitle={item.subtitle} body={item.body} imageUrl={firstSlide(item)?.src} imageAlt={firstSlide(item)?.alt} label={item.badge || "Özel"} className={`group ${cardWidthClass(item)} shrink-0 snap-start cursor-zoom-in overflow-hidden border border-[#e9eef2] bg-white shadow-stk transition hover:-translate-y-1 hover:shadow-stk-hover`} style={cardStyle(item, { padding: "0px" })}>
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
                ))}
              </AutoScrollRow>
            </div>
          </section>
        )}

        {/* 13. CORPORATE */}
        <section id="kurumsal" className="px-3 sm:px-4 lg:px-4" style={{ backgroundColor: mainCorporate?.backgroundColor || "#f5f9fb", ...sectionStyle(mainCorporate, 96) }}>
          <div className={`mx-auto ${mainCorporate?.contentWidth === "full" ? "w-full max-w-none" : "max-w-[1840px]"}`}>
            <div className={mainCorporate?.layout === "SPLIT" ? "grid gap-6 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)] items-stretch" : "flex flex-col gap-5"}>
              {mainCorporate?.layout !== "MINIMAL" && mainCorporate?.layout === "SPLIT" && (
                <div className="col-span-1 w-full max-w-[430px] h-full overflow-hidden bg-white shadow-stk rounded-lg" style={{ borderColor: mainCorporate?.borderColor || "transparent", borderWidth: mainCorporate?.borderColor ? "1px" : "0px" }}>
                  <div className="h-full min-h-[360px] overflow-hidden">
                    <HeroImageSlider images={sectionSlides(mainCorporate, undefined, corporateTitle)} className="h-full w-full" showOverlay={false} fitToParent />
                  </div>
                </div>
              )}

              <div className="col-span-1 flex flex-col justify-center">
                <div className="flex items-start gap-4">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-hayat-mint text-hayat-green"><ShieldCheck size={34} /></div>
                  <div>
                    <h2 className="mt-2 text-3xl font-black leading-tight text-[#1f3444] sm:text-4xl md:text-7xl" style={headingStyle(mainCorporate, "#1f3444", 64)}>{corporateTitle}</h2>
                    <p className="mt-3 text-lg font-semibold leading-9 text-[#607081]" style={bodyStyle(mainCorporate)}>{mainCorporate?.body}</p>
                    {(mainCorporate?.buttonLabel || mainCorporate?.secondaryButtonLabel) && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {mainCorporate.buttonLabel && <Link href={mainCorporate.href || "/kurumsal"} className="inline-flex h-14 items-center justify-center rounded-md bg-hayat-green px-8 text-sm font-black text-white transition hover:bg-hayat-dark">{mainCorporate.buttonLabel}</Link>}
                        {mainCorporate.secondaryButtonLabel && <Link href={mainCorporate.secondaryHref || "/iletisim"} className="inline-flex h-14 items-center justify-center rounded-md border-2 border-[#dfe7ed] bg-white px-8 text-sm font-black text-hayat-dark transition hover:border-hayat-green hover:text-hayat-green">{mainCorporate.secondaryButtonLabel}</Link>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 14. STATS */}
        {stats.length > 0 && (
          <section className="px-3 py-6 text-white sm:px-4 lg:px-4" style={{ backgroundColor: statsSection?.backgroundColor || "#6FB744" }}>
            <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
              <div className="min-w-0">
                <h2 className="mt-1 text-2xl font-black leading-tight md:text-4xl lg:text-5xl" style={statsSection ? headingStyle(statsSection, "#ffffff", 44) : undefined}>{statsSection?.title || "Desteklerinizle büyüyen iyilik ağı"}</h2>
              </div>
              <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
                {stats.map(([value, label]) => (
                  <div key={label} className="min-w-0 border border-white/20 p-4" style={statsSection ? cardStyle(statsSection, { padding: "16px" }) : undefined}>
                    <b className="block break-words text-2xl font-black lg:text-3xl">{value}</b>
                    <span className="mt-2 block text-[10px] font-black uppercase tracking-widest text-white/80">{label}</span>
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
