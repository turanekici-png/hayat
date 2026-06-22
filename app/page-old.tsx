import Link from "next/link";
import type { CSSProperties } from "react";
import { Header } from "@/components/Header";
import { prisma } from "@/lib/prisma";
import { Footer } from "@/components/Footer";
import { HomePopup } from "@/components/HomePopup";
import { allByType, fallbackSections, firstByType, getHomeSections } from "@/lib/site-content";
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, HandHeart, HeartHandshake, Image as ImageIcon, Megaphone, Pin, Quote, ShieldCheck, Sparkles, Users } from "lucide-react";

const stats = [["12.450+", "Ulaşılan aile"], ["7/24", "Online bağış"], ["%100", "Kayıtlı süreç"], ["Güvenli", "Başvuru takibi"]];

export const dynamic = "force-dynamic";
export const revalidate = 0;

function HeroTitle({ title }: { title: string }) {
  const [highlight, ...restParts] = title.split(",");
  const rest = restParts.join(",").trim();
  if (!rest) return <>{title}</>;
  return <><span className="text-hayat-blue">{highlight}</span>, {rest}</>;
}

function safeAlign(value?: string | null): CSSProperties["textAlign"] {
  return value === "center" || value === "right" || value === "justify" ? value : "left";
}

function titleStyle(section: any, fallbackSize = 32, fallbackColor = "#102033"): CSSProperties {
  return { fontSize: `${section.titleSize || fallbackSize}px`, color: section.titleColor || fallbackColor, textAlign: safeAlign(section.textAlign), lineHeight: 1.12 };
}

function subtitleStyle(section: any, fallbackSize = 14, fallbackColor = "#6FB744"): CSSProperties {
  return { fontSize: `${section.subtitleSize || fallbackSize}px`, color: section.subtitleColor || fallbackColor, textAlign: safeAlign(section.textAlign) };
}

function bodyStyle(section: any, fallbackSize = 16, fallbackColor = "#475569"): CSSProperties {
  return { fontSize: `${section.bodySize || fallbackSize}px`, color: section.bodyColor || fallbackColor, textAlign: safeAlign(section.textAlign), lineHeight: 1.65 };
}

function sectionPadding(section: any, fallback = 56): CSSProperties {
  const py = Number(section.paddingY || fallback);
  return { paddingTop: `${py}px`, paddingBottom: `${py}px` };
}

function cardStyle(section: any, defaults: CSSProperties = {}): CSSProperties {
  const style: CSSProperties = { ...defaults };
  if (section.minHeight) style.minHeight = `${section.minHeight}px`;
  style.padding = `${section.cardPadding || 32}px`;
  style.marginTop = `${section.marginTop || 0}px`;
  style.marginBottom = `${section.marginBottom || 0}px`;
  style.borderRadius = `${section.borderRadius || 32}px`;
  if (section.borderColor) style.borderColor = section.borderColor;
  if (section.backgroundColor) style.backgroundColor = section.backgroundColor;
  return style;
}

function cardWidthClass(section: any) {
  switch (section.cardWidth) {
    case "full": return "md:col-span-12";
    case "wide": return "md:col-span-8";
    case "half": return "md:col-span-6";
    case "third": return "md:col-span-4";
    default: return "md:col-span-6";
  }
}

function compactCardWidthClass(section: any) {
  switch (section.cardWidth) {
    case "full": return "md:col-span-12";
    case "wide": return "md:col-span-8";
    case "half": return "md:col-span-6";
    case "third": return "md:col-span-4";
    default: return "md:col-span-4";
  }
}

function contentMaxWidth(section: any) {
  if (section.contentWidth === "narrow") return "max-w-3xl";
  if (section.contentWidth === "wide") return "max-w-7xl";
  if (section.contentWidth === "full") return "max-w-none";
  return "max-w-5xl";
}

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeTR(value?: string | null) {
  return (value || "").trim().toLocaleLowerCase("tr-TR");
}

function isCorporateIdentitySection(section: any) {
  const title = normalizeTR(section.title);
  const badge = (section.badge || "").trim().toUpperCase();
  return (
    section.type === "ABOUT" ||
    ["about-default", "mission-default", "vision-default"].includes(section.id) ||
    ["HAKKIMIZDA", "MISYON", "VIZYON", "KURUMSAL_IDENTITY"].includes(badge) ||
    title.includes("hakkımızda") ||
    title.includes("misyon") ||
    title.includes("vizyon")
  );
}

