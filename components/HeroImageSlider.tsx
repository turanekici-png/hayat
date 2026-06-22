"use client";

import { useEffect, useState } from "react";

type HeroSlide = {
  src: string;
  alt: string;
};

export function HeroImageSlider({
  images,
  className,
  showOverlay = true
}: {
  images: HeroSlide[];
  className?: string;
  showOverlay?: boolean;
}) {
  const slides = images.length ? images : [{ src: "/brand/hayat-agaci-logo.jpg", alt: "Hayat Ağacı Derneği" }];
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <div className={`relative h-full min-h-[360px] overflow-hidden rounded-lg border border-white bg-hayat-soft shadow-stk lg:min-h-full ${className || ""}`}>
      {slides.map((slide, index) => (
        <img
          key={`${slide.src}-${index}`}
          src={slide.src}
          alt={slide.alt}
          loading={index === 0 ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={index === 0 ? "high" : "auto"}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${
            index === active ? "scale-100 opacity-100" : "scale-105 opacity-0"
          }`}
        />
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
