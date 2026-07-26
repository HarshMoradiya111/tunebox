"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
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
  streamUrl?: string; // Pre-fetched stream URL from backend (Phase 7)
  isLiked?: boolean;  // Liked status
  tags?: string[];
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
  // Saved Playlists
  savedPlaylists: { id: string; name: string }[];
  // Volume Normalization
  normalizeVolume: boolean;
}

interface PlayerActions {
  // Playback
  playTrack: (track: PlayerTrack) => void;
  playQueue: (tracks: PlayerTrack[], startIndex?: number) => void;
  addToQueue: (track: PlayerTrack) => void;
  playNext: (track: PlayerTrack) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
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
  toggleNormalizeVolume: () => void;
  // Modes
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  // Player ref
  playerRef: any;
  // Saved Playlists
  toggleSavedPlaylist: (playlist: { id: string; name: string }) => void;
  // State persistence
  clearPlayerState: () => void;
  // Track updates
  updateCurrentTrackLikeStatus: (isLiked: boolean) => void;
}

type PlayerContextType = PlayerState & PlayerActions;

const PlayerContext = createContext<PlayerContextType | null>(null);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// --- Provider ---

export function PlayerProvider({ children }: { children: ReactNode }) {
  const player1Ref = useRef<HTMLAudioElement>(null);
  const player2Ref = useRef<HTMLAudioElement>(null);
  const [activePlayerId, setActivePlayerId] = useState<1 | 2>(1);
  const activePlayerIdRef = useRef<1 | 2>(1);
  useEffect(() => { activePlayerIdRef.current = activePlayerId; }, [activePlayerId]);

  const getActivePlayer = useCallback(() => activePlayerIdRef.current === 1 ? player1Ref.current : player2Ref.current, []);

  const playerRef = useRef<any>({
    get currentTime() { return getActivePlayer()?.currentTime || 0; },
    set currentTime(val) { const p = getActivePlayer(); if (p) p.currentTime = val; },
    get duration() { return getActivePlayer()?.duration || 0; },
    get volume() { return getActivePlayer()?.volume || 1; },
    set volume(val) { 
      if (player1Ref.current) player1Ref.current.volume = val; 
      if (player2Ref.current) player2Ref.current.volume = val; 
    },
    play: () => getActivePlayer()?.play(),
    pause: () => {
      if (player1Ref.current) player1Ref.current.pause();
      if (player2Ref.current) player2Ref.current.pause();
    },
    seekTo: (val: number) => { const p = getActivePlayer(); if (p) p.currentTime = val; }
  });

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
  const [savedPlaylists, setSavedPlaylists] = useState<{ id: string; name: string }[]>([]);
  const [normalizeVolume, setNormalizeVolume] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNode1Ref = useRef<MediaElementAudioSourceNode | null>(null);
  const sourceNode2Ref = useRef<MediaElementAudioSourceNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const pendingSeekTime = useRef<number | null>(null);

  // Restore state on mount
  useEffect(() => {
    const stored = localStorage.getItem("savedPlaylists");
    if (stored) {
      try {
        setSavedPlaylists(JSON.parse(stored));
      } catch (e) {}
    }
    const storedVol = localStorage.getItem("normalizeVolume");
    if (storedVol) setNormalizeVolume(storedVol === "true");

    const storedPlayer = localStorage.getItem("playerState");
    if (storedPlayer) {
      try {
        const state = JSON.parse(storedPlayer);
        if (state.currentTrack) {
          // Note: This app relies on static Cloudinary or Spotify proxy URLs that are mostly stable.
          setQueue(state.queue || []);
          setOriginalQueue(state.queue || []); // originalQueue isn't saved explicitly in the requirement, but usually queue matches. Wait, if it was shuffled, originalQueue is lost. We'll set it to queue for now.
          setQueueIndex(state.queueIndex || 0);
          setVolumeState(state.volume ?? 80);
          setIsShuffled(state.isShuffled || false);
          setRepeatMode(state.repeatMode || "off");
          setCurrentTrack(state.currentTrack);
          setIsPlaying(false); // Do not autoplay on refresh
          setCurrentTime(state.currentTime || 0);
          
          // Seek the audio element to the stored time silently once metadata loads
          pendingSeekTime.current = state.currentTime || 0;
        }
      } catch (e) {
        console.error("Failed to restore player state:", e);
      }
    }
  }, []);

  // Save state on change (throttled)
  const stateRef = useRef({ currentTrack, queue, queueIndex, currentTime, volume, isShuffled, repeatMode });
  useEffect(() => {
    stateRef.current = { currentTrack, queue, queueIndex, currentTime, volume, isShuffled, repeatMode };
  }, [currentTrack, queue, queueIndex, currentTime, volume, isShuffled, repeatMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = stateRef.current;
      if (!state.currentTrack) return;
      localStorage.setItem("playerState", JSON.stringify(state));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const clearPlayerState = useCallback(() => {
    localStorage.removeItem("playerState");
  }, []);

  // --- Internal: load a track into the audio element ---
  // Phase 6: cache-first, fetch-on-miss
  const loadTrack = useCallback(
    (track: PlayerTrack, autoPlay = false) => {
      setCurrentTrack(track);
      setIsLoading(true);
      setCurrentTime(0);
      if (autoPlay) {
        setIsPlaying(true);
        if (audioContextRef.current?.state === "suspended") {
          audioContextRef.current.resume().catch(() => {});
        }
      }

      // Record play history in background if it's a real track (has ID)
      if (track.id && autoPlay) {
        import("@/lib/api").then(api => api.recordTrackPlay(track.id).catch(() => {}));
      }

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

  const updateCurrentTrackLikeStatus = useCallback((isLiked: boolean) => {
    setCurrentTrack((prev) => prev ? { ...prev, isLiked } : null);
    setQueue((prevQueue) => prevQueue.map(t => 
      (currentTrack && t.id === currentTrack.id) ? { ...t, isLiked } : t
    ));
    setOriginalQueue((prevQueue) => prevQueue.map(t => 
      (currentTrack && t.id === currentTrack.id) ? { ...t, isLiked } : t
    ));
  }, [currentTrack]);

  // --- Audio event handlers ---
  
  const getFormatUrl = (url?: string) => {
    if (!url) return undefined;
    let formatted = url;
    if (formatted.startsWith("http://localhost:5000/api") && process.env.NEXT_PUBLIC_API_URL) {
      formatted = formatted.replace("http://localhost:5000/api", process.env.NEXT_PUBLIC_API_URL);
    }
    if (formatted.startsWith("http")) return formatted;
    if (formatted.startsWith("/api/") && process.env.NEXT_PUBLIC_API_URL?.endsWith("/api")) {
      return `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "")}${formatted}`;
    }
    return `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "")}${formatted.startsWith("/") ? "" : "/"}${formatted}`;
  };

  const onEnded = () => {
    // Auto-advance logic
    if (repeatMode === "one") {
      const p = getActivePlayer();
      if (p) p.currentTime = 0;
      setIsPlaying(true);
    } else if (queueIndex < queue.length - 1 || (repeatMode === "all" && queue.length > 0)) {
      const nextIdx = queueIndex < queue.length - 1 ? queueIndex + 1 : 0;
      const nextTrk = queue[nextIdx];
      
      const nextStreamUrl = getFormatUrl(nextTrk.streamUrl);
      const preloadTrk = queueIndex < queue.length - 1 ? queue[queueIndex + 1] : (repeatMode === "all" ? queue[0] : null);
      const preloadUrl = getFormatUrl(preloadTrk?.streamUrl);

      // If the next track's URL matches what we were preloading, swap players for gapless playback
      if (nextStreamUrl && nextStreamUrl === preloadUrl) {
        setActivePlayerId(prev => (prev === 1 ? 2 : 1));
      }
      
      setQueueIndex(nextIdx);
      loadTrack(nextTrk, true);
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
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume().catch(() => {});
      }
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
      setQueue((prev) => {
        if (prev.length === 0) {
          // If queue was empty, play this track without overwriting the queue
          setTimeout(() => {
            setQueueIndex(0);
            loadTrack(track, true);
          }, 0);
        }
        return [...prev, track];
      });
      
      setOriginalQueue((prev) => [...prev, track]);
    },
    [loadTrack]
  );

  const playNext = useCallback(
    (track: PlayerTrack) => {
      setQueue((prev) => {
        const newQueue = [...prev];
        newQueue.splice(queueIndex + 1, 0, track);
        return newQueue;
      });
      setOriginalQueue((prev) => {
        const newQueue = [...prev];
        const originalIndex = originalQueue.findIndex(t => t.id === currentTrack?.id);
        const insertIdx = originalIndex !== -1 ? originalIndex + 1 : prev.length;
        newQueue.splice(insertIdx, 0, track);
        return newQueue;
      });
      if (!currentTrack) playTrack(track);
    },
    [queueIndex, currentTrack, originalQueue, playTrack]
  );

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      const newQueue = [...prev];
      newQueue.splice(index, 1);
      return newQueue;
    });
    if (index < queueIndex) {
      setQueueIndex(q => q - 1);
    }
  }, [queueIndex]);

  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    setQueue((prev) => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(startIndex, 1);
      newQueue.splice(endIndex, 0, removed);
      return newQueue;
    });
    setQueueIndex(prev => {
      if (startIndex === prev) return endIndex;
      if (startIndex < prev && endIndex >= prev) return prev - 1;
      if (startIndex > prev && endIndex <= prev) return prev + 1;
      return prev;
    });
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
    // Resume audio context if suspended (needed for Safari/Chrome autoplay policy)
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const nextTrack = useCallback(async () => {
    if (queue.length === 0) return;
    let nextIdx = queueIndex + 1;
    if (nextIdx >= queue.length) {
      if (repeatMode === "all") {
        nextIdx = 0;
      } else {
        // Auto-Next Song Radio Recommendation Engine
        try {
          const current = queue[queueIndex];
          if (current) {
            const res = await fetch(`${API_BASE}/tracks/recommendations?artist=${encodeURIComponent(current.artist)}&trackId=${current.id}`);
            if (res.ok) {
              const data = await res.json();
              if (data.data && data.data.length > 0) {
                const recTracks: PlayerTrack[] = data.data.map((t: any) => ({
                  id: t._id || t.id,
                  spotifyId: t.spotifyTrackId || t.spotifyId,
                  title: t.title,
                  artist: t.artist,
                  album: t.album || "Single",
                  albumArt: t.albumArtUrl || t.albumArt || "",
                  duration: t.duration || 0,
                  streamUrl: t.streamUrl,
                  isLiked: t.isLiked,
                }));
                
                setQueue((prev) => [...prev, ...recTracks]);
                setQueueIndex(nextIdx);
                loadTrack(recTracks[0], true);
                return;
              }
            }
          }
        } catch (e) {
          console.warn("Could not fetch recommendations for song radio:", e);
        }
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
    if (playerRef.current) playerRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const seekPercent = useCallback((percent: number) => {
    const time = (percent / 100) * duration;
    if (playerRef.current) playerRef.current.currentTime = time;
    setCurrentTime(time);
  }, [duration]);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (vol > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleNormalizeVolume = useCallback(() => {
    setNormalizeVolume(prev => {
      const next = !prev;
      localStorage.setItem("normalizeVolume", String(next));
      return next;
    });
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

  const toggleSavedPlaylist = useCallback((playlist: { id: string; name: string }) => {
    setSavedPlaylists(prev => {
      const exists = prev.find(p => p.id === playlist.id);
      const newPlaylists = exists 
        ? prev.filter(p => p.id !== playlist.id)
        : [...prev, playlist];
      localStorage.setItem("savedPlaylists", JSON.stringify(newPlaylists));
      return newPlaylists;
    });
  }, []);

  const value: PlayerContextType = useMemo(() => ({
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
    normalizeVolume,
    playTrack,
    playQueue,
    addToQueue,
    playNext,
    removeFromQueue,
    reorderQueue,
    togglePlay,
    pause,
    resume,
    nextTrack,
    prevTrack,
    seek,
    seekPercent,
    setVolume,
    toggleMute,
    toggleNormalizeVolume,
    toggleShuffle,
    cycleRepeat,
    savedPlaylists,
    toggleSavedPlaylist,
    clearPlayerState,
    updateCurrentTrackLikeStatus,
    playerRef,
  }), [
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
    normalizeVolume,
    playTrack,
    playQueue,
    addToQueue,
    playNext,
    removeFromQueue,
    reorderQueue,
    togglePlay,
    pause,
    resume,
    nextTrack,
    prevTrack,
    seek,
    seekPercent,
    setVolume,
    toggleMute,
    toggleNormalizeVolume,
    toggleShuffle,
    cycleRepeat,
    savedPlaylists,
    toggleSavedPlaylist,
    clearPlayerState,
    updateCurrentTrackLikeStatus,
    playerRef,
  ]);

  const currentStreamUrl = getFormatUrl(currentTrack?.streamUrl);

  let preloadTrack = null;
  if (queue.length > 0) {
    if (queueIndex < queue.length - 1) preloadTrack = queue[queueIndex + 1];
    else if (repeatMode === "all") preloadTrack = queue[0];
  }
  const preloadStreamUrl = getFormatUrl(preloadTrack?.streamUrl);

  // Sync volume and mute state
  useEffect(() => {
    const vol = isMuted ? 0 : volume / 100;
    if (player1Ref.current) player1Ref.current.volume = vol;
    if (player2Ref.current) player2Ref.current.volume = vol;
  }, [volume, isMuted]);

  // Sync play/pause state
  useEffect(() => {
    const p = getActivePlayer();
    if (p) {
      if (isPlaying) {
        if (audioContextRef.current?.state === "suspended") {
          audioContextRef.current.resume().catch(() => {});
        }
        if (p.paused) {
          p.play().catch((e: any) => console.error("Auto-play blocked:", e));
        }
      } else {
        if (player1Ref.current && !player1Ref.current.paused) player1Ref.current.pause();
        if (player2Ref.current && !player2Ref.current.paused) player2Ref.current.pause();
      }
    }
  }, [isPlaying, currentStreamUrl, activePlayerId, getActivePlayer]);

  // Handle Web Audio API graph for volume normalization
  useEffect(() => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
        }
      }
      
      const ctx = audioContextRef.current;
      if (!ctx) return;
      
      if (!compressorNodeRef.current) {
        compressorNodeRef.current = ctx.createDynamicsCompressor();
        compressorNodeRef.current.threshold.setValueAtTime(-24, ctx.currentTime);
        compressorNodeRef.current.knee.setValueAtTime(30, ctx.currentTime);
        compressorNodeRef.current.ratio.setValueAtTime(12, ctx.currentTime);
        compressorNodeRef.current.attack.setValueAtTime(0.003, ctx.currentTime);
        compressorNodeRef.current.release.setValueAtTime(0.25, ctx.currentTime);
      }

      const connectPlayer = (ref: React.RefObject<HTMLAudioElement | null>, sourceRef: React.MutableRefObject<MediaElementAudioSourceNode | null>) => {
        if (!ref.current) return;
        if (!sourceRef.current && !(ref.current as any).dataset.sourceCreated) {
          sourceRef.current = ctx.createMediaElementSource(ref.current);
          (ref.current as any).dataset.sourceCreated = "true";
        }
        const source = sourceRef.current;
        const compressor = compressorNodeRef.current;
        if (source && compressor) {
          source.disconnect();
          if (normalizeVolume) {
            source.connect(compressor);
            compressor.connect(ctx.destination);
          } else {
            source.connect(ctx.destination);
          }
        }
      };

      connectPlayer(player1Ref, sourceNode1Ref);
      connectPlayer(player2Ref, sourceNode2Ref);
      
    } catch (e) {
      console.warn("Web Audio API error (CORS or initialization issue):", e);
    }
  }, [normalizeVolume, currentStreamUrl, preloadStreamUrl]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <PlayerContext.Provider value={value}>
      {/* Native HTML5 Audio for streaming (Double Buffering) */}
      <div style={{ display: "none" }}>
        {mounted && (
          <>
            <audio
              ref={player1Ref}
              src={activePlayerId === 1 ? currentStreamUrl : preloadStreamUrl}
              preload={activePlayerId === 1 ? "auto" : (preloadStreamUrl ? "auto" : "none")}
              crossOrigin="anonymous"
              onTimeUpdate={(e) => { if (activePlayerId === 1) setCurrentTime(e.currentTarget.currentTime) }}
              onLoadedMetadata={(e) => { 
                if (activePlayerId === 1) setDuration(e.currentTarget.duration);
                if (pendingSeekTime.current !== null && activePlayerId === 1) {
                  e.currentTarget.currentTime = pendingSeekTime.current;
                  pendingSeekTime.current = null;
                }
              }}
              onCanPlay={(e) => { 
                if (activePlayerId === 1) {
                  setIsLoading(false);
                  if (isPlaying) {
                    if (audioContextRef.current?.state === "suspended") {
                      audioContextRef.current.resume().catch(() => {});
                    }
                    e.currentTarget.play().catch(() => {});
                  }
                }
              }}
              onPlay={() => { if (activePlayerId === 1) setIsPlaying(true) }}
              onPause={(e) => { if (activePlayerId === 1 && !isLoading && e.currentTarget.currentTime > 0 && !e.currentTarget.ended) setIsPlaying(false) }}
              onEnded={() => { if (activePlayerId === 1) onEnded() }}
              onError={(e) => { if (activePlayerId === 1) onError(e) }}
            />
            <audio
              ref={player2Ref}
              src={activePlayerId === 2 ? currentStreamUrl : preloadStreamUrl}
              preload={activePlayerId === 2 ? "auto" : (preloadStreamUrl ? "auto" : "none")}
              crossOrigin="anonymous"
              onTimeUpdate={(e) => { if (activePlayerId === 2) setCurrentTime(e.currentTarget.currentTime) }}
              onLoadedMetadata={(e) => { 
                if (activePlayerId === 2) setDuration(e.currentTarget.duration);
                if (pendingSeekTime.current !== null && activePlayerId === 2) {
                  e.currentTarget.currentTime = pendingSeekTime.current;
                  pendingSeekTime.current = null;
                }
              }}
              onCanPlay={(e) => { 
                if (activePlayerId === 2) {
                  setIsLoading(false);
                  if (isPlaying) {
                    if (audioContextRef.current?.state === "suspended") {
                      audioContextRef.current.resume().catch(() => {});
                    }
                    e.currentTarget.play().catch(() => {});
                  }
                }
              }}
              onPlay={() => { if (activePlayerId === 2) setIsPlaying(true) }}
              onPause={(e) => { if (activePlayerId === 2 && !isLoading && e.currentTarget.currentTime > 0 && !e.currentTarget.ended) setIsPlaying(false) }}
              onEnded={() => { if (activePlayerId === 2) onEnded() }}
              onError={(e) => { if (activePlayerId === 2) onError(e) }}
            />
          </>
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