function isSpecialCorporateCard(section: any) {
  const badge = (section.badge || "").trim().toUpperCase();
  return (
    section.type === "CUSTOM" &&
    !isCorporateIdentitySection(section) &&
    !section.id.startsWith("system-") &&
    (
      section.id === "kurumsal-quote" ||
      section.id.startsWith("kurumsal-feature-") ||
      badge === "KURUMSAL_QUOTE" ||
      badge === "KURUMSAL_FEATURE"
    )
  );
}

function isQuoteCard(section: any) {
  return section.id === "kurumsal-quote" || (section.badge || "").trim().toUpperCase() === "KURUMSAL_QUOTE";
}

function isSmallCorporateCard(section: any) {
  return section.id.startsWith("kurumsal-feature-") || (section.badge || "").trim().toUpperCase() === "KURUMSAL_FEATURE";
}

export default async function HomePage() {
  const sections = await getHomeSections();
  const hero = firstByType(sections, "HERO") ?? { ...fallbackSections[0], badge: "", subtitle: "", title: "", body: "" };
  const features = allByType(sections, "FEATURE");
  const activities = allByType(sections, "ACTIVITY");
  const campaigns = allByType(sections, "CAMPAIGN");
  const corporateIdentitySections = sections.filter(isCorporateIdentitySection);
  const specialCorporateCards = sections.filter(isSpecialCorporateCard);
  const gallery = allByType(sections, "GALLERY");
  const cta = firstByType(sections, "CTA");
  const customs = allByType(sections, "CUSTOM").filter((s) =>
    !s.id.startsWith("system-") &&
    !isCorporateIdentitySection(s) &&
    !isSpecialCorporateCard(s)
  );
  const now = new Date();
  const [announcements, popup] = await Promise.all([
    prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }]
      },
      orderBy: [{ isPinned: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      take: 12
    }),
    prisma.popupSetting.findFirst({ where: { isActive: true }, orderBy: { updatedAt: "desc" } })
  ]);

  return (
    <>
      <HomePopup popup={popup ? {
        id: popup.id,
        title: popup.title,
        content: popup.content,
        imageUrl: popup.imageUrl,
        imageAlt: popup.imageAlt,
        buttonLabel: popup.buttonLabel,
        buttonUrl: popup.buttonUrl,
        showOnce: popup.showOnce,
        delaySeconds: popup.delaySeconds
      } : null} />
      <Header />
      <main className="overflow-hidden">
        <section className="relative isolate logo-gradient-bg">
          <div className="absolute inset-x-0 top-0 -z-10 h-48 bg-gradient-to-b from-white to-transparent" />
          <div className="mx-auto grid w-full items-start gap-10 px-4 py-10 sm:px-6 md:py-16 xl:grid-cols-[minmax(0,1fr)_500px] xl:px-[4cm]">
            <div>
              {(hasText(hero.badge) || hasText(hero.subtitle)) && (
                <div className="inline-flex items-center gap-2 rounded-full border border-hayat-blue/15 bg-white/80 px-4 py-2 text-sm font-black text-hayat-blue shadow-sm backdrop-blur">
                  <Sparkles size={17} className="text-hayat-green" /> {hero.badge || hero.subtitle}
                </div>
              )}
              <div className="mt-7 flex items-center justify-center sm:justify-start">
                <img
                  src="/brand/hayat-agaci-logo.jpg"
                  alt="Hayat Ağacı Derneği"
                  className="h-auto w-[180px] max-w-full object-contain sm:w-[240px] md:w-[280px] 2xl:w-[320px]"
                />
              </div>
              {hasText(hero.title) && (
                <h1 className={`mt-5 ${contentMaxWidth(hero)} font-black tracking-tight`} style={titleStyle(hero, 64, "#102033")}>
                  <HeroTitle title={hero.title || ""} />
                </h1>
              )}
              {hasText(hero.body) && <p className={`mt-5 ${contentMaxWidth(hero)} md:mt-7`} style={bodyStyle(hero, 20, "#475569")}>{hero.body}</p>}
              <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-4 md:mt-9">
                {hasText(hero.buttonLabel) && (
                  <Link href={hero.href || "/bagis"} className="group inline-flex items-center justify-center gap-2 rounded-full bg-hayat-blue px-7 py-4 font-black text-white shadow-soft transition hover:-translate-y-1 hover:bg-hayat-green sm:px-8">
                    {hero.buttonLabel} <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                  </Link>
                )}
                <Link href="/basvuru" className="inline-flex items-center justify-center gap-2 rounded-full bg-hayat-green px-7 py-4 font-black text-white shadow-green transition hover:-translate-y-1 hover:bg-hayat-blue sm:px-8">Yardım Başvurusu Yap</Link>
                {hasText(hero.secondaryButtonLabel) && (
                  <Link href={hero.secondaryHref || "#faaliyetler"} className="inline-flex items-center justify-center gap-2 rounded-full border border-hayat-blue/15 bg-white px-7 py-4 font-black text-hayat-blue shadow-sm transition hover:bg-hayat-soft sm:px-8">{hero.secondaryButtonLabel}</Link>
                )}
              </div>
              <div className="mt-8 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4 md:mt-10">
                {stats.map(([value, label]) => <div key={label} className="rounded-2xl border border-hayat-blue/10 bg-white/85 p-4 shadow-sm backdrop-blur md:rounded-3xl"><p className="text-xl font-black text-hayat-blue sm:text-2xl">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">{label}</p></div>)}
              </div>
            </div>
            <aside className="xl:sticky xl:top-28 xl:self-start">
              <div className="overflow-hidden rounded-[1.6rem] border border-hayat-blue/10 bg-white/92 shadow-soft backdrop-blur md:rounded-[2rem]">
                <div className="bg-gradient-to-r from-hayat-blue to-hayat-green p-5 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[.16em] text-white/80"><Megaphone size={17} /> Duyurular</p>
                      <h2 className="mt-2 text-xl font-black sm:text-2xl">Son Duyurular</h2>
                    </div>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">Canlı</span>
                  </div>
                </div>
                <div className="announcement-window h-[340px] overflow-hidden p-3 sm:h-[380px] sm:p-4 xl:h-[430px]">
                  {announcements.length ? (
                    <div className="announcement-track space-y-3">
                      {[...announcements, ...announcements].map((item, index) => (
                        <article key={`${item.id}-${index}`} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="rounded-full bg-hayat-soft px-3 py-1 text-xs font-black text-hayat-blue">{item.type === "ACIL" ? "Acil" : item.type === "KAMPANYA" ? "Kampanya" : item.type === "HABER" ? "Haber" : "Duyuru"}</span>
                            {item.isPinned && <span className="inline-flex items-center gap-1 rounded-full bg-hayat-mint px-2 py-1 text-xs font-black text-hayat-greenDark"><Pin size={12} /> Sabit</span>}
                          </div>
                          <h3 className="text-base font-black leading-snug text-hayat-ink">{item.title}</h3>
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{item.content}</p>
                          <p className="mt-3 text-xs font-bold text-slate-400">{item.createdAt.toLocaleDateString("tr-TR")}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-hayat-soft p-5 text-center">
                      <Megaphone className="mx-auto text-hayat-blue" />
                      <p className="mt-3 font-black text-hayat-dark">Henüz aktif duyuru yok</p>
                      <p className="mt-1 text-sm text-slate-500">Yönetim panelinden duyuru ekleyebilirsiniz.</p>
                    </div>
                  )}
                </div>
                <Link href="/admin/duyurular" className="block border-t border-slate-100 bg-hayat-soft px-5 py-4 text-center text-sm font-black text-hayat-blue hover:bg-hayat-mint">
                  Duyuruları Yönet
                </Link>
              </div>
            </aside>
          </div>
        </section>

        {features.length > 0 && <section className="relative bg-white" style={sectionPadding(features[0], 40)}><div className="mx-auto grid w-full grid-cols-1 gap-4 px-4 sm:px-6 xl:px-[4cm] md:grid-cols-12">{features.map((item) => <div key={item.id} className={`${compactCardWidthClass(item)} border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft`} style={cardStyle(item, { padding: "28px" })}>{item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt || item.title} className="mb-5 h-40 w-full rounded-2xl object-cover" /> : <ShieldCheck className="text-hayat-blue" size={34} />}<h3 className="mt-5 font-black" style={titleStyle(item, 20)}>{item.title}</h3><p className="mt-2" style={bodyStyle(item, 16)}>{item.body}</p></div>)}</div></section>}

        {corporateIdentitySections.length > 0 && (
          <section id="kurumsal" className="bg-white" style={sectionPadding(corporateIdentitySections[0], 56)}>
            <div className="mx-auto w-full px-4 sm:px-6 xl:px-[4cm]">
              <div className="mb-8">
                <p className="font-black uppercase tracking-[.22em] text-hayat-green">Kurumsal Bilgiler</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-hayat-ink md:text-5xl">Hakkımızda, misyon ve vizyon</h2>
                <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-500">Bu bölümde sadece kurum bilgileri yer alır. Yönetim panelinde <b>Kurumsal Bilgiler</b> banketinden düzenlenir; sıra numarası bu bölüm içindeki yerini değiştirir.</p>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                {corporateIdentitySections.map((item) => (
                  <article key={item.id} className={`${cardWidthClass(item)} border border-hayat-blue/10 bg-gradient-to-br from-white to-hayat-soft shadow-sm`} style={cardStyle(item)}>
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-hayat-mint text-hayat-green"><HandHeart size={26} /></div>
                    {hasText(item.subtitle) && <p className="font-black uppercase tracking-[.18em]" style={subtitleStyle(item)}>{item.subtitle}</p>}
                    {hasText(item.title) && <h3 className="mt-3 font-black" style={titleStyle(item, 30)}>{item.title}</h3>}
                    {hasText(item.body) && <p className="mt-4" style={bodyStyle(item, 17)}>{item.body}</p>}
                    {item.imageUrl && <img src={item.imageUrl} alt={item.imageAlt || item.title} className="mt-5 h-56 w-full rounded-2xl object-cover" />}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {specialCorporateCards.length > 0 && (
          <section id="ozel-alanlar" className="bg-hayat-soft" style={sectionPadding(specialCorporateCards[0], 44)}>
            <div className="mx-auto w-full px-4 sm:px-6 xl:px-[4cm]">
              <div className="mb-8">
                <p className="font-black uppercase tracking-[.22em] text-hayat-green">Özel Alanlar</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-hayat-ink md:text-5xl">Özel kurumsal kartlar</h2>
                <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-500">Slogan, alıntı kartı ve test/özellik kutuları bu ayrı bölümde gösterilir. Yönetim panelinde <b>Özel Alanlar</b> banketinden düzenlenir.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {specialCorporateCards.map((item) => { const quoteCard = isQuoteCard(item); const smallCard = isSmallCorporateCard(item); return (
                  <article key={item.id} className={`${quoteCard ? "xl:col-span-2" : ""} ${smallCard ? "p-5" : "p-8"} rounded-[2rem] border border-hayat-blue/10 bg-white shadow-sm`}>
                    <div className={`${smallCard ? "mb-4" : "mb-5"} inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-hayat-mint text-hayat-green`}>{quoteCard ? <Quote size={28} /> : <CheckCircle2 size={22} />}</div>
                    {hasText(item.subtitle) && <p className="font-black uppercase tracking-[.18em]" style={subtitleStyle(item)}>{item.subtitle}</p>}
                    {hasText(item.title) && <h3 className="mt-3 font-black" style={titleStyle(item, smallCard ? 18 : 30)}>{item.title}</h3>}
                    {hasText(item.body) && <p className="mt-4" style={bodyStyle(item, smallCard ? 15 : 18)}>{item.body}</p>}
                    {item.imageUrl && <img src={item.imageUrl} alt={item.imageAlt || item.title} className="mt-5 h-56 w-full rounded-2xl object-cover" />}
                  </article>
                ); })}
              </div>
            </div>
          </section>
        )}

        {activities.length > 0 && <section id="faaliyetler" className="mx-auto w-full px-4 sm:px-6 xl:px-[4cm]" style={sectionPadding(activities[0], 72)}><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-black uppercase tracking-[.22em] text-hayat-green">Yardım faaliyetleri</p><h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-hayat-ink md:text-5xl">İhtiyaçlara göre düzenlenen güçlü destek alanları</h2></div><Link href="/bagis" className="inline-flex w-fit items-center gap-2 rounded-full bg-hayat-blue px-7 py-4 font-black text-white transition hover:bg-hayat-green">Bu çalışmalara destek ol <ArrowRight size={18} /></Link></div><div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-12">{activities.map((item) => <div key={item.id} className={`${compactCardWidthClass(item)} group border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft`} style={cardStyle(item, { padding: "28px" })}>{item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt || item.title} className="mb-5 h-44 w-full rounded-2xl object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-hayat-mint text-hayat-green"><HeartHandshake size={28} /></div>}<h3 className="mt-6 font-black" style={titleStyle(item, 20)}>{item.title}</h3><p className="mt-3" style={bodyStyle(item, 16)}>{item.body}</p></div>)}</div></section>}

        {gallery.length > 0 && <section id="galeri" className="bg-hayat-soft" style={gallery[0] ? sectionPadding(gallery[0], 72) : undefined}><div className="mx-auto w-full px-4 sm:px-6 xl:px-[4cm]"><div className="mb-10"><p className="font-black uppercase tracking-[.22em] text-hayat-green">Galeri</p><h2 className="mt-3 text-3xl font-black tracking-tight text-hayat-ink md:text-5xl">Sahadan kareler ve duyurular</h2></div><div className="grid grid-cols-1 gap-5 md:grid-cols-12">{gallery.map((item) => <article key={item.id} className={`${compactCardWidthClass(item)} overflow-hidden bg-white shadow-sm`} style={cardStyle(item, { padding: "0px" })}>{item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt || item.title} className="h-64 w-full object-cover" /> : <div className="flex h-64 items-center justify-center bg-white"><ImageIcon className="text-hayat-blue" size={48} /></div>}<div className="p-6"><h3 className="font-black" style={titleStyle(item, 20)}>{item.title}</h3><p className="mt-2" style={bodyStyle(item, 16)}>{item.body}</p></div></article>)}</div></div></section>}

        {customs.length > 0 && <section className="bg-white" style={customs[0] ? sectionPadding(customs[0], 80) : undefined}><div className="mx-auto grid w-full grid-cols-1 gap-5 px-4 sm:px-6 xl:px-[4cm] md:grid-cols-12">{customs.map((item) => <article key={item.id} className={`${compactCardWidthClass(item)} border border-slate-100 shadow-sm`} style={cardStyle(item, { padding: "28px" })}>{item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt || item.title} className="mb-5 h-48 w-full rounded-2xl object-cover" /> : <ImageIcon className="text-hayat-blue" />}<h3 className="font-black" style={titleStyle(item, 24)}>{item.title}</h3><p className="mt-3" style={bodyStyle(item, 16)}>{item.body}</p>{item.href && <Link href={item.href} className="mt-5 inline-flex items-center gap-2 font-black text-hayat-blue">{item.buttonLabel || "Detay"} <ArrowRight size={16} /></Link>}</article>)}</div></section>}

        {campaigns.length > 0 && <section id="haberler" className="bg-hayat-dark text-white" style={sectionPadding(campaigns[0], 72)}><div className="mx-auto w-full px-4 sm:px-6 xl:px-[4cm]"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-black uppercase tracking-[.22em] text-hayat-green">Haberler ve kampanyalar</p><h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">Bağışçıyı harekete geçiren güçlü kampanya alanları</h2></div><div className="flex items-center gap-3 rounded-full bg-white/10 px-5 py-3 text-sm font-bold text-white/80"><CalendarDays size={18} className="text-hayat-green" /> Güncel kampanya vitrini</div></div><div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-12">{campaigns.map((item) => <article key={item.id} className={`${compactCardWidthClass(item)} border border-white/10 bg-white/10 backdrop-blur transition hover:-translate-y-1 hover:bg-white/15`} style={cardStyle(item, { padding: "28px" })}>{item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt || item.title} className="mb-5 h-44 w-full rounded-2xl object-cover" /> : <BookOpen className="text-hayat-green" />}<h3 className="mt-6 font-black" style={titleStyle(item, 24, "#ffffff")}>{item.title}</h3><p className="mt-4" style={bodyStyle(item, 16, "rgba(255,255,255,.72)")}>{item.body}</p></article>)}</div></div></section>}

        {cta && <section className="bg-white px-4 sm:px-6 xl:px-[4cm]" style={sectionPadding(cta, 80)}><div className="mx-auto rounded-[2.5rem] bg-gradient-to-br from-hayat-blue to-hayat-green px-6 py-14 text-center text-white shadow-soft md:px-16"><Users className="mx-auto text-white" size={48} /><h2 className={`mx-auto mt-6 ${contentMaxWidth(cta)} font-black tracking-tight`} style={titleStyle(cta, 48, "#ffffff")}>{cta.title}</h2><p className="mx-auto mt-5 max-w-2xl" style={bodyStyle(cta, 18, "rgba(255,255,255,.82)")}>{cta.body}</p><div className="mt-8 flex flex-wrap justify-center gap-4"><Link href={cta.href || "/bagis"} className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-black text-hayat-blue transition hover:-translate-y-1">{cta.buttonLabel || "Güvenli Bağış Ekranına Git"} <ArrowRight size={18} /></Link><Link href="/basvuru" className="inline-flex items-center gap-2 rounded-full bg-white/15 px-8 py-4 font-black text-white ring-1 ring-white/30 transition hover:-translate-y-1">Yardım Başvurusu Yap</Link></div></div></section>}
      </main>
      <Footer />
    </>
  );
}
