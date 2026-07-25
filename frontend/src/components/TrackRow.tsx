"use client";

import Image from "next/image";
import { Play, Pause, Heart, MoreHorizontal, ListPlus, Trash2, Pencil, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { MockTrack } from "@/lib/mockData";
import { usePlayer, PlayerTrack } from "@/store/playerStore";
import { deleteUploadedTrack, updateUploadedTrack } from "@/lib/api";
import { useRouter } from "next/navigation";

interface TrackRowProps {
  track: MockTrack;
  index: number;
  /** All tracks in the current list (for queue) */
  allTracks?: MockTrack[];
}

function mockToPlayerTrack(t: MockTrack): PlayerTrack {
  return {
    id: t.id,
    spotifyId: t.spotifyId,
    title: t.title,
    artist: t.artist,
    album: t.album,
    albumArt: t.albumArt,
    duration: t.duration,
    streamUrl: t.streamUrl, // From Phase 7 pre-fetched cache
  };
}

export default function TrackRow({ track, index, allTracks }: TrackRowProps) {
  const { currentTrack, isPlaying, playTrack, playQueue, togglePlay, addToQueue, pause } =
    usePlayer();
  const [isLiked, setIsLiked] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(track.title);
  const [editArtist, setEditArtist] = useState(track.artist);
  const [editAlbum, setEditAlbum] = useState(track.album);
  
  // Local display states (so UI updates immediately after save)
  const [displayTitle, setDisplayTitle] = useState(track.title);
  const [displayArtist, setDisplayArtist] = useState(track.artist);
  const [displayAlbum, setDisplayAlbum] = useState(track.album);

  const router = useRouter();

  // Update local display if props change (e.g. via router.refresh())
  useEffect(() => {
    setDisplayTitle(track.title);
    setDisplayArtist(track.artist);
    setDisplayAlbum(track.album);
    setEditTitle(track.title);
    setEditArtist(track.artist);
    setEditAlbum(track.album);
  }, [track.title, track.artist, track.album]);

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
      playQueue(allTracks.map(mockToPlayerTrack), index);
    } else {
      playTrack(mockToPlayerTrack(track));
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
      setDisplayTitle(editTitle);
      setDisplayArtist(editArtist);
      setDisplayAlbum(editAlbum);
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
    setIsEditing(false);
  };

  if (isDeleted) return null;

  return (
    <div
      className={`grid grid-cols-[16px_4fr_3fr_2fr_minmax(100px,1fr)] items-center gap-4 px-4 py-2.5 rounded-md hover:bg-[#ffffff10] text-[#b3b3b3] text-sm group transition-colors select-none ${isEditing ? "bg-[#ffffff10]" : "cursor-pointer"}`}
      onDoubleClick={handlePlay}
    >
      {/* Column 1: Index Number / Play Icon */}
      <div className="flex items-center justify-center font-medium">
        <button
          onClick={(e) => { e.stopPropagation(); handlePlay(); }}
          className="text-white hover:scale-110 transition-transform"
        >
          {isActive ? (
            <Pause className="w-4 h-4 fill-current text-[#1db954]" />
          ) : (
            <>
              <span className={`group-hover:hidden ${isCurrentTrack ? "text-[#1db954]" : ""}`}>
                {index + 1}
              </span>
              <Play className="w-4 h-4 fill-current hidden group-hover:block text-white" />
            </>
          )}
        </button>
      </div>

      {/* Column 2: Cover Art, Title & Artist */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-10 h-10 rounded overflow-hidden bg-[#242424] shrink-0">
          <Image
            src={track.albumArt}
            alt={displayTitle}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col truncate w-full pr-2">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#282828] text-white text-sm px-2 py-0.5 rounded outline-none focus:ring-1 focus:ring-[#1db954] mb-1 w-full"
                placeholder="Title"
              />
              <input
                type="text"
                value={editArtist}
                onChange={(e) => setEditArtist(e.target.value)}
                onClick={(e) => e.stopPropagation()}
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
              <span className="text-xs text-[#b3b3b3] hover:underline cursor-pointer truncate">
                {displayArtist}
              </span>
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
            className="bg-[#282828] text-white text-sm px-2 py-0.5 rounded outline-none focus:ring-1 focus:ring-[#1db954] w-full"
            placeholder="Album"
          />
        ) : (
          <span className="truncate hover:underline cursor-pointer">
            {displayAlbum}
          </span>
        )}
      </div>

      {/* Column 4: Date Added */}
      <span className="truncate hidden lg:inline">{track.dateAdded}</span>

      {/* Column 5: Heart, Duration & More */}
      <div className="flex items-center justify-end gap-3 text-xs">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveEdit}
              className="text-[#1db954] hover:scale-110 transition-transform"
              title="Save"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={handleCancelEdit}
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
                  className="opacity-0 group-hover:opacity-100 text-[#b3b3b3] hover:text-white transition-opacity"
                  title="Edit metadata"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="opacity-0 group-hover:opacity-100 text-[#b3b3b3] hover:text-red-500 transition-opacity"
                  title="Delete local track"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
              className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                isLiked ? "opacity-100 text-[#1db954]" : "text-[#b3b3b3] hover:text-white"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            </button>
            <span>{formatDuration(track.duration)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToQueue(mockToPlayerTrack(track));
              }}
              className="opacity-0 group-hover:opacity-100 text-[#b3b3b3] hover:text-white transition-opacity"
              title="Add to queue"
            >
              <ListPlus className="w-4 h-4" />
            </button>
            <button onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 text-[#b3b3b3] hover:text-white transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
