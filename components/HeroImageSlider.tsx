"use client";

import { useEffect, useState } from "react";

type HeroSlide = {
  src: string;
  alt: string;
};

export function HeroImageSlider({
  images,
  className,
  showOverlay = true,
  fitToParent = false
}: {
  images: HeroSlide[];
  className?: string;
  showOverlay?: boolean;
  fitToParent?: boolean;
}) {
  const slides = images.length ? images : [{ src: "/media/brand/hayat-agaci-logo.jpg", alt: "Hayat Ağacı Derneği" }];
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setActive((current) => (current + 1) % slides.length);
    }, isMobile ? 6200 : 3200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <div className={`relative h-full overflow-hidden rounded-lg border border-white bg-hayat-soft shadow-stk ${fitToParent ? "min-h-0" : "min-h-[360px] lg:min-h-full"} ${className || ""}`}>
      {slides.map((slide, index) => (
        <div key={`${slide.src}-${index}`} className={`absolute inset-0 transition-opacity duration-1000 ${index === active ? "opacity-100" : "opacity-0"}`}>
          {fitToParent && (
            <>
              <img
                src={slide.src}
                alt=""
                aria-hidden="true"
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                className="absolute inset-0 h-full w-full scale-110 bg-white object-cover object-center opacity-45 blur-2xl"
              />
              <div className="absolute inset-0 bg-white/35" />
            </>
          )}
          <img
            src={slide.src}
            alt={slide.alt}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={index === 0 ? "high" : "auto"}
            className={`relative z-10 h-full w-full bg-white object-contain object-center transition-transform duration-1000 ${index === active ? "scale-100" : "scale-[1.015]"}`}
          />
        </div>
      ))}
      {showOverlay && <div className="absolute inset-0 bg-gradient-to-t from-hayat-dark/35 via-transparent to-transparent" />}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((slide, index) => (
            <button
              key={`${slide.src}-dot-${index}`}
              type="button"
              aria-label={`${index + 1}. görsel`}
              onClick={() => setActive(index)}
              className={`h-2.5 rounded-full transition-all ${index === active ? "w-8 bg-white" : "w-2.5 bg-white/55 hover:bg-white"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
