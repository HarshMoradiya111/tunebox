"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { resolveTrackStream } from "@/lib/api";

// --- Types ---

export interface PlayerTrack {
  id: string;
  spotifyId?: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number; // seconds
  streamUrl?: string; // backend stream URL
}

interface PlayerState {
  // Current track
  currentTrack: PlayerTrack | null;
  // Queue
  queue: PlayerTrack[];
  originalQueue: PlayerTrack[];
  queueIndex: number;
  // Playback
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  // Shuffle & Repeat
  isShuffled: boolean;
  repeatMode: "off" | "all" | "one";
}

interface PlayerActions {
  // Playback
  playTrack: (track: PlayerTrack) => void;
  playQueue: (tracks: PlayerTrack[], startIndex?: number) => void;
  addToQueue: (track: PlayerTrack) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  // Navigation
  nextTrack: () => void;
  prevTrack: () => void;
  // Seek & Volume
  seek: (time: number) => void;
  seekPercent: (percent: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  // Modes
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  // Audio ref
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

type PlayerContextType = PlayerState & PlayerActions;

const PlayerContext = createContext<PlayerContextType | null>(null);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// --- Provider ---

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [originalQueue, setOriginalQueue] = useState<PlayerTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");

  // --- Internal: load a track into the audio element ---
  // Phase 6: cache-first, fetch-on-miss
  const loadTrack = useCallback(
    (track: PlayerTrack, autoPlay = false) => {
      const audio = audioRef.current;
      if (!audio) return;

      setCurrentTrack(track);
      setIsLoading(true);
      setCurrentTime(0);

      if (track.streamUrl) {
        // Already has a stream URL — play immediately
        const url = track.streamUrl.startsWith("http")
          ? track.streamUrl
          : `${API_BASE}${track.streamUrl}`;
        audio.src = url;
        audio.load();
        if (autoPlay) {
          audio.play().catch((err) => console.error("Playback error:", err));
        }
      } else {
        // No stream URL — trigger fetch-on-miss
        resolveTrackStream({
          title: track.title,
          artist: track.artist,
          spotifyTrackId: track.spotifyId,
          album: track.album,
          albumArt: track.albumArt,
        }).then((result) => {
          if (result) {
            // Update the track with the resolved stream URL
            const resolvedTrack = { ...track, streamUrl: result.streamUrl };
            setCurrentTrack(resolvedTrack);

            const streamSrc = result.streamUrl.startsWith("http")
              ? result.streamUrl
              : `${API_BASE}${result.streamUrl}`;
            audio.src = streamSrc;
            audio.load();
            
            // Auto-play after fetching
            if (autoPlay) {
              audio.play().catch((err) => console.error("Playback error:", err));
            }

            // Update the track in the queue so replays are instant
            setQueue((prevQueue) =>
              prevQueue.map((t) =>
                (t.id === track.id || t.spotifyId === track.spotifyId)
                  ? { ...t, streamUrl: result.streamUrl }
                  : t
              )
            );
          } else {
            // Download failed
            setIsLoading(false);
            console.error(`Failed to resolve stream for "${track.title}"`);
          }
        }).catch((err) => {
          setIsLoading(false);
          console.error("Track resolution error:", err);
        });
      }
    },
    []
  );

  // --- Audio event handlers ---
  const onTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };
  
  const onDurationChange = () => {
    if (audioRef.current) setDuration(audioRef.current.duration || 0);
  };
  
