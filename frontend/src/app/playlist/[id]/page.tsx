import Image from "next/image";
import { Clock } from "lucide-react";
import TrackRow from "@/components/TrackRow";
import PlaylistActionBar from "./PlaylistActionBar";
import { fetchPlaylist, ApiPlaylistDetail } from "@/lib/api";
import { MOCK_TRACKS, MockTrack } from "@/lib/mockData";
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
    "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&h=500&fit=crop";
  let description = "Your favorite hits and top releases updated daily.";
  let owner = "TuneBox";
  let trackCount = MOCK_TRACKS.length;
  let tracks: MockTrack[] = MOCK_TRACKS;
  let importStatus = "";

  // Try to fetch real data from backend
  try {
    const playlist: ApiPlaylistDetail = await fetchPlaylist(id);
    playlistName = playlist.name;
    coverImage = playlist.coverImage || coverImage;
    description = playlist.description || description;
    owner = playlist.owner || owner;
    trackCount = playlist.totalTracks || playlist.tracks.length;
    importStatus = playlist.importStatus || "";

    // Map API tracks to MockTrack shape for the TrackRow component
    if (playlist.tracks && playlist.tracks.length > 0) {
      tracks = playlist.tracks.map((t: any) => ({
        id: t._id || t.spotifyId,
        spotifyId: t.spotifyId,
        title: t.title,
        artist: t.artist,
        album: t.album,
        albumArt: t.albumArt,
        duration: Math.round(t.duration / 1000), // ms to seconds
        dateAdded: "Recently",
        streamUrl: t.streamUrl,
      }));
    }
  } catch {
    // Backend not running — use mock data (already set above)
  }

  const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);
  const totalMinutes = Math.round(totalDuration / 60);

  return (
    <div className="flex flex-col gap-6 -mx-6 -mt-6">
      {/* Hero Banner Section */}
      <div className="bg-gradient-to-b from-indigo-900 via-indigo-950 to-[#121212] p-8 pt-12 flex flex-col sm:flex-row items-end gap-6">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-md shadow-2xl overflow-hidden bg-[#242424] shrink-0">
          <Image
            src={coverImage}
            alt={playlistName}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-3 min-w-0">
          <span className="text-xs uppercase tracking-wider font-bold text-white">
            Playlist
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight line-clamp-2">
            {playlistName}
          </h1>
          <p className="text-sm text-[#b3b3b3]">{description}</p>
          <div className="flex items-center gap-2 text-xs text-white font-medium">
            <span className="font-bold">{owner}</span>
            <span>•</span>
            <span>{trackCount} songs,</span>
            <span className="text-[#b3b3b3]">about {totalMinutes} min</span>
          </div>
        </div>
      </div>

      <ImportPoller 
        playlistId={id} 
        initialStatus={importStatus} 
        initialTotal={trackCount} 
        initialImported={tracks.length} 
      />

      {/* Action Bar Section */}
      <PlaylistActionBar tracks={tracks} playlistInfo={{ id, name: playlistName }} />

      {/* Track Table Header */}
      <div className="px-6">
        <div className="grid grid-cols-[16px_4fr_3fr_2fr_minmax(100px,1fr)] items-center gap-4 px-4 py-2 text-[#b3b3b3] text-xs font-medium border-b border-[#282828] uppercase tracking-wider">
          <span>#</span>
          <span>Title</span>
          <span className="hidden md:inline">Album</span>
          <span className="hidden lg:inline">Date Added</span>
          <div className="flex justify-end">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Track Rows */}
        <div className="flex flex-col gap-1 mt-2">
          {tracks.map((track, index) => (
            <TrackRow key={track.id} track={track} index={index} allTracks={tracks} />
          ))}
        </div>
      </div>
    </div>
  );
}
