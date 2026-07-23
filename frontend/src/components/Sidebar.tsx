"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Library,
  Plus,
  Heart,
  Music2,
  Compass,
} from "lucide-react";
import { usePlayer } from "@/store/playerStore";

export default function Sidebar() {
  const pathname = usePathname();
  const { savedPlaylists } = usePlayer();

  const mainNav = [
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/search", icon: Search },
    { name: "Your Library", href: "/playlist/liked-songs", icon: Library },
  ];

  const defaultPlaylists = [
    { id: "37i9dQZEVXbMDoHDwVN2tF", name: "Top 50 - Global" },
    { id: "37i9dQZF1DXcBWIGoYBM5M", name: "Today's Top Hits" },
    { id: "chill-vibes", name: "Chill Lofi Study Beats" },
    { id: "deep-focus", name: "Deep Focus" },
    { id: "synthwave-drive", name: "Synthwave Retro Drive" },
    { id: "rock-classics", name: "Rock Classics" },
    { id: "coding-mode", name: "Coding Mode Flow State" },
  ];

  // Combine default playlists and saved playlists (avoiding duplicates)
  const allPlaylists = [...defaultPlaylists];
  savedPlaylists.forEach((sp) => {
    if (!allPlaylists.some((p) => p.id === sp.id)) {
      allPlaylists.push(sp);
    }
  });

  return (
    <>
      {/* Desktop Sidebar (md+) */}
      <aside className="hidden md:flex w-64 bg-black h-full flex-col justify-between p-3 gap-2 select-none text-[#b3b3b3]">
        {/* Brand & Main Navigation Block */}
        <div className="bg-[#121212] rounded-lg p-4 flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl px-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#1db954] flex items-center justify-center text-black">
              <Music2 className="w-5 h-5 fill-current" />
            </div>
            <span>TuneBox</span>
          </Link>

          <nav className="flex flex-col gap-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-4 px-3 py-2.5 rounded-md font-medium text-sm transition-colors duration-200 ${
                    isActive
                      ? "text-white bg-[#282828]"
                      : "hover:text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-[#1db954]" : ""}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Library & Playlists Block */}
        <div className="bg-[#121212] rounded-lg p-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Compass className="w-5 h-5 text-[#b3b3b3]" />
              <span>Playlists</span>
            </div>
            <button className="p-1 rounded-full hover:bg-[#282828] text-[#b3b3b3] hover:text-white transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Liked Songs Pill */}
          <Link
            href="/playlist/liked-songs"
            className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] transition-colors group mb-2"
          >
            <div className="w-10 h-10 rounded bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center text-white">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-white text-sm font-medium group-hover:underline">Liked Songs</span>
              <span className="text-xs text-[#b3b3b3]">Playlist • 320 songs</span>
            </div>
          </Link>

          {/* Import Playlist Action */}
          <Link
            href="/import"
            className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] transition-colors group mb-2"
          >
            <div className="w-10 h-10 rounded bg-[#282828] group-hover:bg-[#1a1a1a] flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5 text-[#b3b3b3] group-hover:text-white transition-colors" />
            </div>
            <div className="flex flex-col">
              <span className="text-white text-sm font-medium group-hover:underline">Import Playlist</span>
              <span className="text-xs text-[#b3b3b3]">From Spotify URL</span>
            </div>
          </Link>

          {/* Scrollable Playlist List */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 border-t border-[#282828] pt-2">
            {allPlaylists.map((pl) => (
              <Link
                key={pl.id}
                href={`/playlist/${pl.id}`}
                className="block px-2 py-1.5 rounded text-sm text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a] truncate transition-colors shrink-0"
              >
                {pl.name}
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (< md) */}
      <div className="md:hidden fixed bottom-[96px] left-0 right-0 bg-[#121212]/95 backdrop-blur-md border-t border-[#282828] z-40 flex items-center justify-around py-2 px-4 text-[#b3b3b3]">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-xs transition-colors ${
                isActive ? "text-[#1db954]" : "hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