  const onCanPlay = () => setIsLoading(false);
  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);
  
  const onEnded = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Auto-advance logic
    if (repeatMode === "one") {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else if (queueIndex < queue.length - 1) {
      const nextIdx = queueIndex + 1;
      setQueueIndex(nextIdx);
      loadTrack(queue[nextIdx], true);
    } else if (repeatMode === "all" && queue.length > 0) {
      setQueueIndex(0);
      loadTrack(queue[0], true);
    } else {
      setIsPlaying(false);
    }
  };
  
  const onError = () => {
    setIsLoading(false);
    console.error("Audio playback error");
  };

  // Sync volume to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  // --- Actions ---

  const playTrack = useCallback(
    (track: PlayerTrack) => {
      setQueue([track]);
      setOriginalQueue([track]);
      setQueueIndex(0);
      loadTrack(track, true);
    },
    [loadTrack]
  );

  const playQueue = useCallback(
    (tracks: PlayerTrack[], startIndex = 0) => {
      if (tracks.length === 0) return;
      
      setOriginalQueue(tracks);

      if (isShuffled) {
        // Shuffle the tracks, keeping the selected track first
        const selectedTrack = tracks[startIndex];
        const remainingTracks = tracks.filter((_, i) => i !== startIndex);
        
        // Fisher-Yates shuffle
        for (let i = remainingTracks.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [remainingTracks[i], remainingTracks[j]] = [remainingTracks[j], remainingTracks[i]];
        }
        
        const shuffledQueue = [selectedTrack, ...remainingTracks];
        setQueue(shuffledQueue);
        setQueueIndex(0);
        loadTrack(selectedTrack, true);
      } else {
        setQueue(tracks);
        setQueueIndex(startIndex);
        loadTrack(tracks[startIndex], true);
      }
    },
    [loadTrack, isShuffled]
  );

  const addToQueue = useCallback(
    (track: PlayerTrack) => {
      setQueue((prev) => [...prev, track]);
      setOriginalQueue((prev) => [...prev, track]);
      // If nothing is playing, play it
      if (!currentTrack) {
        playTrack(track);
      }
    },
    [currentTrack, playTrack]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [currentTrack]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;
    let nextIdx = queueIndex + 1;
    if (nextIdx >= queue.length) {
      if (repeatMode === "all") {
        nextIdx = 0;
      } else {
        return;
      }
    }
    setQueueIndex(nextIdx);
    loadTrack(queue[nextIdx], true);
  }, [queue, queueIndex, repeatMode, loadTrack]);

  const prevTrack = useCallback(() => {
    const audio = audioRef.current;
    // If more than 3 seconds in, restart current track
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (queue.length === 0) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      if (repeatMode === "all") {
        prevIdx = queue.length - 1;
      } else {
        prevIdx = 0;
      }
    }
    setQueueIndex(prevIdx);
    loadTrack(queue[prevIdx], true);
  }, [queue, queueIndex, repeatMode, loadTrack]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = time;
  }, []);

  const seekPercent = useCallback((percent: number) => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = (percent / 100) * audio.duration;
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (vol > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      const nextShuffled = !prev;
      
      if (nextShuffled) {
        // Turning shuffle ON
        if (queue.length > 0 && currentTrack) {
          // Filter out current track
          const remaining = originalQueue.filter((t) => t.id !== currentTrack.id);
          
          // Fisher-Yates
          for (let i = remaining.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
          }
          
          setQueue([currentTrack, ...remaining]);
          setQueueIndex(0);
        }
      } else {
        // Turning shuffle OFF
        setQueue(originalQueue);
        if (currentTrack) {
          const originalIdx = originalQueue.findIndex((t) => t.id === currentTrack.id);
          setQueueIndex(originalIdx !== -1 ? originalIdx : 0);
        } else {
          setQueueIndex(0);
        }
      }
      
      return nextShuffled;
    });
  }, [queue, originalQueue, currentTrack]);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  }, []);

  const value: PlayerContextType = {
    currentTrack,
    queue,
    originalQueue,
    queueIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    isShuffled,
    repeatMode,
    playTrack,
    playQueue,
    addToQueue,
    togglePlay,
    pause,
    resume,
    nextTrack,
    prevTrack,
    seek,
    seekPercent,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    audioRef,
  };

  return (
    <PlayerContext.Provider value={value}>
      {/* Hidden audio element for playback */}
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={onTimeUpdate}
        onDurationChange={onDurationChange}
        onCanPlay={onCanPlay}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onError={onError}
      />
      {children}
    </PlayerContext.Provider>
  );
}

// --- Hook ---

export function usePlayer(): PlayerContextType {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
