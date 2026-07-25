import Image from "next/image";
import { Clock, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import TrackRow from "@/components/TrackRow";
import PlaylistActionBar from "./PlaylistActionBar";
import { fetchPlaylist, ApiPlaylistDetail, deleteUserPlaylist } from "@/lib/api";
import ImportPoller from "./ImportPoller";

interface PlaylistPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const { id } = await params;

  let playlistName = id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  let coverImage =
    "https://placehold.co/500x500/222/FFF?text=Playlist";
  let description = "";
  let owner = "TuneBox";
  let trackCount = 0;
  let tracks: any[] = [];
  let importStatus = "";
  let isUserCreated = false;

  // Try to fetch real data from backend
  try {
    const playlist: ApiPlaylistDetail = await fetchPlaylist(id);
    playlistName = playlist.name;
    coverImage = playlist.coverImage || coverImage;
    description = playlist.description || description;
    owner = playlist.owner || owner;
    trackCount = playlist.totalTracks || playlist.tracks.length;
    importStatus = playlist.importStatus || "";
    isUserCreated = playlist.isUserCreated || false;

    // Map API tracks to shape for the TrackRow component
    // Convert to PlayerTrack format
    if (playlist.tracks && playlist.tracks.length > 0) {
      tracks = playlist.tracks.map((t: any) => ({
        id: t._id || t.id,
        spotifyId: t.spotifyId || t.spotifyTrackId || "",
        title: t.title || t.name || "Unknown",
        artist: t.artist || (t.artists ? t.artists.map((a: any) => a.name).join(", ") : "Unknown Artist"),
        album: t.album || (t.album && t.album.name) || "Unknown Album",
        albumArt: t.albumArt || (t.album && t.album.images && t.album.images[0]?.url) || "",
        duration: t.duration || t.duration_ms || 0,
        streamUrl: t.streamUrl || undefined,
        isLiked: t.isLiked || false,
      }));
    }
  } catch (e) {
    console.error("Failed to fetch playlist:", e);
  }

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration > 10000 ? Math.round(t.duration / 1000) : Math.round(t.duration || 0)), 0);
  const totalMinutes = Math.round(totalDuration / 60);

  return (
    <div className="flex flex-col gap-6 -mx-4 -mt-4 md:-mx-6 md:-mt-6">
      {/* Hero Banner Section */}
      <div className="bg-gradient-to-b from-indigo-900 via-indigo-950 to-[#121212] p-4 sm:p-8 pt-10 sm:pt-12 flex flex-col sm:flex-row items-center sm:items-end text-center sm:text-left gap-4 sm:gap-6">
        <div className="relative w-40 h-40 sm:w-56 sm:h-56 rounded-md shadow-2xl overflow-hidden bg-[#242424] shrink-0">
          <Image
            src={coverImage}
            alt={playlistName}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-2 sm:gap-3 min-w-0">
          <span className="text-xs uppercase tracking-wider font-bold text-white">
            Playlist
          </span>
          <h1 className="text-3xl sm:text-6xl font-black text-white tracking-tight line-clamp-2">
            {playlistName}
          </h1>
          <p className="text-xs sm:text-sm text-[#b3b3b3]">{description}</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-white font-medium flex-wrap">
            <span className="font-bold">{owner}</span>
            <span>•</span>
            <span>{trackCount} songs,</span>
            <span className="text-[#b3b3b3]">about {totalMinutes} min</span>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8">
        {!isUserCreated && (importStatus === "pending" || importStatus === "importing") && (
          <ImportPoller 
            playlistId={id} 
            initialStatus={importStatus}
            initialImported={tracks.length}
            initialTotal={trackCount}
          />
        )}
      </div>

      {/* Action Bar Section */}
      <PlaylistActionBar tracks={tracks} playlistInfo={{ id, name: playlistName }} isUserCreated={isUserCreated} />

      <div className="px-4 md:px-8 pb-32">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h3 className="text-xl font-bold text-white mb-2">This playlist is empty</h3>
            <p className="text-[#b3b3b3] text-sm mb-6 max-w-sm">
              Add songs from your library or search for tracks to build your playlist.
            </p>
            <Link 
              href="/library/uploads" 
              className="px-6 py-2.5 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
            >
              Go to Local Library
            </Link>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[16px_minmax(0,1fr)_120px] md:grid-cols-[16px_minmax(0,1fr)_minmax(0,1fr)_120px] gap-4 px-4 py-2 text-sm text-[#b3b3b3] border-b border-[#282828] mb-4">
              <div className="text-center">#</div>
              <div>Title</div>
              <div className="hidden md:block">Album</div>
              <div className="text-right flex items-center justify-end pr-8">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            {/* Track List */}
            <div className="flex flex-col">
              {tracks.map((track, index) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={index}
                  allTracks={tracks}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
