"use client";

import Image from "next/image";
import Link from "next/link";
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
  Timer,
  Maximize2,
  Ear
} from "lucide-react";
import { usePlayer } from "@/store/playerStore";
import { useState, useEffect } from "react";
import QueuePanel from "./QueuePanel";
import NowPlayingView from "./NowPlayingView";
import { useFocusTrap } from "@/hooks/useFocusTrap";

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
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    seekPercent,
    setVolume,
    toggleMute,
    isShuffled,
    repeatMode,
    normalizeVolume,
    toggleShuffle,
    cycleRepeat,
    toggleNormalizeVolume,
    pause,
  } = usePlayer();

  const [isLiked, setIsLiked] = useState(false);
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);
  
  // Advanced Features State
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | 'end' | null>(null);
  const [sleepTimerEndTime, setSleepTimerEndTime] = useState<number | null>(null);
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number | null>(null);
  const [isSleepMenuOpen, setIsSleepMenuOpen] = useState(false);
  const sleepFocusRef = useFocusTrap(isSleepMenuOpen, () => setIsSleepMenuOpen(false));
  
  useEffect(() => {
    setIsLiked(currentTrack?.isLiked || false);
  }, [currentTrack]);
  
  const handleToggleLike = async () => {
    if (!currentTrack) return;
    setIsLiked(!isLiked); // optimistic update
    try {
      import("@/lib/api").then(api => api.toggleLikeTrack(currentTrack.id));
    } catch (e) {
      setIsLiked(isLiked); // revert on failure
    }
  };

  // Sleep Timer Logic
  useEffect(() => {
    if (!sleepTimerEndTime) {
      setSleepTimeRemaining(null);
      return;
    }
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, sleepTimerEndTime - now);
      setSleepTimeRemaining(remaining);
      
      if (remaining === 0) {
        pause();
        setSleepTimerEndTime(null);
        setSleepTimerMinutes(null);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [sleepTimerEndTime, pause]);

  const handleSetSleepTimer = (minutes: number | 'end' | null) => {
    setSleepTimerMinutes(minutes);
    setIsSleepMenuOpen(false);
    
    if (minutes === null) {
      setSleepTimerEndTime(null);
    } else if (minutes === 'end') {
      const remainingSecs = duration - currentTime;
      setSleepTimerEndTime(Date.now() + remainingSecs * 1000);
    } else {
      setSleepTimerEndTime(Date.now() + minutes * 60 * 1000);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        seek(Math.min(duration, currentTime + 5));
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        seek(Math.max(0, currentTime - 5));
      } else if (e.code === "KeyM") {
        e.preventDefault();
        toggleMute();
      } else if (e.code === "KeyS") {
        e.preventDefault();
        toggleShuffle();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        cycleRepeat();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    togglePlay,
    seek,
    currentTime,
    duration,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
  ]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const effectiveVolume = isMuted ? 0 : volume;

  const VolumeIcon =
    effectiveVolume === 0
      ? VolumeX
      : effectiveVolume < 50
        ? Volume1
        : Volume2;

  return (
    <footer className="h-16 md:h-[90px] bg-black border-t border-[#282828] px-2 md:px-4 flex items-center justify-between z-50 select-none pb-[env(safe-area-inset-bottom)]">
      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite">
        {currentTrack ? `Now playing: ${currentTrack.title} by ${currentTrack.artist}` : 'No track selected'}
      </div>

      {/* Left / Mobile Mini Player: Now Playing Track Info */}
      <div 
        role="button"
        tabIndex={0}
        aria-label="Open now playing view"
        className="flex items-center gap-2 md:gap-3 flex-1 md:w-1/4 md:min-w-[180px] h-full outline-none focus-visible:ring-2 focus-visible:ring-[#1db954] focus-visible:ring-inset"
        onClick={() => {
          // On mobile, tap anywhere opens the NowPlayingView
          if (window.innerWidth < 768) setIsNowPlayingOpen(true);
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && window.innerWidth < 768) {
            e.preventDefault();
            setIsNowPlayingOpen(true);
          }
        }}
      >
        {currentTrack ? (
          <>
            <div 
              className="relative w-12 h-12 md:w-14 md:h-14 rounded-md overflow-hidden bg-[#282828] shrink-0 cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                setIsNowPlayingOpen(true);
              }}
            >
              <Image
                src={currentTrack.albumArt || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop"}
                alt={currentTrack.title}
                fill
                className="object-cover group-hover:brightness-50 transition-all"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-white text-sm font-medium hover:underline truncate cursor-pointer">
                {currentTrack.title}
              </span>
              <Link href={`/artist/${encodeURIComponent(currentTrack.artist)}`} className="text-[#b3b3b3] text-xs hover:underline truncate cursor-pointer" onClick={(e) => e.stopPropagation()}>
                {currentTrack.artist}
              </Link>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleLike(); }}
              aria-label={isLiked ? "Remove from liked songs" : "Save to your liked songs"}
              className={`p-3 md:p-1.5 rounded-full hover:scale-105 transition-transform shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                isLiked ? "text-[#1db954]" : "text-[#b3b3b3] hover:text-white"
              }`}
            >
              <Heart className={`w-5 h-5 md:w-4 md:h-4 ${isLiked ? "fill-current" : ""}`} />
            </button>
            {/* Mobile Play/Pause Button */}
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              disabled={!currentTrack}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="md:hidden shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center text-white disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 fill-current" aria-hidden="true" />
              ) : (
                <Play className="w-6 h-6 fill-current" aria-hidden="true" />
              )}
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 text-[#b3b3b3] text-sm">
            <div className="w-14 h-14 rounded-md bg-[#282828]" />
            <span className="text-xs">No track selected</span>
          </div>
        )}
      </div>

      {/* Center: Playback Controls & Seek Bar (Hidden on Mobile) */}
      <div className="hidden md:flex flex-col items-center gap-2 w-2/4 max-w-[600px]">
        {/* Buttons */}
        <div className="flex items-center gap-4 text-[#b3b3b3]">
          <button
            onClick={toggleShuffle}
            aria-label={isShuffled ? "Disable shuffle" : "Enable shuffle"}
            className={`transition-colors p-1 relative ${
              isShuffled ? "text-[#1db954]" : "text-[#b3b3b3] hover:text-white"
            }`}
          >
            <Shuffle className="w-4 h-4" />
            {isShuffled && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full"></span>}
          </button>
          <button
            onClick={prevTrack}
            aria-label="Previous track"
            className="text-[#b3b3b3] hover:text-white transition-colors p-1"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button
            onClick={togglePlay}
            disabled={!currentTrack}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="w-8 h-8 rounded-full bg-white hover:scale-105 text-black flex items-center justify-center transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" aria-hidden="true" />
            ) : (
              <Play className="w-4 h-4 fill-current translate-x-0.5" aria-hidden="true" />
            )}
          </button>
          <button
            onClick={nextTrack}
            aria-label="Next track"
            className="text-[#b3b3b3] hover:text-white transition-colors p-1"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button
            onClick={cycleRepeat}
            aria-label={`Repeat mode: ${repeatMode}`}
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
            role="slider"
            tabIndex={0}
            aria-label="Seek time"
            aria-valuemin={0}
            aria-valuemax={duration || 100}
            aria-valuenow={currentTime}
            className="flex-1 h-1 bg-[#4d4d4d] hover:h-1.5 rounded-full overflow-hidden relative cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#1db954]"
            onMouseDown={() => setIsDraggingSeek(true)}
            onMouseUp={() => setIsDraggingSeek(false)}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              seekPercent((clickX / rect.width) * 100);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                seekPercent(Math.min(100, progress + 5));
                e.stopPropagation();
              } else if (e.key === "ArrowLeft") {
                seekPercent(Math.max(0, progress - 5));
                e.stopPropagation();
              }
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

      {/* Right: Volume & Utilities (Hidden on Mobile) */}
      <div className="hidden md:flex items-center justify-end gap-3 w-1/4 text-[#b3b3b3]">
        
        {/* Sleep Timer */}
        <div className="relative">
          <button 
            onClick={() => setIsSleepMenuOpen(!isSleepMenuOpen)}
            aria-label="Sleep timer"
            aria-expanded={isSleepMenuOpen}
            className={`transition-colors p-1 relative ${sleepTimerEndTime ? "text-[#1db954]" : "hover:text-white"}`}
          >
            <Timer className="w-4 h-4" />
            {sleepTimerEndTime && sleepTimeRemaining !== null && (
               <span className="absolute -top-2 -right-3 text-[9px] bg-[#1db954] text-black px-1 rounded-sm font-bold">
                 {formatTime(sleepTimeRemaining / 1000)}
               </span>
            )}
          </button>
          
          {isSleepMenuOpen && (
            <div ref={sleepFocusRef} className="absolute bottom-10 right-0 w-40 bg-[#282828] rounded-md shadow-2xl py-1 text-sm overflow-hidden z-50">
              <div className="px-3 py-2 text-xs font-bold text-[#b3b3b3] uppercase tracking-wider border-b border-[#3e3e3e]">Sleep Timer</div>
              {[15, 30, 45, 60].map(m => (
                <button key={m} onClick={() => handleSetSleepTimer(m as number)} className="w-full text-left px-3 py-2 hover:bg-[#3e3e3e] text-white focus-visible:bg-[#3e3e3e]">
                  {m} Minutes
                </button>
              ))}
              <button onClick={() => handleSetSleepTimer('end')} className="w-full text-left px-3 py-2 hover:bg-[#3e3e3e] text-white focus-visible:bg-[#3e3e3e]">End of track</button>
              <button onClick={() => handleSetSleepTimer(null)} className="w-full text-left px-3 py-2 hover:bg-[#3e3e3e] text-red-400 border-t border-[#3e3e3e] focus-visible:bg-[#3e3e3e]">Turn off timer</button>
            </div>
          )}
        </div>
        
        {/* Queue */}
        <button 
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          aria-label="Queue"
          aria-expanded={isQueueOpen}
          className={`transition-colors p-1 ${isQueueOpen ? "text-[#1db954]" : "hover:text-white"}`}
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Volume Normalization */}
        <button 
          onClick={toggleNormalizeVolume}
          className={`transition-colors p-1 ${normalizeVolume ? "text-[#1db954]" : "hover:text-white"}`}
          title="Normalize Volume"
          aria-label={normalizeVolume ? "Disable volume normalization" : "Enable volume normalization"}
          aria-pressed={normalizeVolume}
        >
          <Ear className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 w-28">
          <button
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
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
            aria-label="Volume"
            value={effectiveVolume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-1 accent-[#1db954] cursor-pointer"
          />
        </div>
      </div>

      <QueuePanel isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
      <NowPlayingView isOpen={isNowPlayingOpen} onClose={() => setIsNowPlayingOpen(false)} />
    </footer>
  );
}
