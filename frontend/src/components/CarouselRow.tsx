"use client";

import { useState } from "react";
import Card from "./Card";
import { MediaItem } from "@/types";

interface CarouselRowProps {
  title: string;
  items: MediaItem[];
}

export default function CarouselRow({
  title,
  items,
}: CarouselRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-white hover:underline cursor-pointer truncate">
          {title}
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs sm:text-sm font-semibold text-[#b3b3b3] hover:text-white transition-colors shrink-0 whitespace-nowrap"
        >
          {isExpanded ? "Show less" : "Show all"}
        </button>
      </div>

      {isExpanded ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <Card key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:pb-0 md:grid md:grid-cols-4 lg:grid-cols-5 md:overflow-visible"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
        >
          {items.map((item) => (
            <div key={item.id} className="snap-start shrink-0 w-[140px] sm:w-[180px] md:w-auto">
              <Card item={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
