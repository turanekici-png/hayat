"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Video kutusu onizlemesi: video ancak ekrana yaklastiginda yuklenmeye baslar.
 * Boylece sayfadaki tum videolar acilista ayni anda inmeye calisip resimlerin
 * onunu tikamaz. "#t=0.1" iPhone/Safari'de ilk karenin gorunmesini saglar.
 */
export function LazyVideoPreview({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  const previewSrc = src.includes("#") ? src : `${src}#t=0.1`;

  return (
    <video
      ref={ref}
      src={visible ? previewSrc : undefined}
      className={className}
      preload={visible ? "metadata" : "none"}
      muted
      playsInline
    />
  );
}
