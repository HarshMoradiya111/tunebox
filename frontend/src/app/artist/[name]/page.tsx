"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { Play, Music } from "lucide-react";
import { getArtistTracks } from "@/lib/api";
import { mapSongToPlayerTrack, mapTrackToPlayerTrack } from "@/lib/api";
import { usePlayer, PlayerTrack } from "@/store/playerStore";
import TrackRow from "@/components/TrackRow";
import { TrackItem } from "@/types";

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
    dateAdded: new Date().toLocaleDateString(),
    tags: t.tags,
  };
}

export default function ArtistPage({ params }: { params: Promise<{ name: string }> }) {
  const resolvedParams = use(params);
  const artistName = decodeURIComponent(resolvedParams.name);
  
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { playQueue, isPlaying, currentTrack, pause, togglePlay } = usePlayer();

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        const data = await getArtistTracks(artistName);
        const mappedTracks = data.map((t: any) => {
          const pt = t.spotifyTrackId ? mapSongToPlayerTrack(t) : mapTrackToPlayerTrack(t);
          return playerTrackToTrackItem(pt);
        });
        setTracks(mappedTracks);
      } catch (error) {
        console.error("Failed to fetch artist tracks", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArtistData();
  }, [artistName]);

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
      })), 0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const coverImage = tracks.length > 0 && tracks[0].albumArt ? tracks[0].albumArt : "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop";

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#282828] to-[#121212] overflow-y-auto pb-24">
      {/* Header */}
      <div className="relative h-64 md:h-80 w-full flex items-end p-6 pt-16 mt-8 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <Image src={coverImage} alt={artistName} fill className="object-cover blur-xl" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end text-center sm:text-left gap-4 sm:gap-6">
          <div className="w-36 h-36 sm:w-56 sm:h-56 rounded-full shadow-2xl overflow-hidden relative border-4 border-black/20 shrink-0">
            <Image src={coverImage} alt={artistName} fill sizes="(max-width: 768px) 144px, 224px" className="object-cover" />
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-xs uppercase font-bold text-white tracking-wider">Verified Artist</span>
            <h1 className="text-3xl sm:text-6xl font-black text-white tracking-tight line-clamp-1">{artistName}</h1>
            <p className="text-xs sm:text-sm text-[#b3b3b3]">{tracks.length} tracks</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-6 flex items-center gap-4 bg-black/20 sticky top-0 z-20">
        <button
          onClick={handlePlayAll}
          disabled={tracks.length === 0}
          className="w-14 h-14 bg-[#1db954] rounded-full flex items-center justify-center hover:scale-105 transition-transform hover:bg-[#1ed760] shadow-xl disabled:opacity-50 disabled:hover:scale-100"
        >
          {isCurrentPlaylistPlaying ? (
            <div className="w-5 h-5 flex gap-1 justify-center items-end">
              <div className="w-1.5 h-3 bg-black animate-pulse" />
              <div className="w-1.5 h-5 bg-black animate-pulse" style={{ animationDelay: '0.1s' }} />
              <div className="w-1.5 h-4 bg-black animate-pulse" style={{ animationDelay: '0.2s' }} />
            </div>
          ) : (
            <Play className="w-7 h-7 text-black fill-current translate-x-1" />
          )}
        </button>
      </div>

      {/* Track List */}
      <div className="px-6 pb-24">
        {tracks.length === 0 ? (
          <div className="text-center py-20 text-[#b3b3b3]">
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-white mb-2">No tracks found</h3>
            <p>We couldn't find any tracks for this artist.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="grid grid-cols-[16px_4fr_3fr_2fr_minmax(100px,1fr)] items-center gap-4 px-4 py-2 border-b border-[#282828] text-[#b3b3b3] text-xs uppercase font-medium mb-4">
              <div className="text-center">#</div>
              <span>Title</span>
              <span className="hidden md:inline">Album</span>
              <span className="hidden lg:inline">Date Added</span>
              <span className="text-right flex items-center justify-end">
                <Music className="w-4 h-4 mr-10" />
              </span>
            </div>
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
