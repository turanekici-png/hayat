import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowRight, Image as ImageIcon, LucideProps } from "lucide-react";
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

function detailHref(item: HomeSection) {
  if (item.href) return item.href;
  if (item.type === "NEWS") return `/haberler/${item.id}`;
  if (item.type === "ACTIVITY") return `/faaliyetler/${item.id}`;
  return null;
}

function detailLabel(item: HomeSection, itemLabel: string) {
  if (item.type === "NEWS") return "Haberi İncele";
  if (item.type === "CAMPAIGN") return "Projeyi İncele";
  if (item.type === "ABOUT") return "İncele";
  return `${itemLabel}i İncele`;
}

export function isCorporateSection(section: HomeSection) {
  const title = (section.title || "").toLocaleLowerCase("tr-TR");
  return section.type === "ABOUT" || title.includes("hakkımızda") || title.includes("hakkimizda") || title.includes("misyon") || title.includes("vizyon");
}

export async function SectionIndexPage({
  type,
  groupLabelType,
  filter,
  title,
  itemLabel,
  emptyTitle,
  emptyBody,
  Icon
}: SectionIndexPageProps) {
  const [sections, groupLabel] = await Promise.all([
    type ? getSectionsByType(type) : getHomeSections(),
    getSectionGroupLabel(groupLabelType || type || "")
  ]);
  const items = (type ? sections : sections.filter((section) => filter?.(section))).filter(Boolean);
  const pageTitle = groupLabel?.label || items.find((section) => section.customTitle)?.customTitle || title;

  return (
    <>
      <Header />
      <main className="bg-[#f4f8fb]">
        <section className="border-b border-[#dce8ef] bg-white px-3 py-9 sm:px-4 sm:py-11 lg:px-4">
          <div className="mx-auto max-w-[1840px]">
            <h1 className="text-[38px] font-black leading-[1.08] text-hayat-dark sm:text-[50px] md:text-[58px]">{pageTitle}</h1>
          </div>
        </section>

        <section className="px-3 py-10 sm:px-4 sm:py-12 lg:px-4">
          <div className="mx-auto grid max-w-[1840px] grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((item) => {
              const image = sectionImages(item)[0];
              const href = detailHref(item);

              return (
                <ExpandableCard key={item.id} title={item.title} subtitle={item.subtitle} body={item.body} imageUrl={image?.src} imageAlt={image?.alt} label={itemLabel} className="group h-full cursor-zoom-in overflow-hidden rounded-[24px] border border-[#d7e4eb] bg-white text-left shadow-[0_18px_50px_rgba(10,58,85,0.08)] transition duration-300 hover:-translate-y-1 hover:border-hayat-blue/30 hover:shadow-[0_24px_70px_rgba(10,58,85,0.14)]">
                  <div className="relative aspect-[16/10] overflow-hidden bg-[linear-gradient(135deg,#eaf6fb,#f4faef)]">
                    {image ? (
                      <img src={image.src} alt={image.alt} loading="lazy" decoding="async" className="h-full w-full bg-white object-cover transition duration-500 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-hayat-blue/50">
                        <ImageIcon size={44} />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-hayat-dark/65 to-transparent" />
                    <span className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] truncate rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-hayat-blue shadow-[0_10px_24px_rgba(10,58,85,0.18)]">
                      {item.badge || itemLabel}
                    </span>
                  </div>

                  <div className="flex min-h-[245px] flex-col p-6">
                    <div className="mb-4 h-1 w-14 rounded-full bg-hayat-green" />
                    <h2 className="text-[24px] font-black leading-tight text-hayat-dark">{item.title}</h2>
                    {item.subtitle && <p className="mt-3 text-sm font-black uppercase tracking-[0.08em] text-hayat-blue">{item.subtitle}</p>}
                    <div className="mt-4 flex-1">
                      <ExpandableText title={item.title} text={item.body || ""} className="line-clamp-3 text-[15px] font-semibold leading-7 text-[#5d6b70]" />
                    </div>
                    {href && (
                      <Link href={href} className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[#e8f5fb] px-4 py-2.5 text-sm font-black text-hayat-blue transition hover:bg-hayat-blue hover:text-white">
                        {detailLabel(item, itemLabel)} <ArrowRight size={15} />
                      </Link>
                    )}
                  </div>
                </ExpandableCard>
              );
            })}
          </div>

          {!items.length && (
            <div className="mx-auto max-w-3xl rounded-[20px] border border-[#ded8ca] bg-white p-10 text-center shadow-stk">
              <Icon className="mx-auto text-hayat-blue" size={44} />
              <h2 className="mt-5 text-3xl font-black text-hayat-dark">{emptyTitle}</h2>
              <p className="mt-3 text-[#5d6b70]">{emptyBody}</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
