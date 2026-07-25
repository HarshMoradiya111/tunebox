"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { MediaItem } from "@/types";

interface CardProps {
  item: MediaItem;
}

function Card({ item }: CardProps) {
  let href = `/playlist/${item.id}`;
  if (item.type === "album") href = `/album/${item.id}`;
  if (item.type === "artist") href = `/artist/${encodeURIComponent(item.id)}`;

  return (
    <Link
      href={href}
      className="p-4 bg-[#181818] hover:bg-[#282828] transition-all duration-300 rounded-lg group cursor-pointer flex flex-col gap-3 relative"
    >
      <div className={`relative aspect-square w-full shadow-lg bg-[#242424] ${item.type === "artist" ? "rounded-full" : "rounded-md overflow-hidden"}`}>
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          className={`object-cover group-hover:scale-105 transition-transform duration-300 ${item.type === "artist" ? "rounded-full" : ""}`}
        />
        {/* Floating Green Play Button - Always visible on mobile, hover-only on desktop */}
        <div aria-hidden="true" className="w-12 h-12 rounded-full bg-[#1db954] group-hover:bg-[#1ed760] hover:scale-105 shadow-xl flex items-center justify-center text-black absolute bottom-2 right-2 md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0 transition-all duration-300">
          <Play className="w-5 h-5 fill-current translate-x-0.5" />
        </div>
      </div>

      <div className="flex flex-col gap-1 min-w-0">
        <h3 className="font-bold text-white text-base truncate">{item.title}</h3>
        <p className="text-sm text-[#b3b3b3] line-clamp-2 leading-relaxed">
          {item.subtitle}
        </p>
      </div>
    </Link>
  );
}

export default memo(Card);
