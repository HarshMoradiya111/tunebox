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
  const loadTrack = useCallback(
    (track: PlayerTrack) => {
      const audio = audioRef.current;
      if (!audio) return;

      setCurrentTrack(track);
      setIsLoading(true);
      setCurrentTime(0);

      if (track.streamUrl) {
        // Stream URL from backend
        const url = track.streamUrl.startsWith("http")
          ? track.streamUrl
          : `${API_BASE}${track.streamUrl}`;
        audio.src = url;
      } else {
        // No stream URL yet — will be handled by Phase 6 fetch-on-miss
        audio.src = "";
        setIsLoading(false);
        return;
      }

      audio.load();
    },
    []
  );

  // --- Audio event listeners ---
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onCanPlay = () => setIsLoading(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      // Auto-advance logic
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else if (queueIndex < queue.length - 1) {
        const nextIdx = queueIndex + 1;
        setQueueIndex(nextIdx);
        loadTrack(queue[nextIdx]);
        audio.addEventListener("canplay", () => audio.play().catch(() => {}), {
          once: true,
        });
      } else if (repeatMode === "all" && queue.length > 0) {
        setQueueIndex(0);
        loadTrack(queue[0]);
        audio.addEventListener("canplay", () => audio.play().catch(() => {}), {
          once: true,
        });
      } else {
        setIsPlaying(false);
      }
    };
    const onError = () => {
      setIsLoading(false);
      console.error("Audio playback error");
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [queue, queueIndex, repeatMode, loadTrack]);

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
      setQueueIndex(0);
      loadTrack(track);

      const audio = audioRef.current;
      if (audio) {
        audio.addEventListener("canplay", () => audio.play().catch(() => {}), {
          once: true,
        });
      }
    },
    [loadTrack]
  );

  const playQueue = useCallback(
    (tracks: PlayerTrack[], startIndex = 0) => {
      if (tracks.length === 0) return;
      setQueue(tracks);
      setQueueIndex(startIndex);
      loadTrack(tracks[startIndex]);

      const audio = audioRef.current;
      if (audio) {
        audio.addEventListener("canplay", () => audio.play().catch(() => {}), {
          once: true,
        });
      }
    },
    [loadTrack]
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
    loadTrack(queue[nextIdx]);
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener("canplay", () => audio.play().catch(() => {}), {
        once: true,
      });
    }
  }, [queue, queueIndex, repeatMode, loadTrack]);

  const prevTrack = useCallback(() => {
    const audio = audioRef.current;
    // If more than 3 seconds in, restart current track
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (queue.length === 0 || queueIndex <= 0) return;
    const prevIdx = queueIndex - 1;
    setQueueIndex(prevIdx);
    loadTrack(queue[prevIdx]);
    if (audio) {
      audio.addEventListener("canplay", () => audio.play().catch(() => {}), {
        once: true,
      });
    }
  }, [queue, queueIndex, loadTrack]);

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
    setIsShuffled((prev) => !prev);
  }, []);

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
      <audio ref={audioRef} preload="auto" />
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
