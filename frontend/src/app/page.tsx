import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import CarouselRow from "@/components/CarouselRow";
import {
  fetchFeaturedPlaylists,
  fetchNewReleases,
  ApiFeaturedPlaylist,
  ApiNewRelease,
} from "@/lib/api";
import {
  MOCK_FEATURED_PLAYLISTS,
  MOCK_NEW_RELEASES,
  MOCK_RECENT_GRID,
  MockMediaItem,
} from "@/lib/mockData";

// Convert API data to the MockMediaItem shape the Card component expects
function playlistToMediaItem(p: ApiFeaturedPlaylist): MockMediaItem {
  return {
    id: p.spotifyId,
    title: p.name,
    subtitle: p.description || `${p.totalTracks} songs`,
    image: p.coverImage,
    type: "playlist",
  };
}

function releaseToMediaItem(r: ApiNewRelease): MockMediaItem {
  return {
    id: r.spotifyId,
    title: r.name,
    subtitle: `${r.artist} • ${r.albumType}`,
    image: r.coverImage,
    type: "album",
  };
}

export const dynamic = "force-dynamic";

export default async function Home() {
  let featuredItems: MockMediaItem[];
  let newReleaseItems: MockMediaItem[];

  try {
    const [featured, releases] = await Promise.all([
      fetchFeaturedPlaylists(),
      fetchNewReleases(),
    ]);
    featuredItems = featured.map(playlistToMediaItem);
    newReleaseItems = releases.map(releaseToMediaItem);
  } catch {
    // Fallback to mock data when backend is not running
    featuredItems = MOCK_FEATURED_PLAYLISTS;
    newReleaseItems = MOCK_NEW_RELEASES;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Recent grid uses mock data for now (would need user-specific data / auth)
  const recentGrid = MOCK_RECENT_GRID;

  return (
    <div className="flex flex-col gap-8 select-none">
      {/* Dynamic Greeting & Quick 2x3 Grid */}
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {getGreeting()}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {recentGrid.map((item) => (
            <Link
              key={item.id}
              href={`/playlist/${item.id}`}
              className="flex items-center gap-3 bg-[#ffffff10] hover:bg-[#ffffff20] transition-colors rounded-md overflow-hidden group cursor-pointer pr-4"
            >
              <div className="relative w-16 h-16 shrink-0 bg-[#242424]">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
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
      </section>

      {/* Featured Playlists Row */}
      <CarouselRow title="Featured Playlists" items={featuredItems} />

      {/* New Releases Row */}
      <CarouselRow title="New Releases" items={newReleaseItems} />
    </div>
  );
}
