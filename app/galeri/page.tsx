import Link from "next/link";
import { ArrowLeft, Camera, Images, Play, Video } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MediaLightboxTile } from "@/components/MediaLightboxTile";
import { getSectionsByType, type HomeSection } from "@/lib/site-content";
import { normalizeMediaUrl } from "@/lib/media-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GalleryItem = {
  id: string;
  src: string;
  title: string;
  sectionTitle: string;
  kind: "image" | "video";
};

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
  const looksLikeGeneratedName = /^(img|dsc|vid|video|foto|photo|whatsapp|p)[-_ ]?\d*/i.test(normalized) || (hadExtension && !/\s/.test(withoutExtension));

  if (!withoutExtension || genericNames.includes(normalized) || looksLikeGeneratedName) {
    return fallback;
  }

  return withoutExtension;
}

function sectionMediaItems(section: HomeSection, fallbackKind: "image" | "video") {
  const sectionTitle = cleanMediaTitle(section.title, fallbackKind === "video" ? "Video Blog" : "Galeri");
  const items = (section.images || [])
    .filter((image) => image.url)
    .map((image, index) => {
      const src = normalizeMediaUrl(image.url) || image.url;
      const kind = isVideoSrc(src) ? "video" : fallbackKind;
      const titleFallback = kind === "video" ? sectionTitle || "Video Blog" : sectionTitle || "Galeri";

      return {
        id: `${section.id}-${image.id || index}`,
        src,
        title: cleanMediaTitle(image.alt || section.imageAlt || section.title, titleFallback),
        sectionTitle,
        kind
      };
    });

  const coverUrl = normalizeMediaUrl(section.imageUrl) || section.imageUrl;
  if (coverUrl && !items.some((item) => item.src === coverUrl)) {
    const kind = isVideoSrc(coverUrl) ? "video" : fallbackKind;
    items.unshift({
      id: `${section.id}-cover`,
      src: coverUrl,
      title: cleanMediaTitle(section.imageAlt || section.title, kind === "video" ? sectionTitle || "Video Blog" : sectionTitle || "Galeri"),
      sectionTitle,
      kind
    });
  }

  return items;
}

function uniqueItems(items: GalleryItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.src)) return false;
    seen.add(item.src);
    return true;
  });
}

export default async function GalleryPage() {
  const [gallerySections, videoSections] = await Promise.all([
    getSectionsByType("GALLERY"),
    getSectionsByType("VIDEO")
  ]);

  const items = uniqueItems([
    ...gallerySections.flatMap((section) => sectionMediaItems(section, "image")),
    ...videoSections.flatMap((section) => sectionMediaItems(section, "video"))
  ]);
  const imageCount = items.filter((item) => item.kind === "image").length;
  const videoCount = items.filter((item) => item.kind === "video").length;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f4f9fb]">
        <section className="border-b border-[#dfe7ed] bg-[#f7f5ef] px-3 py-7 sm:px-4 lg:px-4">
          <div className="mx-auto flex max-w-[1840px] flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href="/#galeri" className="inline-flex items-center gap-2 text-sm font-black text-hayat-blue transition hover:text-hayat-green">
                <ArrowLeft size={18} /> Ana sayfaya dön
              </Link>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-hayat-green">Medya Galerisi</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-hayat-dark sm:text-6xl">Galeri</h1>
            </div>

            <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:w-auto">
              <div className="rounded-[18px] border border-[#dbe6ee] bg-white px-5 py-4 shadow-stk">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-hayat-green">
                  <Images size={16} /> Resim
                </div>
                <p className="mt-2 text-3xl font-black text-hayat-dark">{imageCount}</p>
              </div>
              <div className="rounded-[18px] border border-[#dbe6ee] bg-white px-5 py-4 shadow-stk">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-hayat-blue">
                  <Video size={16} /> Video
                </div>
                <p className="mt-2 text-3xl font-black text-hayat-dark">{videoCount}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-3 py-8 sm:px-4 lg:px-4">
          <div className="mx-auto max-w-[1840px]">
            {items.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {items.map((item) => (
                  <article key={item.id} className="group overflow-hidden rounded-[24px] border border-[#dbe6ee] bg-white shadow-[0_18px_46px_rgba(10,58,85,0.1)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(10,58,85,0.16)]">
                    <div className="relative aspect-[16/11] overflow-hidden bg-white">
                      <MediaLightboxTile
                        src={item.src}
                        alt={item.title}
                        isVideo={item.kind === "video"}
                        className="h-full w-full bg-white object-cover transition duration-700 group-hover:scale-105"
                        videoClassName="h-full w-full bg-black object-cover"
                      />
                      <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-hayat-blue shadow-[0_12px_28px_rgba(10,58,85,0.14)]">
                        {item.kind === "video" ? <Play size={14} fill="currentColor" /> : <Camera size={14} />}
                        {item.kind === "video" ? "Video" : "Resim"}
                      </span>
                    </div>
                    <div className="p-5">
                      <h2 className="line-clamp-2 text-2xl font-black leading-tight text-hayat-dark">{item.title}</h2>
                      <p className="mt-2 line-clamp-1 text-sm font-bold text-[#607081]">{item.sectionTitle}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-[#cfe0ea] bg-white p-10 text-center shadow-stk">
                <Images className="mx-auto text-hayat-blue" size={46} />
                <h2 className="mt-5 text-3xl font-black text-hayat-dark">Henüz galeri içeriği eklenmemiş</h2>
                <p className="mt-3 text-[#607081]">Admin panelinden resim veya video eklediğinizde burada görünecek.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
