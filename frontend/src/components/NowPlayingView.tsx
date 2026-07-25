"use client";

import Image from "next/image";
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Loader2 } from "lucide-react";
import { usePlayer } from "@/store/playerStore";
import { useState, useEffect } from "react";

interface NowPlayingViewProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function NowPlayingView({ isOpen, onClose }: NowPlayingViewProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    togglePlay,
    nextTrack,
    prevTrack,
    seekPercent,
    isShuffled,
    repeatMode,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  const [isDraggingSeek, setIsDraggingSeek] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-800 to-black flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-300">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-6">
        <button 
          onClick={onClose}
          className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
        <div className="text-center">
          <p className="text-xs text-[#b3b3b3] uppercase tracking-widest font-bold">Now Playing</p>
          <p className="text-sm text-white font-medium truncate max-w-xs">{currentTrack.album || "Single"}</p>
        </div>
        <div className="w-12" /> {/* Spacer for centering */}
      </div>

      {/* Main Content (Image & Title) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-0">
        <div className="relative w-full max-w-[400px] aspect-square rounded-xl shadow-2xl overflow-hidden mb-12">
          <Image 
            src={currentTrack.albumArt || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop"} 
            alt={currentTrack.title} 
            fill 
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover" 
            priority
          />
        </div>

        <div className="w-full max-w-lg px-4 flex flex-col">
          <div className="mb-6 flex justify-between items-end">
            <div className="flex flex-col overflow-hidden mr-4">
              <h1 className="text-white text-3xl md:text-4xl font-bold truncate mb-1">{currentTrack.title}</h1>
              <h2 className="text-[#b3b3b3] text-xl truncate">{currentTrack.artist}</h2>
            </div>
            {/* Could add large Like button here */}
          </div>

          {/* Seek Bar */}
          <div className="w-full flex items-center gap-3 text-sm text-[#b3b3b3] mb-6">
            <span className="w-12 tabular-nums">{formatTime(currentTime)}</span>
            <div
              className="flex-1 h-1.5 bg-[#4d4d4d] hover:h-2 rounded-full overflow-hidden relative cursor-pointer group"
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
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="w-12 tabular-nums text-right">{formatTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={toggleShuffle}
              className={`transition-colors p-2 relative ${isShuffled ? "text-[#1db954]" : "text-[#b3b3b3] hover:text-white"}`}
            >
              <Shuffle className="w-6 h-6" />
              {isShuffled && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full"></span>}
            </button>
            <button onClick={prevTrack} className="text-white hover:text-[#b3b3b3] transition-colors p-2">
              <SkipBack className="w-10 h-10 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="w-20 h-20 rounded-full bg-white hover:scale-105 text-black flex items-center justify-center transition-all shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-10 h-10 fill-current" />
              ) : (
                <Play className="w-10 h-10 fill-current translate-x-1" />
              )}
            </button>
            <button onClick={nextTrack} className="text-white hover:text-[#b3b3b3] transition-colors p-2">
              <SkipForward className="w-10 h-10 fill-current" />
            </button>
            <button
              onClick={cycleRepeat}
              className={`transition-colors p-2 relative ${repeatMode !== "off" ? "text-[#1db954]" : "text-[#b3b3b3] hover:text-white"}`}
            >
              {repeatMode === "one" ? <Repeat1 className="w-6 h-6" /> : <Repeat className="w-6 h-6" />}
              {repeatMode !== "off" && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full"></span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
