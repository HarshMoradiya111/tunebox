"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Pause, Heart, MoreHorizontal, ListPlus, Trash2, Pencil, Check, X, PlaySquare, Clock } from "lucide-react";
import { useState, useEffect, useRef, memo } from "react";
import { TrackItem } from "@/types";
import { usePlayer, PlayerTrack } from "@/store/playerStore";
import { deleteUploadedTrack, updateUploadedTrack } from "@/lib/api";
import { useRouter } from "next/navigation";
import AddToPlaylistModal from "./AddToPlaylistModal";

interface TrackRowProps {
  track: TrackItem;
  index: number;
  allTracks?: TrackItem[];
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

function trackItemToPlayerTrack(t: TrackItem): PlayerTrack {
  return {
    id: t.id,
    spotifyId: t.spotifyId,
    title: t.title,
    artist: t.artist,
    album: t.album,
    albumArt: t.albumArt,
    duration: t.duration,
    streamUrl: t.streamUrl, // From Phase 7 pre-fetched cache
    isLiked: t.isLiked,
  };
}

function TrackRow({ track, index, allTracks, selectable, isSelected, onToggleSelect }: TrackRowProps) {
  const { currentTrack, isPlaying, playTrack, playQueue, togglePlay, addToQueue, playNext, pause } =
    usePlayer();
  const [isLiked, setIsLiked] = useState(track.isLiked || false);
  const [isDeleted, setIsDeleted] = useState(false);
  
  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    try {
      await import("@/lib/api").then(api => api.toggleLikeTrack(track.id));
      window.dispatchEvent(new Event("like_toggled"));
    } catch (err) {
      setIsLiked(isLiked);
    }
  };
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(track.title);
  const [editArtist, setEditArtist] = useState(track.artist);
  const [editAlbum, setEditAlbum] = useState(track.album);
  const [editTags, setEditTags] = useState(track.tags?.join(", ") || "");

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Local display states (so UI updates immediately after save)
  const [displayTitle, setDisplayTitle] = useState(track.title);
  const [displayArtist, setDisplayArtist] = useState(track.artist);
  const [displayAlbum, setDisplayAlbum] = useState(track.album);
  const [displayTags, setDisplayTags] = useState(track.tags || []);
  
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  const router = useRouter();

  // Update local display if props change (e.g. via router.refresh())
  useEffect(() => {
    setDisplayTitle(track.title);
    setDisplayArtist(track.artist);
    setDisplayAlbum(track.album);
    setDisplayTags(track.tags || []);
    setEditTitle(track.title);
    setEditArtist(track.artist);
    setEditAlbum(track.album);
    setEditTags(track.tags?.join(", ") || "");
  }, [track.title, track.artist, track.album, track.tags]);

  const isCurrentTrack = currentTrack?.id === track.id || currentTrack?.spotifyId === track.spotifyId;
  const isActive = isCurrentTrack && isPlaying;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handlePlay = () => {
    if (isEditing) return; // Don't play if clicking around in edit mode
    if (isCurrentTrack) {
      togglePlay();
    } else if (allTracks && allTracks.length > 0) {
      playQueue(allTracks.map(trackItemToPlayerTrack), index);
    } else {
      playTrack(trackItemToPlayerTrack(track));
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this track?")) {
      try {
        await deleteUploadedTrack(track.id);
        if (isCurrentTrack && isPlaying) {
          pause();
        }
        setIsDeleted(true);
        router.refresh(); // Sync server state
      } catch (err) {
        console.error("Failed to delete track:", err);
        alert("Failed to delete track. Please try again.");
      }
    }
  };

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateUploadedTrack(track.id, {
        title: editTitle,
        artist: editArtist,
        album: editAlbum,
      });
      // Tags require a separate API call currently in backend (PATCH /tags)
      const newTags = editTags.split(",").map(t => t.trim()).filter(Boolean);
      await import("@/lib/api").then(api => api.updateTrackTags(track.id, newTags));
      
