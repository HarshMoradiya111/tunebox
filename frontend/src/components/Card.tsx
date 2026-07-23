"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { MockMediaItem } from "@/lib/mockData";

interface CardProps {
  item: MockMediaItem;
}

export default function Card({ item }: CardProps) {
  const href = item.type === "album" ? `/album/${item.id}` : `/playlist/${item.id}`;

  return (
    <Link
      href={href}
      className="p-4 bg-[#181818] hover:bg-[#282828] transition-all duration-300 rounded-lg group cursor-pointer flex flex-col gap-3 relative"
    >
      <div className="relative aspect-square w-full rounded-md shadow-lg overflow-hidden bg-[#242424]">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Floating Green Play Button on Hover */}
        <button className="w-12 h-12 rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 shadow-xl flex items-center justify-center text-black absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <Play className="w-5 h-5 fill-current translate-x-0.5" />
        </button>
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
