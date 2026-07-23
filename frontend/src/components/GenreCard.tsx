import Image from "next/image";
import { MockGenre } from "@/lib/mockData";

interface GenreCardProps {
  genre: MockGenre;
}

export default function GenreCard({ genre }: GenreCardProps) {
  return (
    <div
      className={`aspect-square p-4 rounded-xl overflow-hidden relative font-bold text-2xl text-white cursor-pointer hover:scale-[1.03] transition-all duration-300 shadow-md bg-gradient-to-br ${genre.color}`}
    >
      <span className="relative z-10 drop-shadow-md">{genre.name}</span>
      <div className="absolute -bottom-2 -right-3 w-28 h-28 rotate-[25deg] shadow-2xl rounded-md overflow-hidden">
        <Image
          src={genre.image}
          alt={genre.name}
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
}
