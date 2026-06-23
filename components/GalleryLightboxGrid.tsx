"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type GalleryImage = {
  id: string;
  src: string;
  alt: string;
};

export function GalleryLightboxGrid({ images }: { images: GalleryImage[] }) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedImage) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedImage(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedImage]);

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <button key={image.id} type="button" onClick={() => setSelectedImage(image)} className="group overflow-hidden rounded-lg border border-[#dfe7ed] bg-white text-left shadow-stk outline-none transition hover:-translate-y-1 hover:shadow-stk-hover focus-visible:ring-4 focus-visible:ring-hayat-green/30">
            <img src={image.src} alt={image.alt} loading="lazy" decoding="async" className="h-72 w-full bg-white object-contain transition duration-500" />
          </button>
        ))}
      </div>

      {selectedImage && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 p-4" role="dialog" aria-modal="true" onClick={() => setSelectedImage(null)}>
          <button type="button" onClick={() => setSelectedImage(null)} className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-hayat-dark shadow-stk transition hover:bg-hayat-green hover:text-white" aria-label="Kapat">
            <X size={22} />
          </button>
          <img src={selectedImage.src} alt={selectedImage.alt} className="max-h-[88vh] max-w-[94vw] rounded-lg object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} />
        </div>,
        document.body
      )}
    </>
  );
}
