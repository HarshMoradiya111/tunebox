"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importPlaylistApi } from "@/lib/api";

export default function ImportPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.includes("spotify.com/playlist/")) {
      setError("Please enter a valid Spotify playlist URL");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const playlist = await importPlaylistApi(url);
      if (playlist && playlist.spotifyId) {
        router.push(`/playlist/${playlist.spotifyId}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to import playlist. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#121212] text-white p-6">
      <div className="max-w-md w-full bg-[#181818] rounded-xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold mb-2">Import Playlist</h1>
        <p className="text-gray-400 mb-8">
          Paste a Spotify playlist link below to instantly import it into your library.
        </p>

        <form onSubmit={handleImport} className="flex flex-col gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://open.spotify.com/playlist/..."
            className="w-full bg-[#2a2a2a] text-white rounded px-4 py-3 outline-none focus:ring-2 focus:ring-[#1db954] transition-all"
            required
          />

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading || !url}
            className="w-full bg-[#1db954] hover:bg-[#1ed760] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 rounded-full transition-colors mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing...
              </>
            ) : (
              "Import Playlist"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
