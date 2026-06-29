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
  eyebrow,
  title,
  description,
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
      <main className="bg-[#f7f5ef]">
        <section className="border-b border-[#ded8ca] bg-[#eee9dd] px-3 py-16 sm:px-4 sm:py-20 lg:px-4">
          <div className="mx-auto max-w-[1840px]">
            <p className="text-[12px] font-black uppercase tracking-[0.16em] text-hayat-green">{eyebrow}</p>
            <h1 className="mt-5 max-w-[780px] text-[42px] font-black leading-[1.08] text-hayat-dark sm:text-[56px] md:text-[64px]">{pageTitle}</h1>
            <p className="mt-5 max-w-[660px] text-[18px] font-medium leading-8 text-[#65737d] md:text-[20px] md:leading-9">{description}</p>
          </div>
        </section>

        <section className="px-3 py-12 sm:px-4 lg:px-4">
          <div className="mx-auto grid max-w-[1840px] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {items.map((item) => {
              const image = sectionImages(item)[0];
              const href = detailHref(item);

              return (
                <ExpandableCard key={item.id} title={item.title} subtitle={item.subtitle} body={item.body} imageUrl={image?.src} imageAlt={image?.alt} label={itemLabel} className="h-full cursor-zoom-in overflow-hidden rounded-[20px] border border-[#ded8ca] bg-white text-left shadow-stk transition hover:-translate-y-1 hover:shadow-stk-hover">
                  <div className="relative aspect-w-16 aspect-h-9 overflow-hidden bg-[repeating-linear-gradient(135deg,#e8f4fb_0,#e8f4fb_16px,#deedf5_16px,#deedf5_32px)]">
                    {image ? (
                      <img src={image.src} alt={image.alt} loading="lazy" decoding="async" className="h-full w-full bg-white object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-hayat-blue/50">
                        <ImageIcon size={44} />
                      </div>
                    )}
                    <span className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] truncate rounded-md bg-white px-3 py-1.5 text-[10px] font-black text-hayat-blue shadow-sm">
                      foto: {image?.alt || item.title}
                    </span>
                  </div>

                  <div className="flex min-h-[205px] flex-col p-5 sm:p-6">
                    <div className="w-fit rounded-full bg-[#dff1fa] px-3 py-1.5 text-xs font-black text-hayat-blue">
                      {item.badge || itemLabel}
                    </div>
                    <h2 className="mt-3 text-xl font-black leading-tight text-hayat-dark">{item.title}</h2>
                    {item.subtitle && <p className="mt-2 text-sm font-bold text-hayat-blue">{item.subtitle}</p>}
                    <div className="mt-3 flex-1">
                      <ExpandableText title={item.title} text={item.body || ""} className="line-clamp-3 text-[15px] font-medium leading-7 text-[#5d6b70]" />
                    </div>
                    {href && (
                      <Link href={href} className="mt-5 inline-flex w-fit items-center gap-1 text-sm font-black text-hayat-blue transition hover:text-hayat-green">
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
