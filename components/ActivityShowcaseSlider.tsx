﻿"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";

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
  titleSize?: number | null;
  subtitleSize?: number | null;
  bodySize?: number | null;
  titleColor?: string | null;
  subtitleColor?: string | null;
  bodyColor?: string | null;
  textAlign?: string | null;
  slides: ActivitySlide[];
};

function safeAlign(value?: string | null): CSSProperties["textAlign"] {
  return value === "center" || value === "right" || value === "justify" ? value : "left";
}

function titleStyle(item: ActivityShowcaseItem, fallbackColor = "#007bb8", fallbackSize = 56): CSSProperties {
  return {
    color: item.titleColor || fallbackColor,
    fontSize: `${item.titleSize || fallbackSize}px`,
    textAlign: safeAlign(item.textAlign)
  };
}

function subtitleStyle(item: ActivityShowcaseItem, fallbackColor = "#6FB744", fallbackSize = 11): CSSProperties {
  return {
    color: item.subtitleColor || fallbackColor,
    fontSize: `${item.subtitleSize || fallbackSize}px`,
    textAlign: safeAlign(item.textAlign)
  };
}

function bodyStyle(item: ActivityShowcaseItem, fallbackColor = "#334b5f", fallbackSize = 18): CSSProperties {
  return {
    color: item.bodyColor || fallbackColor,
    fontSize: `${item.bodySize || fallbackSize}px`,
    textAlign: safeAlign(item.textAlign),
    whiteSpace: "pre-line"
  };
}

