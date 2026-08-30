import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { normalizeMediaUrl } from "@/lib/media-url";
import { CalendarDays } from "lucide-react";
import { unstable_cache } from "next/cache";

export const revalidate = 60; // ISR: Cloudflare/CDN'de önbelleklenebilir olsun diye force-dynamic kaldırıldı

// Sayfa her istekte yeniden render edilse de veri sorgusu 60sn cache'lenir;
// admin panelden yapılan güncellemeler revalidateTag("site-content") ile aninda yansir.
const getSectionById = unstable_cache(
  (id: string) => prisma.siteSection.findUnique({ where: { id }, include: { images: true } }).catch(() => null),
  ["activity-detail-by-id"],
  { revalidate: 60, tags: ["site-content"] }
);

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const section = await getSectionById(id);
  if (!section || !section.isActive) notFound();

  const rawImage = Array.isArray(section.images) && section.images.length ? section.images[0].url : section.imageUrl;
  const image = normalizeMediaUrl(rawImage) || rawImage;

  return (
    <>
      <Header />
      <main className="bg-hayat-soft px-3 py-14 sm:px-4 lg:px-4">
        <article className="mx-auto max-w-[1840px] rounded-[2rem] bg-white p-6 shadow-soft md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-black uppercase tracking-[.22em] text-hayat-green">{section.badge || "Faaliyet"}</p>
              <h1 className="mt-3 text-4xl font-black text-hayat-dark md:text-6xl">{section.title}</h1>
            </div>
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-hayat-mint text-hayat-green">
              <CalendarDays size={32} />
            </div>
          </div>
          {image && <img src={image} alt={section.imageAlt || section.title} className="mt-8 max-h-[620px] w-full rounded-lg bg-white object-contain" />}
          <div className="mt-8 whitespace-pre-line rounded-[1.5rem] bg-slate-50 p-6 text-lg font-semibold leading-9 text-slate-700 md:p-8">
            {section.body}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
