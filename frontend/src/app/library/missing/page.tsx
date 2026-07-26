"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  AlertCircle, 
  Trash2, 
  Upload, 
  Search, 
  Loader2, 
  Music, 
  ExternalLink, 
  CheckCircle2, 
  RefreshCw 
} from "lucide-react";
import { fetchMissingTracksQueue, removeMissingTrackFromQueue, MissingTrackItem } from "@/lib/api";

export default function MissingSongsPage() {
  const [tracks, setTracks] = useState<MissingTrackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMissingTracksQueue();
      setTracks(data || []);
    } catch (err: any) {
      console.error("Failed to load missing tracks queue:", err);
      setError("Failed to load missing tracks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleRemove = async (playlistId: string | undefined, spotifyId: string) => {
    if (!playlistId) return;
    setRemovingId(`${playlistId}-${spotifyId}`);
    try {
      const success = await removeMissingTrackFromQueue(playlistId, spotifyId);
      if (success) {
        setTracks((prev) => prev.filter((t) => !(t.playlistId === playlistId && t.spotifyId === spotifyId)));
      }
    } catch (err) {
      console.error("Failed to remove track from queue:", err);
    } finally {
      setRemovingId(null);
    }
  };

  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    const q = searchQuery.toLowerCase();
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.album && t.album.toLowerCase().includes(q)) ||
        (t.playlistName && t.playlistName.toLowerCase().includes(q))
    );
  }, [tracks, searchQuery]);

  return (
    <div className="flex flex-col gap-6 -mx-4 -mt-4 md:-mx-6 md:-mt-6 min-h-screen">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-amber-900/60 via-[#181818] to-[#121212] p-6 sm:p-10 pt-12 sm:pt-16 flex flex-col gap-4 border-b border-[#282828]">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400 shadow-lg shrink-0">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
              Library Queue
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-0.5">
              Missing Songs
            </h1>
          </div>
        </div>
        
        <p className="text-sm text-[#b3b3b3] max-w-2xl leading-relaxed">
          These tracks were referenced in your imported Spotify playlists but haven&apos;t been added to your local MP3 library yet. When you upload audio matching their title and artist, they will resolve automatically!
        </p>

        <div className="flex items-center gap-4 pt-2 flex-wrap">
          <Link
            href="/upload"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1db954] text-black font-bold text-sm rounded-full hover:scale-105 hover:bg-[#1ed760] transition-all shadow-md"
          >
            <Upload className="w-4 h-4" />
            <span>Upload MP3s Now</span>
          </Link>
          <button
            onClick={loadQueue}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#282828] hover:bg-[#333] text-white font-medium text-xs rounded-full transition-colors border border-[#3e3e3e]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>
          <div className="text-xs text-[#7a7a7a]">
            {tracks.length} {tracks.length === 1 ? "track" : "tracks"} waiting in queue
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 md:px-8 pb-32 space-y-6">
        {/* Search Bar */}
        {tracks.length > 0 && (
          <div className="flex items-center justify-between gap-4 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7a7a]" />
              <input
                type="text"
                placeholder="Filter by title, artist, or playlist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#1f1f1f] border border-[#333] rounded-full text-sm text-white placeholder-[#7a7a7a] focus:outline-none focus:border-[#1db954] transition-colors"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadQueue} className="underline font-bold text-xs">Retry</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-[#7a7a7a] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#1db954]" />
            <span className="text-sm font-medium">Loading missing songs queue...</span>
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[#141414] rounded-xl border border-[#282828] p-8 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#1db954]/10 flex items-center justify-center text-[#1db954] mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1.5">Your queue is empty!</h3>
            <p className="text-[#b3b3b3] text-xs sm:text-sm mb-6 leading-relaxed">
              All tracks in your imported playlists have matching audio in your library, or you haven&apos;t imported any playlists with missing tracks yet.
            </p>
            <Link
              href="/upload"
              className="px-6 py-2.5 bg-[#282828] hover:bg-[#333] text-white text-xs font-bold rounded-full transition-all border border-[#3e3e3e]"
            >
              Go to Uploads
            </Link>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="py-16 text-center text-[#7a7a7a] text-sm">
            No missing tracks match your search filter &quot;{searchQuery}&quot;.
          </div>
        ) : (
          <div className="bg-[#141414] rounded-xl border border-[#282828] overflow-hidden shadow-xl">
            <div className="grid grid-cols-[24px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_80px] gap-4 px-4 py-3 text-xs font-semibold text-[#7a7a7a] uppercase tracking-wider border-b border-[#282828] bg-[#1a1a1a]">
              <div className="text-center">#</div>
              <div>Title / Artist</div>
              <div className="hidden md:block">Album</div>
              <div>Playlist</div>
              <div className="text-right">Action</div>
            </div>

            <div className="divide-y divide-[#222]">
              {filteredTracks.map((item, idx) => {
                const isRemoving = removingId === `${item.playlistId}-${item.spotifyId}`;
                return (
                  <div 
                    key={`${item.playlistId}-${item.spotifyId}-${idx}`} 
                    className="grid grid-cols-[24px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_80px] gap-4 px-4 py-3.5 text-sm items-center hover:bg-[#1f1f1f] transition-colors group"
                  >
                    <div className="text-center text-xs text-[#7a7a7a] font-medium">{idx + 1}</div>
                    
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate text-sm flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                      <div className="text-xs text-[#a0a0a0] truncate mt-0.5">{item.artist}</div>
                    </div>

                    <div className="hidden md:block text-xs text-[#a0a0a0] truncate">
                      {item.album || "Unknown Album"}
                    </div>

                    <div className="min-w-0">
                      {item.playlistId ? (
                        <Link
                          href={`/playlist/${item.playlistId}`}
                          className="inline-flex items-center gap-1 text-xs text-[#1db954] hover:underline font-medium truncate max-w-full"
                        >
                          <span className="truncate">{item.playlistName || "View Playlist"}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </Link>
                      ) : (
                        <span className="text-xs text-[#7a7a7a]">Unknown Playlist</span>
                      )}
                    </div>

                    <div className="text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRemove(item.playlistId, item.spotifyId)}
                        disabled={isRemoving || !item.playlistId}
                        title="Remove from queue"
                        className="p-1.5 text-[#7a7a7a] hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
                      >
                        {isRemoving ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
