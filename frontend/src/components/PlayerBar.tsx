"use client";

import Image from "next/image";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  Volume1,
  VolumeX,
  ListMusic,
  Laptop2,
  Loader2,
} from "lucide-react";
import { usePlayer } from "@/store/playerStore";
import { useState } from "react";

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    togglePlay,
    nextTrack,
    prevTrack,
    seekPercent,
    setVolume,
    toggleMute,
    isShuffled,
    repeatMode,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  const [isLiked, setIsLiked] = useState(false);
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const effectiveVolume = isMuted ? 0 : volume;

  const VolumeIcon =
    effectiveVolume === 0
      ? VolumeX
      : effectiveVolume < 50
        ? Volume1
        : Volume2;

  return (
    <footer className="h-24 bg-black border-t border-[#282828] px-4 flex items-center justify-between z-50 select-none">
      {/* Left: Now Playing Track Info */}
      <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
        {currentTrack ? (
          <>
            <div className="relative w-14 h-14 rounded-md overflow-hidden bg-[#282828] shrink-0">
              <Image
                src={currentTrack.albumArt || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop"}
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
          </>
        ) : (
          <div className="flex items-center gap-3 text-[#b3b3b3] text-sm">
            <div className="w-14 h-14 rounded-md bg-[#282828]" />
            <span className="text-xs">No track selected</span>
          </div>
        )}
      </div>

      {/* Center: Playback Controls & Seek Bar */}
      <div className="flex flex-col items-center gap-2 w-2/4 max-w-[600px]">
        {/* Buttons */}
        <div className="flex items-center gap-4 text-[#b3b3b3]">
          <button
            onClick={toggleShuffle}
            className={`transition-colors p-1 relative ${
              isShuffled ? "text-[#1db954]" : "text-[#b3b3b3] hover:text-white"
            }`}
          >
            <Shuffle className="w-4 h-4" />
            {isShuffled && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full"></span>}
          </button>
          <button
            onClick={prevTrack}
            className="text-[#b3b3b3] hover:text-white transition-colors p-1"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button
            onClick={togglePlay}
            disabled={!currentTrack}
            className="w-8 h-8 rounded-full bg-white hover:scale-105 text-black flex items-center justify-center transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
            )}
          </button>
          <button
            onClick={nextTrack}
            className="text-[#b3b3b3] hover:text-white transition-colors p-1"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button
            onClick={cycleRepeat}
            className={`transition-colors p-1 relative ${
              repeatMode !== "off" ? "text-[#1db954]" : "text-[#b3b3b3] hover:text-white"
            }`}
          >
            {repeatMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            {repeatMode !== "off" && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full"></span>}
          </button>
        </div>

        {/* Seek Bar */}
        <div className="w-full flex items-center gap-2 text-xs text-[#b3b3b3]">
          <span className="w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
          <div
            className="flex-1 h-1 bg-[#4d4d4d] hover:h-1.5 rounded-full overflow-hidden relative cursor-pointer group"
            onMouseDown={() => setIsDraggingSeek(true)}
            onMouseUp={() => setIsDraggingSeek(false)}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              seekPercent((clickX / rect.width) * 100);
            }}
          >
            <div
              className="h-full bg-white group-hover:bg-[#1db954] transition-colors relative"
              style={{ width: `${progress}%` }}
            >
              {/* Seek knob */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="w-10 tabular-nums">{formatTime(duration)}</span>
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
            onClick={toggleMute}
            className="hover:text-white transition-colors p-1"
          >
            <VolumeIcon
              className={`w-4 h-4 ${
                effectiveVolume === 0 ? "text-rose-500" : ""
              }`}
            />
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={effectiveVolume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-1 accent-[#1db954] cursor-pointer"
          />
        </div>
      </div>
    </footer>
  );
}
