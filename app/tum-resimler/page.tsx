import Link from "next/link";
import { ArrowLeft, Images, Image as ImageIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GalleryLightboxGrid } from "@/components/GalleryLightboxGrid";
import { getSectionGroupLabel, getSectionsByType } from "@/lib/site-content";

export const revalidate = 60;

type AllImagesSearchParams = Promise<{ galeri?: string | string[] }>;

function mediaItems(section: {
  title: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  images?: Array<{ id: string; url: string; alt?: string | null; sortOrder: number }>;
}) {
  const items = (section.images || [])
    .filter((image) => image.url)
    .map((image) => ({ id: image.id, src: image.url, alt: image.alt || section.imageAlt || section.title }));

  if (section.imageUrl && !items.some((item) => item.src === section.imageUrl)) {
    items.unshift({ id: "cover", src: section.imageUrl, alt: section.imageAlt || section.title });
  }

  return items;
}

export default async function AllImagesPage({ searchParams }: { searchParams: AllImagesSearchParams }) {
  const params = await searchParams;
  const selectedGalleryId = Array.isArray(params.galeri) ? params.galeri[0] : params.galeri;

  const [galleries, groupLabel] = await Promise.all([
    getSectionsByType("GALLERY"),
    getSectionGroupLabel("GALLERY")
  ]);

  const selectedGallery = selectedGalleryId ? galleries.find((gallery) => gallery.id === selectedGalleryId) : null;
  const pageTitle = groupLabel?.label || "Tüm Resimler";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f6fafc]">
        <section className="border-b border-[#dfe7ed] bg-white px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href={selectedGallery ? "/tum-resimler" : "/#galeri"} className="inline-flex items-center gap-2 text-sm font-black text-hayat-blue transition hover:text-hayat-green">
                <ArrowLeft size={18} /> {selectedGallery ? "Galerilere dön" : "Ana sayfaya dön"}
              </Link>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-hayat-green sm:mt-7">Galeri</p>
              <h1 className="mt-3 max-w-5xl text-3xl font-black tracking-tight text-[#1f3444] sm:text-5xl md:text-7xl">
                {selectedGallery ? selectedGallery.title : pageTitle}
              </h1>
            </div>
            <div className="flex w-fit items-center gap-3 rounded-md border border-[#dfe7ed] bg-[#f6fafc] px-5 py-4 text-sm font-black text-[#607081]">
              <Images className="text-hayat-blue" size={20} />
              {selectedGallery ? mediaItems(selectedGallery).length : galleries.length} {selectedGallery ? "resim" : "galeri"}
            </div>
          </div>
        </section>

        <section className="px-5 py-10 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1320px]">
            {selectedGallery ? (
              <>
                <GalleryLightboxGrid images={mediaItems(selectedGallery)} />
                {mediaItems(selectedGallery).length === 0 && (
                  <div className="rounded-lg border border-dashed border-[#d5e4ec] bg-white p-10 text-center">
                    <ImageIcon className="mx-auto text-hayat-blue" size={44} />
                    <h2 className="mt-5 text-3xl font-black text-[#1f3444]">Bu galeride henüz resim yok</h2>
                    <p className="mt-3 text-[#607081]">Admin panelinden bu galeriye resim eklediğinizde burada görünecek.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {galleries.map((gallery) => {
                  const images = mediaItems(gallery);
                  const cover = images[0];

                  return (
                    <Link key={gallery.id} href={`/tum-resimler?galeri=${gallery.id}`} className="group overflow-hidden rounded-lg border border-[#dfe7ed] bg-white shadow-stk transition hover:-translate-y-1 hover:shadow-stk-hover">
                      <div className="relative h-64 bg-hayat-soft">
                        {cover ? (
                    <img src={cover.src} alt={cover.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-hayat-blue">
                            <ImageIcon size={46} />
                          </div>
                        )}
                        <span className="absolute left-4 top-4 rounded-md bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-hayat-green shadow-stk">
                          {images.length} resim
                        </span>
                      </div>
                      <div className="p-6">
                        <h2 className="text-2xl font-black leading-tight text-[#1f3444] sm:text-3xl">{gallery.title}</h2>
                        <p className="mt-3 text-sm font-bold text-[#607081]">Bu galerinin içindeki resimleri görüntüle</p>
                      </div>
                    </Link>
                  );
                })}

                {galleries.length === 0 && (
                  <div className="col-span-full rounded-lg border border-dashed border-[#d5e4ec] bg-white p-10 text-center">
                    <Images className="mx-auto text-hayat-blue" size={44} />
                    <h2 className="mt-5 text-3xl font-black text-[#1f3444]">Henüz galeri eklenmemiş</h2>
                    <p className="mt-3 text-[#607081]">Admin panelinden GALLERY türünde içerik eklediğinizde burada görünecek.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
