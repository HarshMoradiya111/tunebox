"use client";

import { useEffect, useState, useRef } from "react";
import { X, Music2, RefreshCw } from "lucide-react";
import Image from "next/image";
import { PlayerTrack } from "@/store/playerStore";

interface LyricLine {
  time: number; // in seconds
  text: string;
}

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: PlayerTrack | null;
  currentTime: number;
}

export default function LyricsModal({
  isOpen,
  onClose,
  currentTrack,
  currentTime,
}: LyricsModalProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [plainTextLyrics, setPlainTextLyrics] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  // Parse LRC formatted string into array of timestamped lines
  const parseLRC = (lrcText: string): LyricLine[] => {
    const lines = lrcText.split("\n");
    const result: LyricLine[] = [];

    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
      const match = timeRegex.exec(line);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = parseInt(match[3].padEnd(3, "0"), 10);
        const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
        const text = line.replace(timeRegex, "").trim();
        if (text) {
          result.push({ time: timeInSeconds, text });
        }
      }
    }

    return result.sort((a, b) => a.time - b.time);
  };

  const fetchLyrics = async () => {
    if (!currentTrack) return;
    setIsLoading(true);
    setError(null);
    setLyrics([]);
    setPlainTextLyrics(null);

    try {
      // LRCLIB free API call
      const cleanTitle = currentTrack.title.replace(/\([^)]*\)|\[[^\]]*\]/g, "").trim();
      const cleanArtist = currentTrack.artist.split(",")[0].split("&")[0].trim();

      const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        if (data.syncedLyrics) {
          const parsed = parseLRC(data.syncedLyrics);
          if (parsed.length > 0) {
            setLyrics(parsed);
          } else if (data.plainLyrics) {
            setPlainTextLyrics(data.plainLyrics);
          }
        } else if (data.plainLyrics) {
          setPlainTextLyrics(data.plainLyrics);
        } else {
          setError("No synced lyrics found for this track.");
        }
      } else {
        setError("Lyrics not found.");
      }
    } catch (err) {
      console.error("Lyrics fetch error:", err);
      setError("Unable to load lyrics at this time.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentTrack) {
      fetchLyrics();
    }
  }, [isOpen, currentTrack?.id]);

  // Update active line index based on current playback time
  useEffect(() => {
    if (lyrics.length === 0) return;

    let index = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }

    if (index !== activeLineIndex) {
      setActiveLineIndex(index);
    }
  }, [currentTime, lyrics]);

  // Auto-scroll active lyric into view
  useEffect(() => {
    if (activeLineRef.current && lyricsContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeLineIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {currentTrack?.albumArt && (
            <div className="w-10 h-10 rounded relative overflow-hidden shrink-0 shadow-lg">
              <Image src={currentTrack.albumArt} alt="Art" fill className="object-cover" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-white font-bold text-sm sm:text-base truncate">
              {currentTrack?.title || "No Track Selected"}
            </span>
            <span className="text-[#b3b3b3] text-xs truncate">
              {currentTrack?.artist}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLyrics}
            className="p-2 text-[#b3b3b3] hover:text-white hover:bg-[#282828] rounded-full transition-colors"
            title="Reload Lyrics"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-[#b3b3b3] hover:text-white hover:bg-[#282828] rounded-full transition-colors"
            aria-label="Close Lyrics"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Lyrics Area */}
      <div
        ref={lyricsContainerRef}
        className="w-full max-w-3xl flex-1 overflow-y-auto py-16 px-4 flex flex-col items-center gap-6 no-scrollbar text-center"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-[#b3b3b3] gap-3">
            <Music2 className="w-12 h-12 animate-pulse text-[#1db954]" />
            <p className="text-sm font-medium">Loading synced lyrics...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-[#b3b3b3] gap-3 max-w-md">
            <Music2 className="w-12 h-12 opacity-40" />
            <p className="text-base font-bold text-white">No Synced Lyrics Available</p>
            <p className="text-xs text-center">{error}</p>
          </div>
        ) : lyrics.length > 0 ? (
          lyrics.map((line, idx) => {
            const isActive = idx === activeLineIndex;
            return (
              <p
                key={idx}
                ref={isActive ? activeLineRef : null}
                className={`text-2xl sm:text-4xl font-bold transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "text-white scale-105 drop-shadow-[0_0_15px_rgba(29,185,84,0.5)]"
                    : "text-[#ffffff40] hover:text-[#ffffff80]"
                }`}
              >
                {line.text}
              </p>
            );
          })
        ) : plainTextLyrics ? (
          <div className="text-lg sm:text-2xl font-medium text-[#b3b3b3] whitespace-pre-line leading-relaxed">
            {plainTextLyrics}
          </div>
        ) : null}
      </div>

      {/* Footer Info */}
      <div className="text-xs text-[#b3b3b3]/50 z-10">
        Lyrics powered by LRCLIB • Synced Karaoke Mode
      </div>
    </div>
  );
}
