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
import ReactPlayer from "react-player";
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
  // Player ref
  playerRef: any;
}

type PlayerContextType = PlayerState & PlayerActions;

const PlayerContext = createContext<PlayerContextType | null>(null);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// --- Provider ---

export function PlayerProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<any>(null);

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
      setCurrentTrack(track);
      setIsLoading(true);
      setCurrentTime(0);
      if (autoPlay) setIsPlaying(true);

      if (track.streamUrl) {
        // Already has a stream URL — ReactPlayer will handle playback via the URL prop
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
            if (autoPlay) setIsPlaying(true);

            // Update the track in the queue so replays are instant
            setQueue((prevQueue) => {
              const newQueue = prevQueue.map((t) =>
                (t.id === track.id || t.spotifyId === track.spotifyId)
                  ? { ...t, streamUrl: result.streamUrl }
                  : t
              );
              
              // Prefetch the NEXT track silently
              const nextIdx = newQueue.findIndex(t => t.id === track.id || t.spotifyId === track.spotifyId) + 1;
              if (nextIdx > 0 && nextIdx < newQueue.length) {
                const nextTrack = newQueue[nextIdx];
                if (!nextTrack.streamUrl) {
                  resolveTrackStream({
                    title: nextTrack.title,
                    artist: nextTrack.artist,
                    spotifyTrackId: nextTrack.spotifyId,
                    album: nextTrack.album,
                    albumArt: nextTrack.albumArt,
                  }).then((prefetchedResult) => {
                    if (prefetchedResult) {
                      setQueue(q => q.map((t, i) => i === nextIdx ? { ...t, streamUrl: prefetchedResult.streamUrl } : t));
                    }
                  }).catch(() => {});
                }
              }
              return newQueue;
            });
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
  const onProgress = (state: any) => {
    setCurrentTime(state.playedSeconds);
  };
  
  const onDuration = (duration: number) => {
    setDuration(duration);
  };
  
  const onReady = () => setIsLoading(false);
  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);
  
  const onEnded = () => {
    // Auto-advance logic
    if (repeatMode === "one") {
      playerRef.current?.seekTo(0);
      setIsPlaying(true);
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
  
  const onError = (e: any) => {
    setIsLoading(false);
    console.error("Audio playback error:", e);
    // If we get an error from YouTube, we could try skipping to the next track here
  };

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
    setIsPlaying((prev) => !prev);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    setIsPlaying(true);
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
    // If more than 3 seconds in, restart current track
    if (currentTime > 3) {
      playerRef.current?.seekTo(0);
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
    playerRef.current?.seekTo(time, "seconds");
    setCurrentTime(time);
  }, []);

  const seekPercent = useCallback((percent: number) => {
    const time = (percent / 100) * duration;
    playerRef.current?.seekTo(time, "seconds");
    setCurrentTime(time);
  }, [duration]);

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
    playerRef,
  };

  const currentStreamUrl = currentTrack?.streamUrl 
    ? (currentTrack.streamUrl.startsWith("http") ? currentTrack.streamUrl : `${API_BASE}${currentTrack.streamUrl}`) 
    : undefined;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <PlayerContext.Provider value={value}>
      {/* Hidden ReactPlayer for audio/video streaming */}
      <div style={{ display: "none" }}>
        {mounted && (
          <ReactPlayer
            ref={playerRef}
            url={currentStreamUrl}
            playing={isPlaying}
            volume={isMuted ? 0 : volume / 100}
            onProgress={onProgress}
            onDuration={onDuration}
            onReady={onReady}
            onPlay={onPlay}
            onPause={onPause}
            onEnded={onEnded}
            onError={onError}
            width="0"
            height="0"
            config={{
              youtube: {
                playerVars: { autoplay: 1, controls: 0 } as any
              }
            } as any}
          />
        )}
      </div>
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
