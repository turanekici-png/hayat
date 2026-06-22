"use client";

import { Children, type ReactNode } from "react";

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
  const baseScrollClasses = "flex overflow-x-auto gap-6 pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

  if (!animate || items.length < 2) {
    return <div className={`${baseScrollClasses} ${className}`}>{items}</div>;
  }

  return (
    <div className={`auto-scroll-row group overflow-hidden pb-2 ${className}`}>
      <div className="auto-scroll-track flex w-max">
        <div className={`auto-scroll-set flex shrink-0 ${setClassName}`}>
          {items}
        </div>
        <div className={`auto-scroll-set flex shrink-0 ${setClassName}`} aria-hidden="true">
          {items.map((item, index) => (
            <div key={`copy-${index}`} className="contents">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