export function ActivityShowcaseSlider({
  items,
  defaultHref = "/faaliyetler",
  defaultButtonLabel = "Faaliyeti İncele",
  dotLabel = "faaliyet",
  showDefaultButton = false,
  splitMedia = false,
  mediaFirst = false,
  mediaWide = false,
  mediaExtraWidth = false,
  showFullMedia = false,
  blurMediaFill = false,
  compactMedia = false,
  extendedMedia = false,
  equalColumns = false,
  showBody = true
}: {
  items: ActivityShowcaseItem[];
  defaultHref?: string;
  defaultButtonLabel?: string;
  dotLabel?: string;
  showDefaultButton?: boolean;
  splitMedia?: boolean;
  mediaFirst?: boolean;
  mediaWide?: boolean;
  mediaExtraWidth?: boolean;
  showFullMedia?: boolean;
  blurMediaFill?: boolean;
  compactMedia?: boolean;
  extendedMedia?: boolean;
  equalColumns?: boolean;
  showBody?: boolean;
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
    const splitHeightClass = extendedMedia
      ? "h-[calc(560px+4cm)] grid-rows-[minmax(0,1fr)_220px] sm:h-[calc(600px+4cm)] sm:grid-rows-[minmax(0,1fr)_280px] lg:h-[calc(520px+4cm)]"
      : compactMedia
      ? "h-[560px] grid-rows-[minmax(0,1fr)_220px] sm:h-[600px] sm:grid-rows-[minmax(0,1fr)_280px] lg:h-[520px]"
      : "h-[620px] grid-rows-[minmax(0,1fr)_260px] sm:h-[700px] sm:grid-rows-[minmax(0,1fr)_330px] lg:h-[680px]";
    const splitColumnsClass = equalColumns
      ? "lg:grid-cols-2"
      : mediaWide
      ? mediaExtraWidth
        ? (mediaFirst ? "lg:grid-cols-[calc(66.666667%+1.5cm)_minmax(0,calc(33.333333%-1.5cm))]" : "lg:grid-cols-[minmax(0,calc(33.333333%-1.5cm))_calc(66.666667%+1.5cm)]")
        : (mediaFirst ? "lg:grid-cols-[2fr_1fr]" : "lg:grid-cols-[1fr_2fr]")
      : "lg:grid-cols-[0.72fr_1.28fr]";

    return (
      <div className={`relative grid ${splitHeightClass} overflow-hidden rounded-lg border border-[#dfe7ed] bg-white shadow-stk lg:grid-rows-none ${splitColumnsClass}`}>
        <div className={`z-10 flex min-h-0 items-center overflow-hidden bg-white px-6 py-9 sm:px-10 lg:px-10 ${mediaFirst ? "lg:order-2" : ""}`}>
          <div className="max-w-[430px]">
            {(current.badge || current.subtitle) && (
              <div className="mb-4 inline-flex w-fit items-center rounded-md border border-hayat-border bg-hayat-soft px-3 py-2 text-[10px] font-black uppercase text-hayat-green shadow-stk sm:px-4 sm:py-2.5 sm:text-[11px]">
                <span style={subtitleStyle(current)}>{current.badge || current.subtitle}</span>
              </div>
            )}
            <h3
              className="text-3xl font-black leading-[1.08] text-hayat-dark sm:text-4xl md:text-5xl"
              style={titleStyle(current, "#0a3a55", 42)}
            >
              {current.title}
            </h3>
            {showBody && body && (
              <p className="mt-4 line-clamp-6 whitespace-pre-line text-sm font-semibold leading-7 text-[#5d6b70] sm:mt-6 md:text-base md:leading-8" style={bodyStyle(current, "#5d6b70", 16)}>
                {body}
              </p>
            )}
            {(showDefaultButton || current.buttonLabel || current.href) && (
              <Link
                href={current.href || defaultHref}
                className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-hayat-green px-5 text-xs font-black text-white shadow-green transition hover:bg-hayat-blue sm:mt-8 sm:h-14 sm:px-8 sm:text-sm"
              >
                {current.buttonLabel || defaultButtonLabel} <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>

        <div className={`relative min-h-0 overflow-hidden bg-hayat-soft ${mediaFirst ? "lg:order-1" : ""}`}>
          {activeImage ? (
            <>
              {blurMediaFill && (
                <>
                  <img
                    key={`${current.id}-${activeImage.src}-blur`}
                    src={activeImage.src}
                    alt=""
                    aria-hidden="true"
                    loading={active === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="absolute inset-0 h-full w-full scale-110 object-cover object-center opacity-55 blur-2xl"
                  />
                  <div className="absolute inset-0 bg-white/28" />
                </>
              )}
              <img
                key={`${current.id}-${activeImage.src}`}
                src={activeImage.src}
                alt={activeImage.alt}
                loading={active === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={active === 0 ? "high" : "auto"}
                className={`relative z-10 block h-full w-full object-center ${mediaWide && !showFullMedia && !blurMediaFill ? "object-cover" : "object-contain"}`}
              />
            </>
          ) : (
            <div className="h-full w-full bg-[#eef5f8]" />
          )}
        </div>

        {items.length > 1 && (
          <div className="absolute bottom-5 left-6 z-20 flex gap-2 sm:left-10 lg:left-12">
            {items.map((item, index) => (
              <button
                key={`${item.id}-dot`}
                type="button"
                aria-label={`${index + 1}. ${dotLabel}`}
                onClick={() => setActive(index)}
                className={`h-2.5 rounded-full transition-all ${index === active ? "w-9 bg-hayat-blue shadow-stk" : "w-2.5 bg-hayat-border hover:bg-hayat-blue"}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-[360px] overflow-hidden rounded-lg border border-[#dfe7ed] bg-white shadow-stk sm:h-[460px] md:h-[600px]">
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
              <span style={subtitleStyle(current)}>{current.badge || current.subtitle}</span>
            </div>
          )}
          <h3 className="max-w-3xl text-3xl font-black leading-[1.12] text-hayat-blue sm:text-4xl md:text-5xl xl:text-6xl" style={titleStyle(current)}>
            {current.title}
          </h3>
          {showBody && body && (
            <p className="mt-4 line-clamp-4 max-w-2xl whitespace-pre-line text-sm font-semibold leading-7 text-[#334b5f] sm:mt-7 md:text-lg md:leading-8" style={bodyStyle(current)}>
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
