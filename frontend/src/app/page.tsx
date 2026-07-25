import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import CarouselRow from "@/components/CarouselRow";
import {
  fetchFeaturedPlaylists,
  fetchNewReleases,
  fetchRecentlyPlayed,
  fetchMostPlayed,
  fetchRecentlyAdded,
  getArtists,
  fetchQuickAccess,
  ApiFeaturedPlaylist,
  ApiNewRelease,
} from "@/lib/api";
import { MediaItem } from "@/types";
import { PlayerTrack } from "@/store/playerStore";

// Convert API data to the MediaItem shape the Card component expects
function playlistToMediaItem(p: ApiFeaturedPlaylist): MediaItem {
  return {
    id: p.spotifyId,
    title: p.name,
    subtitle: p.description || `${p.totalTracks} songs`,
    image: p.coverImage || `https://placehold.co/400x400/222/FFF?text=${encodeURIComponent(p.name)}`,
    type: "playlist",
  };
}

function releaseToMediaItem(r: ApiNewRelease): MediaItem {
  return {
    id: r.spotifyId,
    title: r.name,
    subtitle: `${r.artist} • ${r.albumType}`,
    image: r.coverImage || `https://placehold.co/400x400/222/FFF?text=${encodeURIComponent(r.name)}`,
    type: "album",
  };
}

function playerTrackToMediaItem(t: PlayerTrack): MediaItem {
  return {
    id: t.spotifyId || t.id,
    title: t.title,
    subtitle: t.artist,
    image: t.albumArt || `https://placehold.co/400x400/222/FFF?text=${encodeURIComponent(t.title)}`,
    type: "album",
  };
}

function artistToMediaItem(a: { name: string; trackCount: number; coverImage: string }): MediaItem {
  return {
    id: a.name,
    title: a.name,
    subtitle: "Artist",
    image: a.coverImage || `https://placehold.co/400x400/222/FFF?text=${encodeURIComponent(a.name)}`,
    type: "artist",
  };
}

export const dynamic = "force-dynamic";

export default async function Home() {
  let featuredItems: MediaItem[] = [];
  let newReleaseItems: MediaItem[] = [];
  let recentlyPlayedItems: MediaItem[] = [];
  let mostPlayedItems: MediaItem[] = [];
  let recentlyAddedItems: MediaItem[] = [];
  let artistItems: MediaItem[] = [];
  let quickAccessItems: MediaItem[] = [];

  try {
    const [featured, releases, recent, mostPlayed, recentlyAdded, artists, quickAccess] = await Promise.all([
      fetchFeaturedPlaylists().catch((e) => { console.error("Featured playlists error:", e); return []; }),
      fetchNewReleases().catch((e) => { console.error("New releases error:", e); return []; }),
      fetchRecentlyPlayed().catch(() => []),
      fetchMostPlayed().catch(() => []),
      fetchRecentlyAdded().catch(() => []),
      getArtists().catch(() => []),
      fetchQuickAccess().catch(() => []),
    ]);
    featuredItems = featured.map(playlistToMediaItem);
    newReleaseItems = releases.map(releaseToMediaItem);

    if (recent && Array.isArray(recent)) {
      recentlyPlayedItems = recent.map(playerTrackToMediaItem);
    }
    if (mostPlayed && Array.isArray(mostPlayed)) {
      mostPlayedItems = mostPlayed.map(playerTrackToMediaItem);
    }
    if (recentlyAdded && Array.isArray(recentlyAdded)) {
      recentlyAddedItems = recentlyAdded.map(playerTrackToMediaItem);
    }
    if (artists && Array.isArray(artists)) {
      artistItems = artists.map(artistToMediaItem);
    }
    if (quickAccess && Array.isArray(quickAccess)) {
      quickAccessItems = quickAccess;
    }
  } catch (e) {
    console.error("Homepage data fetch error:", e);
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col gap-8 select-none">
      {/* Dynamic Greeting & Quick Access Grid */}
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {getGreeting()}
        </h1>

        {quickAccessItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {quickAccessItems.map((item) => (
              <Link
                key={item.id}
                href={item.type === "album" ? `/album/${encodeURIComponent(item.id)}` : `/playlist/${item.id}`}
                className="flex items-center gap-3 bg-[#ffffff10] hover:bg-[#ffffff20] transition-colors rounded-md overflow-hidden group cursor-pointer pr-4"
              >
                <div className="relative w-16 h-16 shrink-0 bg-[#242424]">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>
                <span className="font-bold text-sm text-white truncate flex-1">
                  {item.title}
                </span>
                <button className="w-10 h-10 rounded-full bg-[#1db954] hover:scale-105 flex items-center justify-center text-black shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                </button>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-[#b3b3b3] text-sm">Upload some tracks to see your library here.</p>
        )}
      </section>

      {/* Recently Played Row (if any) */}
      {recentlyPlayedItems.length > 0 && (
        <CarouselRow title="Recently Played" items={recentlyPlayedItems} />
      )}

      {/* Made For You (Smart Playlists) */}
      {mostPlayedItems.length > 0 && (
        <CarouselRow title="Most Played (Made For You)" items={mostPlayedItems} />
      )}

      {recentlyAddedItems.length > 0 && (
        <CarouselRow title="Recently Added" items={recentlyAddedItems} />
      )}

      {artistItems.length > 0 && (
        <CarouselRow title="Artists" items={artistItems} />
      )}

      {/* Featured Playlists Row */}
      {featuredItems.length > 0 && (
        <CarouselRow title="Featured Playlists" items={featuredItems} />
      )}

      {/* New Releases Row */}
      {newReleaseItems.length > 0 && (
        <CarouselRow title="New Releases" items={newReleaseItems} />
      )}
    </div>
  );
}
