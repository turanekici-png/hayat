"use client";

import { Children, type ReactNode, useEffect, useRef, useState } from "react";

export function AutoScrollRow({
  children,
  animate = true,
  className = "",
  setClassName = "gap-6"
}: {
  children: ReactNode;
  animate?: boolean;
  className?: string;
  setClassName?: string;
}) {
  const items = Children.toArray(children);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setRef = useRef<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const shouldAnimate = animate && items.length > 1 && hasOverflow;

  useEffect(() => {
    const container = containerRef.current;
    const set = setRef.current;
    if (!container || !set) return;

    const update = () => {
      setHasOverflow(set.scrollWidth > container.clientWidth + 8);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    observer.observe(set);
    window.addEventListener("load", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("load", update);
    };
  }, [items.length, animate]);

  return (
    <div ref={containerRef} className={`${shouldAnimate ? "auto-scroll-row group overflow-hidden" : "overflow-x-auto snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"} pb-2 ${className}`}>
      <div className="auto-scroll-track flex w-max">
        <div ref={setRef} className={`${shouldAnimate ? "auto-scroll-set" : ""} flex shrink-0 ${setClassName}`}>
          {items}
        </div>
        {shouldAnimate && (
          <div className={`auto-scroll-set flex shrink-0 ${setClassName}`} aria-hidden="true">
            {items.map((item, index) => (
              <div key={`copy-${index}`} className="contents">
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
