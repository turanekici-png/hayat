"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Newspaper } from "lucide-react";
import { optimizedImageSrc, optimizedImageSrcSet } from "@/lib/image-src";

export type NewsHeroItem = {
  id: string;
  title: string;
  body?: string | null;
  badge?: string | null;
  href: string;
  buttonLabel?: string | null;
  date?: string | null;
  image?: { src: string; alt: string } | null;
};

/**
 * Ana sayfa girisindeki buyuk haber slider'i. Sadece gosterilmis ve siradaki
 * haberin gorseli yuklenir; sekme gorunmuyorken otomatik gecis durur.
 */
export function NewsHeroSlider({ items }: { items: NewsHeroItem[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [rendered, setRendered] = useState<Set<number>>(() => new Set([0, 1]));
  const count = items.length;

  useEffect(() => {
    if (!count) return;
    setRendered((value) => {
      const next = (active + 1) % count;
      if (value.has(active) && value.has(next)) return value;
      const updated = new Set(value);
      updated.add(active);
      updated.add(next);
      return updated;
    });
  }, [active, count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setActive((value) => (value + 1) % count);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (!count) return null;
  const current = items[active] || items[0];
  const go = (delta: number) => setActive((value) => (value + delta + count) % count);

  return (
    <article
      className="relative isolate flex min-h-[460px] overflow-hidden rounded-3xl bg-hayat-dark shadow-[0_24px_60px_rgba(10,58,85,0.14)] sm:min-h-[540px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Haberler"
    >
      {items.map((item, index) =>
        item.image && rendered.has(index) ? (
          <img
            key={item.id}
            src={optimizedImageSrc(item.image.src, 1920)}
            srcSet={optimizedImageSrcSet(item.image.src, [640, 1080, 1920])}
            sizes="(max-width: 1024px) 100vw, 65vw"
            alt={index === active ? item.image.alt : ""}
            aria-hidden={index === active ? undefined : true}
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            decoding="async"
            className={`absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-700 ${index === active ? "opacity-100" : "opacity-0"}`}
          />
        ) : null
      )}

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4 sm:p-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-black uppercase tracking-[0.08em] text-hayat-dark">
          <Newspaper size={15} /> {current.badge || "Haberler"}
        </span>
        <Link href="/haberler" className="rounded-full bg-[#072b40]/75 px-4 py-2 text-sm font-black text-white backdrop-blur-sm transition hover:bg-[#072b40]">
          Tüm haberler →
        </Link>
      </div>

      <div className="mt-auto w-full bg-gradient-to-t from-[#072b40] via-[#072b40]/85 to-transparent px-5 pb-6 pt-28 text-white sm:px-9 sm:pb-8">
        {current.date && <p className="text-sm font-bold text-[#b9cfdc]">{current.date}</p>}
        <h2 className="mt-1.5 max-w-3xl font-jakarta text-[28px] font-extrabold leading-[1.1] sm:text-[40px] lg:text-[44px]">{current.title}</h2>
        {current.body && <p className="mt-3 line-clamp-3 max-w-2xl text-base leading-7 text-[#dbe8ef] sm:text-lg">{current.body}</p>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <Link href={current.href} className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-[15px] font-black text-hayat-dark transition hover:bg-hayat-green hover:text-white">
            {current.buttonLabel || "Haberi İncele"} <ArrowRight size={17} />
          </Link>
          {count > 1 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`${index + 1}. haber`}
                    aria-current={index === active ? "true" : undefined}
                    onClick={() => setActive(index)}
                    className={`h-2 rounded-full transition-all ${index === active ? "w-7 bg-white" : "w-2 bg-white/45 hover:bg-white/80"}`}
                  />
                ))}
              </div>
              <button type="button" aria-label="Önceki haber" onClick={() => go(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-white/40 text-white transition hover:bg-white/15">
                <ChevronLeft size={19} />
              </button>
              <button type="button" aria-label="Sonraki haber" onClick={() => go(1)} className="grid h-11 w-11 place-items-center rounded-full bg-white text-hayat-dark transition hover:bg-hayat-green hover:text-white">
                <ChevronRight size={19} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
