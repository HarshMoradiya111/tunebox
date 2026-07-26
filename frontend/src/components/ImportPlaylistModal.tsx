import { useState } from "react";
import { X, Loader2, CheckCircle2, AlertTriangle, Music, ArrowRight, ExternalLink } from "lucide-react";
import { importPlaylistApi, ImportPlaylistResult } from "@/lib/api";
import { useRouter } from "next/navigation";

interface ImportPlaylistModalProps {
  onClose: () => void;
}

export function ImportPlaylistModal({ onClose }: ImportPlaylistModalProps) {
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportPlaylistResult | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      setError("Please enter a valid Spotify playlist URL or ID");
      return;
    }

    // Automatically format if user just pasted an ID
    let finalUrl = cleanUrl;
    if (!cleanUrl.includes("spotify.com/playlist/") && !cleanUrl.startsWith("http")) {
      finalUrl = `https://open.spotify.com/playlist/${cleanUrl}`;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await importPlaylistApi(finalUrl);
      setResult(res);
      window.dispatchEvent(new Event("saved_playlists_changed"));
    } catch (err: any) {
      setError(err.message || "Failed to import playlist. Ensure the link is public and valid.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPlaylist = () => {
    onClose();
    if (result?.playlist) {
      const targetId = result.playlist._id || result.playlist.spotifyId;
      if (targetId) {
        router.push(`/playlist/${targetId}`);
      }
    }
  };

  const handleViewMissingQueue = () => {
    onClose();
    router.push("/library/missing");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 animate-fade-in">
      <div 
        className="bg-[#282828] rounded-xl w-full max-w-md overflow-hidden shadow-2xl border border-[#3e3e3e]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#3e3e3e]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-[#1db954]" />
            Import Spotify Playlist
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#b3b3b3] hover:text-white rounded-full hover:bg-[#3e3e3e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <p className="text-sm text-[#b3b3b3] leading-relaxed">
              Match tracks from a Spotify playlist against your local song library without downloading from external sources.
            </p>

            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label htmlFor="url" className="text-sm font-medium text-white">
                Spotify Playlist URL or ID
              </label>
              <input
                id="url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
                className="w-full px-3 py-2.5 bg-[#3e3e3e] text-white placeholder-[#7a7a7a] border border-transparent rounded-md focus:border-[#1db954] focus:outline-none focus:ring-1 focus:ring-[#1db954] transition-colors text-sm"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="p-3 bg-[#181818] rounded-lg border border-[#333] space-y-1 text-xs text-[#a0a0a0]">
              <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1db954]" /> How it works:
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Tracks existing in your library are added immediately.</li>
                <li>Missing tracks are queued for you to upload later.</li>
                <li>When you upload a missing track, it joins the playlist automatically!</li>
              </ul>
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
                disabled={isSubmitting || !url.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-[#1db954] text-black text-sm font-bold rounded-full hover:scale-105 hover:bg-[#1ed760] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Matching Library...
                  </>
                ) : (
                  "Import Playlist"
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-4 p-3 bg-[#181818] rounded-lg border border-[#333]">
              {result.playlist.coverImage ? (
                <img 
                  src={result.playlist.coverImage} 
                  alt={result.playlist.name} 
                  className="w-16 h-16 rounded object-cover shadow"
                />
              ) : (
                <div className="w-16 h-16 rounded bg-[#333] flex items-center justify-center text-white">
                  <Music className="w-8 h-8 text-[#1db954]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-base truncate">{result.playlist.name}</h3>
                <p className="text-xs text-[#b3b3b3] truncate">By {result.playlist.owner || "Spotify"}</p>
                <p className="text-xs text-[#1db954] font-medium mt-1">{result.message}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#1db954]/10 border border-[#1db954]/30 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1.5 text-[#1db954] font-bold text-lg mb-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                  {result.matchedCount}
                </div>
                <div className="text-xs text-white font-medium">Matched & Added</div>
                <div className="text-[10px] text-[#a0a0a0]">Ready to play</div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-lg mb-0.5">
                  <AlertTriangle className="w-5 h-5" />
                  {result.missingCount}
                </div>
                <div className="text-xs text-white font-medium">Missing Tracks</div>
                <div className="text-[10px] text-[#a0a0a0]">Added to queue</div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-end">
              {result.missingCount > 0 && (
                <button
                  type="button"
                  onClick={handleViewMissingQueue}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#3e3e3e] hover:bg-[#4a4a4a] text-white text-sm font-bold rounded-full transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-amber-400" />
                  Missing Queue ({result.missingCount})
                </button>
              )}
              <button
                type="button"
                onClick={handleViewPlaylist}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-[#1db954] text-black text-sm font-bold rounded-full hover:scale-105 hover:bg-[#1ed760] transition-all"
              >
                View Playlist
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
