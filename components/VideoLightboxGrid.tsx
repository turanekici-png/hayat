"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";

type GalleryVideo = {
  id: string;
  src: string;
  title: string;
};

export function VideoLightboxGrid({ videos }: { videos: GalleryVideo[] }) {
  const [selectedVideo, setSelectedVideo] = useState<GalleryVideo | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedVideo) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedVideo(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedVideo]);

  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {videos.map((video) => (
          <button key={video.id} type="button" onClick={() => setSelectedVideo(video)} className="group overflow-hidden rounded-lg border border-[#dfe7ed] bg-white text-left shadow-stk outline-none transition hover:-translate-y-1 hover:shadow-stk-hover focus-visible:ring-4 focus-visible:ring-hayat-green/30">
            <div className="relative aspect-video bg-hayat-dark">
              <video src={video.src} className="h-full w-full object-cover" preload="metadata" muted />
              <span className="absolute inset-0 flex items-center justify-center bg-slate-950/20 transition group-hover:bg-slate-950/35">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-hayat-blue shadow-2xl transition group-hover:scale-110 group-hover:text-hayat-green">
                  <Play size={28} fill="currentColor" />
                </span>
              </span>
            </div>
            <div className="p-5">
              <h2 className="text-xl font-black text-[#1f3444]">{video.title}</h2>
            </div>
          </button>
        ))}
      </div>

      {selectedVideo && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 p-4" role="dialog" aria-modal="true" onClick={() => setSelectedVideo(null)}>
          <button type="button" onClick={() => setSelectedVideo(null)} className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-hayat-dark shadow-stk transition hover:bg-hayat-green hover:text-white" aria-label="Kapat">
            <X size={22} />
          </button>
          <video src={selectedVideo.src} className="max-h-[88vh] max-w-[94vw] rounded-lg bg-black shadow-2xl" controls autoPlay onClick={(event) => event.stopPropagation()} />
        </div>,
        document.body
      )}
    </>
  );
}
