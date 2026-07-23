import Image from "next/image";
import { Play, Heart, Clock, MoreHorizontal } from "lucide-react";
import TrackRow from "@/components/TrackRow";
import { MOCK_TRACKS } from "@/lib/mockData";

interface AlbumPageProps {
  params: Promise<{ id: string }>;
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id } = await params;

  const albumTitle = id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="flex flex-col gap-6 -mx-6 -mt-6">
      {/* Hero Banner Section */}
      <div className="bg-gradient-to-b from-purple-900 via-purple-950 to-[#121212] p-8 pt-12 flex flex-col sm:flex-row items-end gap-6">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-md shadow-2xl overflow-hidden bg-[#242424] shrink-0">
          <Image
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop"
            alt={albumTitle}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-3 min-w-0">
          <span className="text-xs uppercase tracking-wider font-bold text-white">
            Album
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight line-clamp-2">
            {albumTitle || "Featured Album"}
          </h1>
          <div className="flex items-center gap-2 text-xs text-white font-medium">
            <span className="font-bold hover:underline cursor-pointer">Sabrina Carpenter</span>
            <span>•</span>
            <span>2024</span>
            <span>•</span>
            <span>{MOCK_TRACKS.length} songs,</span>
            <span className="text-[#b3b3b3]">36 min 12 sec</span>
          </div>
        </div>
      </div>

      {/* Action Bar Section */}
      <div className="px-6 flex items-center gap-6">
        <button className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 flex items-center justify-center text-black shadow-xl transition-all">
          <Play className="w-6 h-6 fill-current translate-x-0.5" />
        </button>
        <button className="text-[#b3b3b3] hover:text-white transition-colors">
          <Heart className="w-8 h-8" />
        </button>
        <button className="text-[#b3b3b3] hover:text-white transition-colors">
          <MoreHorizontal className="w-8 h-8" />
        </button>
      </div>

      {/* Track Table Header */}
      <div className="px-6">
        <div className="grid grid-cols-[16px_4fr_3fr_2fr_minmax(100px,1fr)] items-center gap-4 px-4 py-2 text-[#b3b3b3] text-xs font-medium border-b border-[#282828] uppercase tracking-wider">
          <span>#</span>
          <span>Title</span>
          <span className="hidden md:inline">Album</span>
          <span className="hidden lg:inline">Date Added</span>
          <div className="flex justify-end">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Track Rows */}
        <div className="flex flex-col gap-1 mt-2">
          {MOCK_TRACKS.map((track, index) => (
            <TrackRow key={track.id} track={track} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
