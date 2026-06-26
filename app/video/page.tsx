import Link from "next/link";
import { ArrowLeft, Play, Video as VideoIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VideoLightboxGrid } from "@/components/VideoLightboxGrid";
import { getSectionGroupLabel, getSectionsByType } from "@/lib/site-content";
import { normalizeMediaUrl } from "@/lib/media-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type VideoSearchParams = Promise<{ video?: string | string[] }>;

function isVideoSrc(src?: string | null) {
  return Boolean(src && /\.(mp4|webm|ogg|mov)$/i.test(src));
}

function allMediaItems(section: {
  title: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  images?: Array<{ id: string; url: string; alt?: string | null; sortOrder: number }>;
}) {
  const items = (section.images || [])
    .filter((item) => item.url)
    .map((item) => ({ id: item.id, src: normalizeMediaUrl(item.url) || item.url, title: item.alt || section.imageAlt || section.title }));

  const coverUrl = normalizeMediaUrl(section.imageUrl) || section.imageUrl;
  if (coverUrl && !items.some((item) => item.src === coverUrl)) {
    items.unshift({ id: "cover", src: coverUrl, title: section.imageAlt || section.title });
  }

  return items;
}

function videoItems(section: {
  title: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  images?: Array<{ id: string; url: string; alt?: string | null; sortOrder: number }>;
}) {
  return allMediaItems(section).filter((item) => isVideoSrc(item.src));
}

export default async function VideosPage({ searchParams }: { searchParams: VideoSearchParams }) {
  const params = await searchParams;
  const selectedVideoGroupId = Array.isArray(params.video) ? params.video[0] : params.video;

  const [videoGroups, groupLabel] = await Promise.all([
    getSectionsByType("VIDEO"),
    getSectionGroupLabel("VIDEO")
  ]);

  const selectedVideoGroup = selectedVideoGroupId ? videoGroups.find((group) => group.id === selectedVideoGroupId) : null;
  const pageTitle = groupLabel?.label || "Tüm Videolar";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f6fafc]">
        <section className="border-b border-[#dfe7ed] bg-white px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href={selectedVideoGroup ? "/video" : "/#video"} className="inline-flex items-center gap-2 text-sm font-black text-hayat-blue transition hover:text-hayat-green">
                <ArrowLeft size={18} /> {selectedVideoGroup ? "Video alanlarına dön" : "Ana sayfaya dön"}
              </Link>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-hayat-green sm:mt-7">Video</p>
              <h1 className="mt-3 max-w-5xl text-3xl font-black tracking-tight text-[#1f3444] sm:text-5xl md:text-7xl">
                {selectedVideoGroup ? selectedVideoGroup.title : pageTitle}
              </h1>
            </div>
            <div className="flex w-fit items-center gap-3 rounded-md border border-[#dfe7ed] bg-[#f6fafc] px-5 py-4 text-sm font-black text-[#607081]">
              <VideoIcon className="text-hayat-blue" size={20} />
              {selectedVideoGroup ? videoItems(selectedVideoGroup).length : videoGroups.length} {selectedVideoGroup ? "video" : "alan"}
            </div>
          </div>
        </section>

        <section className="px-5 py-10 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1320px]">
            {selectedVideoGroup ? (
              <>
                <VideoLightboxGrid videos={videoItems(selectedVideoGroup)} />
                {videoItems(selectedVideoGroup).length === 0 && (
                  <div className="rounded-lg border border-dashed border-[#d5e4ec] bg-white p-10 text-center">
                    <VideoIcon className="mx-auto text-hayat-blue" size={44} />
                    <h2 className="mt-5 text-3xl font-black text-[#1f3444]">Bu alanda henüz video yok</h2>
                    <p className="mt-3 text-[#607081]">Admin panelinden bu video alanına video eklediğinizde burada görünecek.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {videoGroups.map((group) => {
                  const videos = videoItems(group);
                  const cover = videos[0] || allMediaItems(group)[0];
                  const coverIsVideo = isVideoSrc(cover?.src);

                  return (
                    <Link key={group.id} href={`/video?video=${group.id}`} className="group overflow-hidden rounded-lg border border-[#dfe7ed] bg-white shadow-stk transition hover:-translate-y-1 hover:shadow-stk-hover">
                      <div className="relative aspect-video bg-hayat-dark">
                        {cover ? (
                          coverIsVideo ? (
                            <video src={cover.src} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" preload="metadata" muted />
                          ) : (
                            <img src={cover.src} alt={cover.title} loading="lazy" decoding="async" className="h-full w-full bg-white object-contain transition duration-500" />
                          )
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-white">
                            <VideoIcon size={46} />
                          </div>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/20 transition group-hover:bg-slate-950/35">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-hayat-blue shadow-2xl">
                            <Play size={24} fill="currentColor" />
                          </span>
                        </span>
                        <span className="absolute left-4 top-4 rounded-md bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-hayat-green shadow-stk">
                          {videos.length} video
                        </span>
                      </div>
                      <div className="p-6">
                        <h2 className="text-2xl font-black leading-tight text-[#1f3444] sm:text-3xl">{group.title}</h2>
                        <p className="mt-3 text-sm font-bold text-[#607081]">Bu alanın içindeki videoları görüntüle</p>
                      </div>
                    </Link>
                  );
                })}

                {videoGroups.length === 0 && (
                  <div className="col-span-full rounded-lg border border-dashed border-[#d5e4ec] bg-white p-10 text-center">
                    <VideoIcon className="mx-auto text-hayat-blue" size={44} />
                    <h2 className="mt-5 text-3xl font-black text-[#1f3444]">Henüz video alanı eklenmemiş</h2>
                    <p className="mt-3 text-[#607081]">Admin panelinden VIDEO türünde içerik eklediğinizde burada görünecek.</p>
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
