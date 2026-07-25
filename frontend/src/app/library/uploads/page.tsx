"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchUploadedTracks, batchDeleteTracks, batchTagTracks } from "@/lib/api";
import { PlayerTrack } from "@/store/playerStore";
import TrackRow from "@/components/TrackRow";
import { TrackItem } from "@/types";
import { Music, Play, Shuffle, Download, CheckSquare, Square, Trash2, Tag, Filter } from "lucide-react";
import VirtualizedTrackList from "@/components/VirtualizedTrackList";
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
    dateAdded: new Date().toLocaleDateString(),
    tags: t.tags,
  };
}

export default function UploadsPage() {
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState("");
  const [batchTagsInput, setBatchTagsInput] = useState("");
  const [showBatchTagsInput, setShowBatchTagsInput] = useState(false);
  const { playQueue, isPlaying, currentTrack, pause, togglePlay } = usePlayer();

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const data = await fetchUploadedTracks();
        setTracks(data.map(playerTrackToTrackItem));
      } catch (err) {
        console.error("Failed to load uploaded tracks:", err);
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
      })), 0);
    }
  };

  const filteredTracks = useMemo(() => {
    if (!tagFilter.trim()) return tracks;
    const term = tagFilter.toLowerCase().trim();
    return tracks.filter(t => t.tags && t.tags.some(tag => tag.toLowerCase().includes(term)));
  }, [tracks, tagFilter]);

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedTrackIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTrackIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedTrackIds.size === filteredTracks.length) {
      setSelectedTrackIds(new Set());
    } else {
      setSelectedTrackIds(new Set(filteredTracks.map(t => t.id)));
    }
  };

  const handleExport = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/library/export`, "_blank");
  };

  const handleBatchDelete = async () => {
    if (selectedTrackIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedTrackIds.size} tracks?`)) {
      try {
        await batchDeleteTracks(Array.from(selectedTrackIds));
        setTracks(prev => prev.filter(t => !selectedTrackIds.has(t.id)));
        setSelectedTrackIds(new Set());
        setSelectionMode(false);
      } catch (err) {
        console.error(err);
        alert("Failed to batch delete.");
      }
    }
  };

  const handleBatchTag = async () => {
    if (selectedTrackIds.size === 0 || !batchTagsInput.trim()) return;
    try {
      const tags = batchTagsInput.split(",").map(t => t.trim()).filter(Boolean);
      await batchTagTracks(Array.from(selectedTrackIds), tags);
      setTracks(prev => prev.map(t => {
        if (selectedTrackIds.has(t.id)) {
          return { ...t, tags: Array.from(new Set([...(t.tags || []), ...tags])) };
        }
        return t;
      }));
      setBatchTagsInput("");
      setShowBatchTagsInput(false);
      setSelectedTrackIds(new Set());
      setSelectionMode(false);
    } catch (err) {
      console.error(err);
      alert("Failed to batch tag.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#282828] to-[#121212] overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end text-center sm:text-left gap-4 sm:gap-6 p-4 sm:p-6 pt-10 sm:pt-16 mt-2 sm:mt-8">
        <div className="w-36 h-36 sm:w-48 sm:h-48 bg-gradient-to-br from-green-400 to-[#1db954] shadow-2xl flex items-center justify-center rounded shrink-0">
          <Music className="w-16 h-16 sm:w-24 sm:h-24 text-black" />
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <span className="text-xs sm:text-sm font-bold text-white uppercase">Playlist</span>
          <h1 className="text-3xl sm:text-6xl font-bold text-white tracking-tighter">My Uploads</h1>
          <p className="text-[#b3b3b3] text-xs sm:text-sm mt-1 font-medium">
            Your personal local library. {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}.
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-black/20">
        <div className="flex items-center gap-6">
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
          
          <button 
            onClick={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) setSelectedTrackIds(new Set());
            }}
            className={`flex items-center gap-2 font-medium px-3 py-1.5 rounded-full border transition-colors ${selectionMode ? 'border-[#1db954] text-[#1db954]' : 'border-[#b3b3b3] text-[#b3b3b3] hover:text-white hover:border-white'}`}
          >
            <CheckSquare className="w-4 h-4" />
            {selectionMode ? 'Cancel Selection' : 'Select'}
          </button>
          
          <button onClick={handleExport} className="flex items-center gap-2 font-medium text-[#b3b3b3] hover:text-white px-3 py-1.5 rounded-full border border-transparent hover:border-white transition-colors">
            <Download className="w-4 h-4" />
            Export Library
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto bg-[#242424] px-3 py-1.5 rounded-full border border-transparent focus-within:border-[#727272] transition-colors">
          <Filter className="w-4 h-4 text-[#b3b3b3]" />
          <input 
            type="text" 
            placeholder="Filter by tag..."
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-white w-full md:w-48 placeholder-[#b3b3b3]"
          />
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectionMode && selectedTrackIds.size > 0 && (
        <div className="mx-6 mb-4 bg-[#1db954]/20 border border-[#1db954] rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <span className="font-bold text-white">{selectedTrackIds.size} tracks selected</span>
          
          <div className="flex items-center gap-3">
            {showBatchTagsInput ? (
              <div className="flex items-center gap-2 bg-[#282828] rounded-full px-2 py-1">
                <input 
                  type="text" 
                  value={batchTagsInput}
                  onChange={(e) => setBatchTagsInput(e.target.value)}
                  placeholder="Tags (comma-separated)"
                  className="bg-transparent border-none outline-none text-sm text-white w-40 px-2"
                />
                <button onClick={handleBatchTag} className="text-[#1db954] font-bold text-sm px-2 hover:underline">Apply</button>
                <button onClick={() => setShowBatchTagsInput(false)} className="text-[#b3b3b3] text-sm px-2 hover:text-white">Cancel</button>
              </div>
            ) : (
              <button 
                onClick={() => setShowBatchTagsInput(true)}
                className="flex items-center gap-2 bg-[#282828] hover:bg-[#333] text-white px-4 py-2 rounded-full text-sm font-bold transition-colors"
              >
                <Tag className="w-4 h-4" /> Add Tags
              </button>
            )}
            
            <button 
              onClick={handleBatchDelete}
              className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-full text-sm font-bold transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Track List */}
      <div className="px-6 pb-24">
        {isLoading ? (
          <div className="text-center py-10 text-[#b3b3b3]">Loading your music...</div>
        ) : filteredTracks.length === 0 ? (
          <div className="text-center py-20 text-[#b3b3b3]">
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-white mb-2">No tracks found</h3>
            <p>Adjust your tag filter or upload some files.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Header Row */}
            <div className="grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_4fr_3fr_2fr_minmax(100px,1fr)] items-center gap-2 md:gap-4 px-2 md:px-4 py-2 border-b border-[#282828] text-[#b3b3b3] text-xs uppercase font-medium mb-4">
              <div className="text-center flex justify-center">
                {selectionMode ? (
                  <button onClick={handleSelectAll} className="hover:text-white transition-colors">
                    {selectedTrackIds.size === filteredTracks.length && filteredTracks.length > 0 ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <span>#</span>
                )}
              </div>
              <span>Title</span>
              <span className="hidden md:inline">Album</span>
              <span className="hidden lg:inline">Date Added</span>
              <span className="text-right flex items-center justify-end">
                <Music className="w-4 h-4" />
              </span>
            </div>
            {/* Tracks */}
            <VirtualizedTrackList 
              tracks={filteredTracks}
              selectable={selectionMode}
              selectedTrackIds={selectedTrackIds}
              onToggleSelect={handleToggleSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}
