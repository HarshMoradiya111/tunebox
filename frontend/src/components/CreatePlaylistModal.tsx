import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createUserPlaylist } from "@/lib/api";
import { useRouter } from "next/navigation";

interface CreatePlaylistModalProps {
  onClose: () => void;
}

export function CreatePlaylistModal({ onClose }: CreatePlaylistModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const playlistName = name.trim() || `My Playlist #${Math.floor(Math.random() * 1000)}`;
      const newPlaylist = await createUserPlaylist(playlistName, description.trim());
      
      // Dispatch event so sidebar updates
      window.dispatchEvent(new Event("saved_playlists_changed"));
      
      onClose();
      
      if (newPlaylist && newPlaylist._id) {
        router.push(`/playlist/${newPlaylist._id}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create playlist");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
      <div 
        className="bg-[#282828] rounded-xl w-full max-w-md overflow-hidden shadow-2xl border border-[#3e3e3e]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#3e3e3e]">
          <h2 className="text-xl font-bold text-white">Create Playlist</h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#b3b3b3] hover:text-white rounded-full hover:bg-[#3e3e3e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-white">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Playlist #1"
              className="w-full px-3 py-2 bg-[#3e3e3e] text-white border border-transparent rounded-md focus:border-[#1db954] focus:outline-none focus:ring-1 focus:ring-[#1db954] transition-colors"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium text-white">Description <span className="text-[#b3b3b3] text-xs font-normal">(optional)</span></label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add an optional description"
              rows={3}
              className="w-full px-3 py-2 bg-[#3e3e3e] text-white border border-transparent rounded-md focus:border-[#1db954] focus:outline-none focus:ring-1 focus:ring-[#1db954] transition-colors resize-none custom-scrollbar"
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-white hover:scale-105 transition-transform"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-[#1db954] text-black text-sm font-bold rounded-full hover:scale-105 hover:bg-[#1ed760] transition-all disabled:opacity-70 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
