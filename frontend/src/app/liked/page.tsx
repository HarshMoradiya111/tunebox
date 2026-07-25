"use client";

import { useEffect, useState } from "react";
import { fetchLikedTracks } from "@/lib/api";
import { PlayerTrack } from "@/store/playerStore";
import TrackRow from "@/components/TrackRow";
import { TrackItem } from "@/types";
import { Heart, Play, Shuffle, Clock } from "lucide-react";
import { usePlayer } from "@/store/playerStore";

// Convert PlayerTrack back to TrackItem for TrackRow compatibility
function playerTrackToTrackItem(t: PlayerTrack): TrackItem {
  return {
    id: t.id,
    spotifyId: t.spotifyId || "",
    title: t.title,
    artist: t.artist,
    album: t.album,
    albumArt: t.albumArt,
    duration: t.duration,
    streamUrl: t.streamUrl,
    isLiked: t.isLiked,
    dateAdded: new Date().toLocaleDateString(),
  };
}

export default function LikedSongsPage() {
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { playQueue, isPlaying, currentTrack, pause, togglePlay } = usePlayer();

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const data = await fetchLikedTracks();
        setTracks(data.map(playerTrackToTrackItem));
      } catch (err) {
        console.error("Failed to load liked tracks:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTracks();
  }, []);

  const isCurrentPlaylistPlaying = 
    isPlaying && 
    tracks.length > 0 && 
    tracks.some(t => t.id === currentTrack?.id);

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    if (isCurrentPlaylistPlaying) {
      pause();
    } else if (tracks.some(t => t.id === currentTrack?.id)) {
      togglePlay();
    } else {
      playQueue(tracks.map(t => ({
        id: t.id,
        spotifyId: t.spotifyId,
        title: t.title,
        artist: t.artist,
        album: t.album,
        albumArt: t.albumArt,
        duration: t.duration,
        streamUrl: t.streamUrl,
        isLiked: t.isLiked,
      })), 0);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#282828] to-[#121212] overflow-y-auto">
      {/* Header */}
      <div className="flex items-end gap-6 p-6 pt-16 mt-8">
        <div className="w-48 h-48 bg-gradient-to-br from-indigo-600 to-purple-800 shadow-2xl flex items-center justify-center rounded">
          <Heart className="w-24 h-24 text-white fill-white" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold text-white uppercase">Playlist</span>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter">Liked Songs</h1>
          <p className="text-[#b3b3b3] text-sm mt-2 font-medium">
            Your favorite tracks. {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}.
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-6 flex items-center gap-6 bg-black/20">
        <button 
          onClick={handlePlayAll}
          className="w-14 h-14 bg-[#1db954] rounded-full flex items-center justify-center hover:scale-105 transition-transform hover:bg-[#1ed760] shadow-xl"
        >
          {isCurrentPlaylistPlaying ? (
             <div className="w-5 h-5 flex gap-1 justify-center items-end">
               <div className="w-1.5 h-3 bg-black animate-pulse" />
               <div className="w-1.5 h-5 bg-black animate-pulse" style={{ animationDelay: '0.1s' }} />
               <div className="w-1.5 h-4 bg-black animate-pulse" style={{ animationDelay: '0.2s' }} />
             </div>
          ) : (
            <Play className="w-7 h-7 text-black fill-current ml-1" />
          )}
        </button>
        <button className="text-[#b3b3b3] hover:text-white transition-colors">
          <Shuffle className="w-8 h-8" />
        </button>
      </div>

      {/* Track List */}
      <div className="px-6 pb-24">
        {isLoading ? (
          <div className="text-center py-10 text-[#b3b3b3]">Loading your music...</div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-20 text-[#b3b3b3]">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-white mb-2">Songs you like will appear here</h3>
            <p>Save songs by tapping the heart icon.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Header Row */}
            <div className="grid grid-cols-[16px_4fr_3fr_2fr_minmax(100px,1fr)] items-center gap-4 px-4 py-2 border-b border-[#282828] text-[#b3b3b3] text-xs uppercase font-medium mb-4">
              <span className="text-center">#</span>
              <span>Title</span>
              <span className="hidden md:inline">Album</span>
              <span className="hidden lg:inline">Date Added</span>
              <span className="text-right flex items-center justify-end">
                <Clock className="w-4 h-4 mr-10" />
              </span>
            </div>
            {/* Tracks */}
            {tracks.map((track, idx) => (
              <TrackRow 
                key={track.id} 
                track={track} 
                index={idx} 
                allTracks={tracks} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
