"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  ListMusic,
  Laptop2,
} from "lucide-react";

export default function PlayerBar() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(35); // percentage

  // Currently playing track mock
  const currentTrack = {
    title: "Espresso",
    artist: "Sabrina Carpenter",
    albumArt:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    duration: "2:55",
    currentTime: "1:02",
  };

  return (
    <footer className="h-24 bg-black border-t border-[#282828] px-4 flex items-center justify-between z-50 select-none">
      {/* Left: Now Playing Track Info */}
      <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
        <div className="relative w-14 h-14 rounded-md overflow-hidden bg-[#282828] shrink-0">
          <Image
            src={currentTrack.albumArt}
            alt={currentTrack.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-white text-sm font-medium hover:underline truncate cursor-pointer">
            {currentTrack.title}
          </span>
          <span className="text-[#b3b3b3] text-xs hover:underline truncate cursor-pointer">
            {currentTrack.artist}
          </span>
        </div>
        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`p-1.5 rounded-full hover:scale-105 transition-transform ${
            isLiked ? "text-[#1db954]" : "text-[#b3b3b3] hover:text-white"
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Center: Playback Controls & Seek Bar */}
      <div className="flex flex-col items-center gap-2 w-2/4 max-w-[600px]">
        {/* Buttons */}
        <div className="flex items-center gap-4 text-[#b3b3b3]">
          <button className="hover:text-white transition-colors p-1">
            <Shuffle className="w-4 h-4" />
          </button>
          <button className="hover:text-white transition-colors p-1">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-full bg-white hover:scale-105 text-black flex items-center justify-center transition-all"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
            )}
          </button>
          <button className="hover:text-white transition-colors p-1">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button className="hover:text-white transition-colors p-1">
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Seek Bar */}
        <div className="w-full flex items-center gap-2 text-xs text-[#b3b3b3]">
          <span>{currentTrack.currentTime}</span>
          <div
            className="flex-1 h-1 bg-[#4d4d4d] hover:h-1.5 rounded-full overflow-hidden relative cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              setProgress((clickX / rect.width) * 100);
            }}
          >
            <div
              className="h-full bg-white group-hover:bg-[#1db954] transition-colors"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>{currentTrack.duration}</span>
        </div>
      </div>

      {/* Right: Volume & Utilities */}
      <div className="flex items-center justify-end gap-3 w-1/4 text-[#b3b3b3]">
        <button className="hover:text-white transition-colors p-1">
          <ListMusic className="w-4 h-4" />
        </button>
        <button className="hover:text-white transition-colors p-1">
          <Laptop2 className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 w-28">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="hover:text-white transition-colors p-1"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-full h-1 accent-[#1db954] cursor-pointer"
          />
        </div>
      </div>
    </footer>
  );
}
