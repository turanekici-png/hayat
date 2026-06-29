import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Image as ImageIcon, LucideProps } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ExpandableCard } from "@/components/ExpandableCard";
import { ExpandableText } from "@/components/ExpandableText";
import { getHomeSections, getSectionGroupLabel, getSectionsByType, type HomeSection } from "@/lib/site-content";
import { normalizeMediaUrl } from "@/lib/media-url";

type SectionIndexPageProps = {
  type?: string;
  groupLabelType?: string;
  filter?: (section: HomeSection) => boolean;
  eyebrow: string;
  title: string;
  description: string;
  countLabel: string;
  itemLabel: string;
  emptyTitle: string;
  emptyBody: string;
  backHref?: string;
  Icon: ComponentType<LucideProps>;
};

function sectionImages(section: HomeSection) {
  const images = Array.isArray(section.images) ? section.images : [];
  const slides = images
    .filter((image) => image.url)
    .map((image) => ({ src: normalizeMediaUrl(image.url) || image.url, alt: image.alt || section.imageAlt || section.title }));

  if (slides.length) return slides;
  if (section.imageUrl) return [{ src: normalizeMediaUrl(section.imageUrl) || section.imageUrl, alt: section.imageAlt || section.title }];
  return [];
}

export function isCorporateSection(section: HomeSection) {
  const title = (section.title || "").toLocaleLowerCase("tr-TR");
  return section.type === "ABOUT" || title.includes("hakkımızda") || title.includes("hakkimizda") || title.includes("misyon") || title.includes("vizyon");
}

export async function SectionIndexPage({
  type,
  groupLabelType,
  filter,
  eyebrow,
  title,
  description,
  countLabel,
  itemLabel,
  emptyTitle,
  emptyBody,
  backHref = "/",
  Icon
}: SectionIndexPageProps) {
  const [sections, groupLabel] = await Promise.all([
    type ? getSectionsByType(type) : getHomeSections(),
    getSectionGroupLabel(groupLabelType || type || "")
  ]);
  const items = (type ? sections : sections.filter((section) => filter?.(section))).filter(Boolean);
  const featured = items[0];
  const pageTitle = groupLabel?.label || items.find((section) => section.customTitle)?.customTitle || title;

  return (
    <>
      <Header />
      <main className="bg-[#f6fafc]">
        <section className="border-b border-[#dfe7ed] bg-white px-3 py-8 sm:px-4 sm:py-12 lg:px-4">
          <div className="mx-auto flex max-w-[1840px] flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-black text-hayat-blue transition hover:text-hayat-green">
                <ArrowLeft size={18} /> Ana sayfaya dön
              </Link>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-hayat-green sm:mt-8">{eyebrow}</p>
              <h1 className="mt-3 max-w-5xl text-3xl font-black tracking-tight text-[#1f3444] sm:text-5xl md:text-7xl">{pageTitle}</h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-[#607081] sm:mt-6 md:text-lg md:leading-8">{description}</p>
            </div>
            <div className="flex w-fit items-center gap-3 rounded-md border border-[#dfe7ed] bg-[#f6fafc] px-5 py-4 text-sm font-black text-[#607081]">
              <Icon className="text-hayat-blue" size={20} />
              {items.length} {countLabel}
            </div>
          </div>
        </section>

        {featured && (
          <section className="px-3 py-8 sm:px-4 sm:py-12 lg:px-4">
            <div className="mx-auto grid max-w-[1840px] overflow-hidden rounded-lg border border-[#dfe7ed] bg-white shadow-stk lg:grid-cols-[1.05fr_.95fr]">
              <div className="min-h-[260px] bg-hayat-soft sm:min-h-[360px]">
                {sectionImages(featured)[0] ? (
                  <img src={sectionImages(featured)[0].src} alt={sectionImages(featured)[0].alt} loading="eager" decoding="async" fetchPriority="high" className="h-full min-h-[260px] w-full bg-white object-contain sm:min-h-[360px]" />
                ) : (
                  <div className="flex h-full min-h-[360px] items-center justify-center text-hayat-blue">
                    <Icon size={64} />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center p-7 md:p-10">
                <div className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-hayat-green">
                  <CalendarDays size={16} /> Öne çıkan
                </div>
                <h2 className="text-3xl font-black leading-tight text-[#1f3444] md:text-5xl">{featured.title}</h2>
                {featured.subtitle && <p className="mt-4 text-base font-black text-hayat-blue">{featured.subtitle}</p>}
                <div className="mt-6">
                  <ExpandableText title={featured.title} text={featured.body || ""} className="text-base font-semibold leading-8 text-[#607081]" />
                </div>
                {featured.href && (
                  <Link href={featured.href} className="mt-8 inline-flex w-fit items-center gap-2 rounded-md bg-hayat-green px-6 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-hayat-dark">
                    Detay <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        <section className={`px-3 ${featured ? "pb-16" : "py-16"} sm:px-4 lg:px-4`}>
          <div className="mx-auto grid max-w-[1840px] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const image = sectionImages(item)[0];
              const linkHref = item.href || (item.type === "NEWS" ? `/haberler/${item.id}` : undefined);

              const card = (
                <ExpandableCard title={item.title} subtitle={item.subtitle} body={item.body} imageUrl={image?.src} imageAlt={image?.alt} label={itemLabel} className="cursor-zoom-in overflow-hidden rounded-lg border border-[#dfe7ed] bg-white shadow-stk transition hover:-translate-y-1 hover:shadow-stk-hover">
                  {image ? (
                    <img src={image.src} alt={image.alt} loading="lazy" decoding="async" className="h-64 w-full bg-white object-contain" />
                  ) : (
                    <div className="flex h-64 w-full items-center justify-center bg-hayat-soft text-hayat-blue">
                      <ImageIcon size={44} />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-hayat-green">
                      <Icon size={16} /> {item.badge || itemLabel}
                    </div>
                    <h2 className="mt-4 text-2xl font-black leading-tight text-[#1f3444] sm:text-3xl">{item.title}</h2>
                    {item.subtitle && <p className="mt-3 text-sm font-bold text-hayat-blue">{item.subtitle}</p>}
                    <div className="mt-5 min-h-[110px]">
                      <ExpandableText title={item.title} text={item.body || ""} className="text-sm font-semibold leading-8 text-[#607081]" />
                    </div>
                    {item.href && (
                      <Link href={item.href} className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-hayat-blue transition hover:text-hayat-green">
                        Detay <ArrowRight size={16} />
                      </Link>
                    )}
                  </div>
                </ExpandableCard>
              );

              if (linkHref) {
                return (
                  <Link key={item.id} href={linkHref} className="no-underline">
                    {card}
                  </Link>
                );
              }

              return <div key={item.id}>{card}</div>;
            })}
          </div>

          {!items.length && (
            <div className="mx-auto max-w-3xl rounded-lg border border-[#dfe7ed] bg-white p-10 text-center shadow-stk">
              <Icon className="mx-auto text-hayat-blue" size={44} />
              <h2 className="mt-5 text-3xl font-black text-[#1f3444]">{emptyTitle}</h2>
              <p className="mt-3 text-[#607081]">{emptyBody}</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
