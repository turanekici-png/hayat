"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ActivitySlide = {
  src: string;
  alt: string;
};

type ActivityShowcaseItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  badge?: string | null;
  href?: string | null;
  buttonLabel?: string | null;
  slides: ActivitySlide[];
};

export function ActivityShowcaseSlider({
  items,
  defaultHref = "/faaliyetler",
  defaultButtonLabel = "Faaliyeti İncele",
  dotLabel = "faaliyet",
  showDefaultButton = false,
  splitMedia = false
}: {
  items: ActivityShowcaseItem[];
  defaultHref?: string;
  defaultButtonLabel?: string;
  dotLabel?: string;
  showDefaultButton?: boolean;
  splitMedia?: boolean;
}) {
  const [active, setActive] = useState(0);
  const current = items[active] || items[0];

  useEffect(() => {
    if (items.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((value) => (value + 1) % items.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [items.length]);

  if (!current) return null;

  const activeImage = current.slides[0];
  const body = current.body?.trim();

  if (splitMedia) {
    return (
      <div className="relative grid min-h-[360px] overflow-hidden rounded-lg border border-[#dfe7ed] bg-white shadow-stk md:min-h-[520px] lg:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)]">
        <div className="z-10 flex min-w-0 flex-col justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            {(current.badge || current.subtitle) && (
              <div className="mb-4 inline-flex w-fit items-center rounded-md border border-[#dfe7ed] bg-white px-3 py-2 text-[10px] font-black uppercase text-hayat-green shadow-stk sm:px-4 sm:py-2.5 sm:text-[11px]">
                {current.badge || current.subtitle}
              </div>
            )}
            <h3 className="text-3xl font-black leading-[1.12] text-hayat-blue sm:text-4xl md:text-5xl xl:text-6xl">
              {current.title}
            </h3>
            {body && (
              <p className="mt-4 line-clamp-4 whitespace-pre-line text-sm font-semibold leading-7 text-[#334b5f] sm:mt-7 md:text-lg md:leading-8">
                {body}
              </p>
            )}
            {(showDefaultButton || current.buttonLabel || current.href) && (
              <Link
                href={current.href || defaultHref}
                className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-hayat-green px-5 text-xs font-black text-white shadow-green transition hover:bg-hayat-dark sm:mt-8 sm:h-14 sm:px-8 sm:text-sm"
              >
                {current.buttonLabel || defaultButtonLabel} <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>

        <div className="relative min-h-[260px] bg-white md:min-h-[520px]">
          {items.map((item, index) => {
            const image = item.slides[0];
            return image ? (
              <img
                key={item.id}
                src={image.src}
                alt={image.alt}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={index === 0 ? "high" : "auto"}
                className={`absolute inset-0 h-full w-full bg-white object-contain transition-all duration-1000 ${
                  index === active ? "scale-100 opacity-100" : "scale-100 opacity-0"
                }`}
              />
            ) : null;
          })}
          {!activeImage && <div className="absolute inset-0 bg-[#eef5f8]" />}
        </div>

        {items.length > 1 && (
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {items.map((item, index) => (
              <button
                key={`${item.id}-dot`}
                type="button"
                aria-label={`${index + 1}. ${dotLabel}`}
                onClick={() => setActive(index)}
                className={`h-2.5 rounded-full transition-all ${index === active ? "w-9 bg-hayat-blue shadow-stk" : "w-2.5 bg-hayat-blue/30 hover:bg-hayat-blue/60"}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-[#dfe7ed] bg-white shadow-stk sm:min-h-[460px] md:min-h-[600px]">
      {items.map((item, index) => {
        const image = item.slides[0];
        return image ? (
          <img
            key={item.id}
            src={image.src}
            alt={image.alt}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={index === 0 ? "high" : "auto"}
            className={`absolute inset-0 h-full w-full bg-white object-contain transition-all duration-1000 ${
              index === active ? "scale-100 opacity-100" : "scale-105 opacity-0"
            }`}
          />
        ) : null;
      })}
      {!activeImage && <div className="absolute inset-0 bg-[#eef5f8]" />}
      <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/68 to-white/18" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/25 via-transparent to-transparent" />

      <div className="absolute inset-0 z-10 flex flex-col justify-end items-start px-5 py-10 sm:px-8 md:py-16 lg:px-12">
        <div className="max-w-3xl">
          {(current.badge || current.subtitle) && (
            <div className="mb-4 inline-flex w-fit items-center rounded-md border border-white/60 bg-white/95 px-3 py-2 text-[10px] font-black uppercase text-hayat-green shadow-stk sm:mb-7 sm:px-4 sm:py-2.5 sm:text-[11px]">
              {current.badge || current.subtitle}
            </div>
          )}
          <h3 className="max-w-3xl text-3xl font-black leading-[1.12] text-hayat-blue sm:text-4xl md:text-5xl xl:text-6xl">
            {current.title}
          </h3>
          {body && (
            <p className="mt-4 line-clamp-4 max-w-2xl whitespace-pre-line text-sm font-semibold leading-7 text-[#334b5f] sm:mt-7 md:text-lg md:leading-8">
              {body}
            </p>
          )}
          {(showDefaultButton || current.buttonLabel || current.href) && (
            <Link
              href={current.href || defaultHref}
              className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-hayat-green px-5 text-xs font-black text-white shadow-green transition hover:bg-hayat-dark sm:mt-8 sm:h-14 sm:px-8 sm:text-sm"
            >
              {current.buttonLabel || defaultButtonLabel} <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>

      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {items.map((item, index) => (
            <button
              key={`${item.id}-dot`}
              type="button"
              aria-label={`${index + 1}. ${dotLabel}`}
              onClick={() => setActive(index)}
              className={`h-2.5 rounded-full transition-all ${index === active ? "w-9 bg-white shadow-stk" : "w-2.5 bg-white/60 hover:bg-white"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
