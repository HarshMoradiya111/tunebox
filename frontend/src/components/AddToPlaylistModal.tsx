"use client";

import { useState, useEffect } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { getUserPlaylists, createUserPlaylist, addTrackToUserPlaylist } from "@/lib/api";

interface AddToPlaylistModalProps {
  trackId: string;
  onClose: () => void;
}

export default function AddToPlaylistModal({ trackId, onClose }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const data = await getUserPlaylists();
      setPlaylists(data || []);
    } catch (err) {
      console.error("Failed to fetch user playlists", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      setCreatingLoading(true);
      const newPlaylist = await createUserPlaylist(newPlaylistName.trim());
      await addTrackToUserPlaylist(newPlaylist._id || newPlaylist.spotifyId, trackId);
      alert(`Added to ${newPlaylist.name}`);
      onClose();
    } catch (err) {
      console.error("Failed to create and add", err);
      alert("Failed to create playlist");
    } finally {
      setCreatingLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlist: any) => {
    try {
      setAddingTo(playlist._id);
      await addTrackToUserPlaylist(playlist._id, trackId);
      alert(`Added to ${playlist.name}`);
      onClose();
    } catch (err) {
      console.error("Failed to add to playlist", err);
      alert("Failed to add track");
    } finally {
      setAddingTo(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div 
        className="bg-[#282828] w-full max-w-sm rounded-lg shadow-xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white font-bold">Add to Playlist</h2>
          <button onClick={onClose} className="text-[#b3b3b3] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#1db954] animate-spin" />
            </div>
          ) : (
            <div className="space-y-1">
              {!isCreating ? (
                <button 
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/10 text-white transition-colors group"
                >
                  <div className="w-10 h-10 bg-white/10 flex items-center justify-center rounded group-hover:bg-white/20 transition-colors">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Create a new playlist</span>
                </button>
              ) : (
                <form onSubmit={handleCreate} className="flex gap-2 items-center px-3 py-2 bg-white/5 rounded-md mb-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Playlist name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="flex-1 bg-transparent text-white text-sm outline-none"
                    disabled={creatingLoading}
                  />
                  <button 
                    type="submit" 
                    disabled={!newPlaylistName.trim() || creatingLoading}
                    className="text-[#1db954] text-sm font-bold disabled:opacity-50"
                  >
                    {creatingLoading ? "..." : "Create"}
                  </button>
                </form>
              )}

              {playlists.map(p => (
                <button 
                  key={p._id}
                  onClick={() => handleAddToPlaylist(p)}
                  disabled={addingTo === p._id}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/10 text-white transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-[#333] flex items-center justify-center rounded overflow-hidden shrink-0">
                    {p.coverImage ? (
                      <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl text-[#b3b3b3]">♪</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-[#b3b3b3]">{p.totalTracks} tracks</div>
                  </div>
                  {addingTo === p._id && (
                    <Loader2 className="w-4 h-4 text-[#1db954] animate-spin" />
                  )}
                </button>
              ))}
              
              {!loading && playlists.length === 0 && !isCreating && (
                <div className="text-center py-6 text-[#b3b3b3] text-sm">
                  You don't have any playlists yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
