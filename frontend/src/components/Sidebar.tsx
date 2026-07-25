"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Library,
  Plus,
  Heart,
  Music2,
  Compass,
  Sparkles,
  Upload,
  ListVideo,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { usePlayer } from "@/store/playerStore";
import { fetchAutoPlaylists, getUserPlaylists } from "@/lib/api";
import { CreatePlaylistModal } from "./CreatePlaylistModal";

export default function Sidebar() {
  const pathname = usePathname();
  const [autoPlaylists, setAutoPlaylists] = useState<any[]>([]);
  const [likedCount, setLikedCount] = useState<number>(0);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAutoPlaylists, setShowAutoPlaylists] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [savedPlaylists, setSavedPlaylists] = useState<any[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);

  useEffect(() => {
    fetchAutoPlaylists().then(setAutoPlaylists).catch(console.error);
    
    const fetchCount = () => {
      import("@/lib/api").then((api) => {
        api.fetchLikedCount().then(setLikedCount).catch(console.error);
      });
    };
    
    fetchCount();
    
    window.addEventListener("like_toggled", fetchCount);
    
    const fetchUserPlaylists = async () => {
      try {
        const lists = await getUserPlaylists();
        setUserPlaylists(lists || []);
      } catch (err) {
        console.error("Failed to fetch user playlists", err);
      }
    };

    // Update playlists state
    const updatePlaylists = () => {
      const saved = localStorage.getItem("savedPlaylists");
      if (saved) {
        setSavedPlaylists(JSON.parse(saved));
      } else {
        setSavedPlaylists([]);
      }
      fetchUserPlaylists();
    };
    
    updatePlaylists();
    window.addEventListener("saved_playlists_changed", updatePlaylists);
    
    return () => {
      window.removeEventListener("like_toggled", fetchCount);
      window.removeEventListener("saved_playlists_changed", updatePlaylists);
    };
  }, []);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowPlusMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const mainNav = [
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/search", icon: Search },
    { name: "Your Library", href: "/liked", icon: Library },
    { name: "Upload", href: "/upload", icon: Upload },
  ];

  return (
    <>
      {/* Desktop Sidebar (md+) */}
      <aside className="hidden md:flex w-64 bg-black h-full flex-col p-3 gap-2 select-none text-[#b3b3b3] shrink-0">
        {/* Brand & Main Navigation Block */}
        <div className="bg-[#121212] rounded-lg p-4 flex flex-col gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl px-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-[#1db954] flex items-center justify-center text-black shadow-md shadow-[#1db954]/20">
              <Music2 className="w-5 h-5 fill-current" />
            </div>
            <span className="tracking-tight">TuneBox</span>
          </Link>

          <nav className="flex flex-col gap-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-4 px-3 py-2.5 rounded-md font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? "text-white bg-[#282828] font-semibold"
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
        <div className="bg-[#121212] rounded-lg p-3 flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Header */}
          <div className="flex items-center justify-between px-2 mb-2 shrink-0">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Compass className="w-5 h-5 text-[#b3b3b3]" />
              <span>Playlists</span>
            </div>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowPlusMenu((prev) => !prev)}
                aria-label="Create or import playlist"
                className="p-1.5 rounded-full hover:bg-[#282828] text-[#b3b3b3] hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Plus Menu Dropdown */}
              {showPlusMenu && (
                <div className="absolute right-0 top-8 w-48 bg-[#282828] border border-[#3e3e3e] rounded-md shadow-xl py-1 z-50 text-xs">
                  <Link
                    href="/upload"
                    onClick={() => setShowPlusMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[#d1d1d1] hover:text-white hover:bg-[#3e3e3e] transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#1db954]" />
                    <span>Upload Local MP3s</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Action Chips */}
          <div className="flex items-center gap-2 px-1 mb-3 shrink-0">
            <Link
              href="/upload"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#242424] hover:bg-[#323232] text-xs font-medium text-white rounded-full transition-colors border border-white/5"
            >
              <Upload className="w-3.5 h-3.5 text-[#1db954]" />
              <span>Upload</span>
            </Link>
          </div>

          {/* Scrollable Library & Playlist Items Container */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4 custom-scrollbar">
            {/* Quick Liked Songs Pill */}
            <Link
              href="/liked"
              className={`flex items-center gap-3 p-2 rounded-md transition-colors group shrink-0 ${
                pathname === "/liked" ? "bg-[#282828]" : "hover:bg-[#1a1a1a]"
              }`}
            >
              <div className="w-9 h-9 rounded bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Heart className="w-4 h-4 fill-white" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-white text-sm font-medium group-hover:underline truncate">Liked Songs</span>
                <span className="text-xs text-[#b3b3b3]">Playlist • {likedCount} {likedCount === 1 ? 'song' : 'songs'}</span>
              </div>
            </Link>

            {/* Auto Playlists Collapsible Section */}
            {autoPlaylists.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[#282828]">
                <button
                  onClick={() => setShowAutoPlaylists(!showAutoPlaylists)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[#727272] hover:text-white transition-colors rounded hover:bg-[#1a1a1a]"
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-[#1db954]" />
                    <span>Auto-Generated ({autoPlaylists.length})</span>
                  </div>
                  {showAutoPlaylists ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>

                {showAutoPlaylists && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {autoPlaylists.map((pl) => {
                      const targetHref = `/playlist/${pl.spotifyId || pl.id}`;
                      const isActive = pathname === targetHref;
                      return (
                        <Link
                          key={pl.spotifyId || pl.id}
                          href={targetHref}
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md transition-colors text-sm group shrink-0 ${
                            isActive
                              ? "bg-[#282828] text-white font-medium"
                              : "text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a]"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-6 h-6 rounded bg-[#242424] flex items-center justify-center text-[#1db954] shrink-0 group-hover:bg-[#282828]">
                              <Sparkles className="w-3 h-3" />
                            </div>
                            <span className="truncate text-xs font-medium">{pl.name}</span>
                          </div>
                          <span className="text-[9px] uppercase tracking-wider font-bold bg-[#1db954]/10 text-[#1db954] border border-[#1db954]/20 px-1 py-0.5 rounded shrink-0">
                            Auto
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* User Playlists List */}
            {userPlaylists.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[#282828]">
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#727272]">
                    My Playlists
                  </div>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="p-1 hover:bg-[#1a1a1a] hover:text-white rounded-full text-[#727272] transition-colors"
                    title="Create Playlist"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {userPlaylists.map((playlist) => {
                  const targetHref = `/playlist/${playlist._id}`;
                  const isActive = pathname === targetHref;
                  return (
                    <Link
                      key={playlist._id}
                      href={targetHref}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs transition-colors shrink-0 group ${
                        isActive
                          ? "bg-[#282828] text-white font-medium"
                          : "text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a]"
                      }`}
                    >
                      <div className="w-8 h-8 bg-[#282828] rounded shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
                        {playlist.coverImage ? (
                          <Image
                            src={playlist.coverImage}
                            alt={playlist.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ListVideo className="w-4 h-4 text-[#b3b3b3]" />
                        )}
                      </div>
                      <span className="truncate block flex-1">{playlist.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Saved from Spotify List */}
            {savedPlaylists.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[#282828]">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#727272]">
                  Saved from Spotify
                </div>
                {savedPlaylists.map((playlist) => {
                  const targetHref = `/playlist/${playlist.id}`;
                  const isActive = pathname === targetHref;
                  return (
                    <Link
                      key={playlist.id}
                      href={targetHref}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs transition-colors shrink-0 group ${
                        isActive
                          ? "bg-[#282828] text-white font-medium"
                          : "text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a]"
                      }`}
                    >
                      <div className="w-8 h-8 bg-[#282828] rounded shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
                        {playlist.coverImage ? (
                          <Image
                            src={playlist.coverImage}
                            alt={playlist.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[#b3b3b3] text-sm">♪</span>
                        )}
                      </div>
                      <span className="truncate block flex-1">{playlist.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (< md) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#090909]/95 backdrop-blur-md border-t border-[#282828] z-50 flex items-center justify-around h-14 px-4 text-[#b3b3b3]">
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

      {showCreateModal && (
        <CreatePlaylistModal onClose={() => setShowCreateModal(false)} />
      )}
    </>
  );
}