      setDisplayTitle(editTitle);
      setDisplayArtist(editArtist);
      setDisplayAlbum(editAlbum);
      setDisplayTags(newTags);
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to update track:", err);
      alert("Failed to update track. Please try again.");
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(displayTitle);
    setEditArtist(displayArtist);
    setEditAlbum(displayAlbum);
    setEditTags(displayTags.join(", "));
    setIsEditing(false);
  };

  if (isDeleted) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Play ${displayTitle}`}
      className={`grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_4fr_3fr_2fr_minmax(100px,1fr)] items-center gap-2 md:gap-4 px-2 md:px-4 py-2.5 rounded-md hover:bg-[#ffffff10] text-[#b3b3b3] text-sm group transition-colors select-none outline-none focus-visible:ring-2 focus-visible:ring-[#1db954] focus-visible:ring-inset ${isEditing ? "bg-[#ffffff10]" : "cursor-pointer"}`}
      onDoubleClick={handlePlay}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
          e.preventDefault();
          handlePlay();
        }
      }}
    >
      {/* Column 1: Index Number / Play Icon */}
      <div className="flex items-center justify-center font-medium">
        {selectable ? (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect?.();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 cursor-pointer"
          />
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); handlePlay(); }}
            aria-label={isActive ? "Pause" : "Play"}
            className="text-white hover:scale-110 transition-transform p-1 md:p-0 focus-visible:opacity-100"
          >
            {isActive ? (
            <Pause className="w-4 h-4 fill-current text-[#1db954]" />
          ) : (
            <>
              <span className={`md:group-hover:hidden ${isCurrentTrack ? "text-[#1db954]" : ""}`}>
                {index + 1}
              </span>
              <Play className="w-4 h-4 fill-current hidden md:group-hover:block text-white" />
            </>
          )}
        </button>
        )}
      </div>

      {/* Column 2: Cover Art, Title & Artist */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-10 h-10 rounded overflow-hidden bg-[#242424] shrink-0">
          {track.albumArt && (
            <Image
              src={track.albumArt}
              alt={displayTitle || "Track cover"}
              fill
              sizes="40px"
              className="object-cover"
            />
          )}
        </div>
        <div className="flex flex-col truncate w-full pr-2">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                aria-label="Edit title"
                className="bg-[#282828] text-white text-sm px-2 py-0.5 rounded outline-none focus:ring-1 focus:ring-[#1db954] mb-1 w-full"
                placeholder="Title"
              />
              <input
                type="text"
                value={editArtist}
                onChange={(e) => setEditArtist(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                aria-label="Edit artist"
                className="bg-[#282828] text-white text-xs px-2 py-0.5 rounded outline-none focus:ring-1 focus:ring-[#1db954] w-full"
                placeholder="Artist"
              />
            </>
          ) : (
            <>
              <span
                className={`font-medium truncate hover:underline cursor-pointer ${
                  isCurrentTrack ? "text-[#1db954]" : "text-white"
                }`}
              >
                {displayTitle}
              </span>
              <Link
                href={`/artist/${encodeURIComponent(displayArtist)}`}
                className="text-xs text-[#b3b3b3] hover:underline cursor-pointer truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {displayArtist}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Column 3: Album */}
      <div className="truncate hidden md:flex items-center w-full pr-2">
        {isEditing ? (
          <input
            type="text"
            value={editAlbum}
            onChange={(e) => setEditAlbum(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Edit album"
            className="bg-[#282828] text-white text-sm px-2 py-0.5 rounded outline-none focus:ring-1 focus:ring-[#1db954] w-full"
            placeholder="Album"
          />
        ) : (
          <div className="flex flex-col truncate">
            <span className="truncate hover:underline cursor-pointer">
              {displayAlbum}
            </span>
            {displayTags.length > 0 && (
              <div className="flex gap-1 mt-1 truncate">
                {displayTags.map(tag => (
                  <span key={tag} className="text-[10px] bg-[#333] px-1.5 rounded text-gray-300 truncate">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Column 4: Date Added */}
      <span className="truncate hidden lg:inline">{track.dateAdded}</span>

      {/* Column 5: Heart, Duration & More */}
      <div className="flex items-center justify-end gap-3 text-xs">
        {isEditing ? (
          <>
            <input
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              aria-label="Edit tags"
              className="bg-[#282828] text-white text-xs px-2 py-1 rounded outline-none focus:ring-1 focus:ring-[#1db954] w-24 mr-2"
              placeholder="Tags (comma-separated)"
            />
            <button
              onClick={handleSaveEdit}
              aria-label="Save changes"
              className="text-[#1db954] hover:scale-110 transition-transform"
              title="Save"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={handleCancelEdit}
              aria-label="Cancel editing"
              className="text-red-500 hover:scale-110 transition-transform"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        ) : (
          <>
            {track.spotifyId?.startsWith("local-") && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                  aria-label="Edit metadata"
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-[#b3b3b3] hover:text-white transition-opacity"
                  title="Edit metadata"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  aria-label="Delete local track"
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-[#b3b3b3] hover:text-red-500 transition-opacity"
                  title="Delete local track"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={handleToggleLike}
              aria-label={isLiked ? "Remove from liked songs" : "Save to your liked songs"}
              className={`transition-opacity ${
                isLiked 
                  ? "opacity-100 text-[#1db954]" 
                  : "opacity-100 md:opacity-0 md:group-hover:opacity-100 text-[#b3b3b3] hover:text-white"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            </button>
            <span>{formatDuration(track.duration)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                playNext(trackItemToPlayerTrack(track));
              }}
              aria-label="Play next"
              className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-[#b3b3b3] hover:text-white transition-opacity"
              title="Play next"
            >
              <PlaySquare className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToQueue(trackItemToPlayerTrack(track));
              }}
              aria-label="Add to queue"
              className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-[#b3b3b3] hover:text-white transition-opacity"
              title="Add to queue"
            >
              <ListPlus className="w-4 h-4" />
            </button>
            <div className="relative" ref={menuRef}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }} 
                aria-label="More options" 
                className={`transition-opacity ${isMenuOpen ? "opacity-100 text-white" : "opacity-100 md:opacity-0 md:group-hover:opacity-100 text-[#b3b3b3] hover:text-white"}`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#282828] rounded shadow-lg py-1 z-50 text-sm">
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-[#3e3e3e] text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      setIsPlaylistModalOpen(true);
                    }}
                  >
                    Add to playlist
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {isPlaylistModalOpen && (
        <AddToPlaylistModal 
          trackId={track.id} 
          onClose={() => setIsPlaylistModalOpen(false)} 
        />
      )}
    </div>
  );
}

export default memo(TrackRow);
