"use client";

import { Play, Pause, Heart, MoreHorizontal } from "lucide-react";
import { usePlayer, PlayerTrack } from "@/store/playerStore";
import { useState } from "react";

export default function PlaylistActionBar({ tracks }: { tracks: PlayerTrack[] }) {
  const { playQueue, isPlaying, currentTrack, pause, resume } = usePlayer();
  const [isLiked, setIsLiked] = useState(false);

  // Check if current playing track is part of this playlist
  const isThisPlaylistPlaying = 
    isPlaying && 
    currentTrack && 
    tracks.some(t => t.id === currentTrack.id);

  const isThisPlaylistPaused = 
    !isPlaying && 
    currentTrack && 
    tracks.some(t => t.id === currentTrack.id);

  const handlePlayClick = () => {
    if (isThisPlaylistPlaying) {
      pause();
    } else if (isThisPlaylistPaused) {
      resume();
    } else {
      playQueue(tracks);
    }
  };

  return (
    <div className="px-6 flex items-center gap-6">
      <button 
        onClick={handlePlayClick}
        className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 flex items-center justify-center text-black shadow-xl transition-all"
      >
        {isThisPlaylistPlaying ? (
          <Pause className="w-6 h-6 fill-current" />
        ) : (
          <Play className="w-6 h-6 fill-current translate-x-0.5" />
        )}
      </button>
      <button 
        onClick={() => setIsLiked(!isLiked)}
        className={`transition-colors ${isLiked ? "text-[#1db954]" : "text-[#b3b3b3] hover:text-white"}`}
      >
        <Heart className={`w-8 h-8 ${isLiked ? "fill-current" : ""}`} />
      </button>
      <button className="text-[#b3b3b3] hover:text-white transition-colors">
        <MoreHorizontal className="w-8 h-8" />
      </button>
    </div>
  );
}
