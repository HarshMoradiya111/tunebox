"use client";

import Image from "next/image";
import { Play, Pause, Heart, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { MockTrack } from "@/lib/mockData";
import { usePlayer, PlayerTrack } from "@/store/playerStore";

interface TrackRowProps {
  track: MockTrack;
  index: number;
  /** All tracks in the current list (for queue) */
  allTracks?: MockTrack[];
}

function mockToPlayerTrack(t: MockTrack): PlayerTrack {
  return {
    id: t.id,
    spotifyId: t.spotifyId,
    title: t.title,
    artist: t.artist,
    album: t.album,
    albumArt: t.albumArt,
    duration: t.duration,
    // streamUrl will be set by Phase 6 fetch-on-miss logic
    streamUrl: undefined,
  };
}

export default function TrackRow({ track, index, allTracks }: TrackRowProps) {
  const { currentTrack, isPlaying, playTrack, playQueue, togglePlay } =
    usePlayer();
  const [isLiked, setIsLiked] = useState(false);

  const isCurrentTrack = currentTrack?.id === track.id || currentTrack?.spotifyId === track.spotifyId;
  const isActive = isCurrentTrack && isPlaying;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else if (allTracks && allTracks.length > 0) {
      playQueue(allTracks.map(mockToPlayerTrack), index);
    } else {
      playTrack(mockToPlayerTrack(track));
    }
  };

  return (
    <div
      className="grid grid-cols-[16px_4fr_3fr_2fr_minmax(100px,1fr)] items-center gap-4 px-4 py-2.5 rounded-md hover:bg-[#ffffff10] text-[#b3b3b3] text-sm group cursor-pointer transition-colors select-none"
      onDoubleClick={handlePlay}
    >
      {/* Column 1: Index Number / Play Icon */}
      <div className="flex items-center justify-center font-medium">
        <button
          onClick={handlePlay}
          className="text-white hover:scale-110 transition-transform"
        >
          {isActive ? (
            <Pause className="w-4 h-4 fill-current text-[#1db954]" />
          ) : (
            <>
              <span className={`group-hover:hidden ${isCurrentTrack ? "text-[#1db954]" : ""}`}>
                {index + 1}
              </span>
              <Play className="w-4 h-4 fill-current hidden group-hover:block text-white" />
            </>
          )}
        </button>
      </div>

      {/* Column 2: Cover Art, Title & Artist */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-10 h-10 rounded overflow-hidden bg-[#242424] shrink-0">
          <Image
            src={track.albumArt}
            alt={track.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col truncate">
          <span
            className={`font-medium truncate hover:underline cursor-pointer ${
              isCurrentTrack ? "text-[#1db954]" : "text-white"
            }`}
          >
            {track.title}
          </span>
          <span className="text-xs text-[#b3b3b3] hover:underline cursor-pointer truncate">
            {track.artist}
          </span>
        </div>
      </div>

      {/* Column 3: Album */}
      <span className="truncate hover:underline cursor-pointer hidden md:inline">
        {track.album}
      </span>

      {/* Column 4: Date Added */}
      <span className="truncate hidden lg:inline">{track.dateAdded}</span>

      {/* Column 5: Heart, Duration & More */}
      <div className="flex items-center justify-end gap-3 text-xs">
        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`opacity-0 group-hover:opacity-100 transition-opacity ${
            isLiked ? "opacity-100 text-[#1db954]" : "text-[#b3b3b3] hover:text-white"
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
        </button>
        <span>{formatDuration(track.duration)}</span>
        <button className="opacity-0 group-hover:opacity-100 text-[#b3b3b3] hover:text-white transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
