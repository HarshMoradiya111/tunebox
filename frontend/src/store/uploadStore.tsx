"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";
import { parseBlob } from "music-metadata-browser";
import axios from "axios";
import { mapSongToPlayerTrack, fetchUploadedTracks } from "@/lib/api";

export interface LocalTrack {
  id: string;
  file: File;
  title: string;
  artist: string;
  album: string;
  duration: number;
  albumArt: string;
  coverFile?: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error" | "skipped";
}

interface UploadContextType {
  tracks: LocalTrack[];
  processFiles: (files: File[]) => Promise<void>;
  removeTrack: (id: string) => void;
  updateTrackField: (id: string, field: keyof LocalTrack, value: string | number) => void;
  uploadAll: (addToQueue: (track: any) => void, targetPlaylist?: string) => Promise<void>;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<LocalTrack[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const updateTrackField = (id: string, field: keyof LocalTrack, value: string | number) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const processFiles = async (files: File[]) => {
    const audioFiles = files.filter(f => f.type.startsWith("audio/"));
    
    for (const file of audioFiles) {
      try {
        const metadata = await parseBlob(file);
        
        let albumArtUrl = "";
        let coverFile: File | undefined;

        if (metadata.common.picture && metadata.common.picture.length > 0) {
          const pic = metadata.common.picture[0];
          const blob = new Blob([new Uint8Array(pic.data)], { type: pic.format });
          albumArtUrl = URL.createObjectURL(blob);
          coverFile = new File([blob], 'cover.jpg', { type: pic.format });
        }

        const newTrack: LocalTrack = {
          id: crypto.randomUUID(),
          file,
          title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ""),
          artist: metadata.common.artist || "Unknown Artist",
          album: metadata.common.album || "Unknown Album",
          duration: metadata.format.duration || 0,
          albumArt: albumArtUrl,
          coverFile,
          progress: 0,
          status: "pending"
        };

        setTracks(prev => [...prev, newTrack]);
      } catch (err) {
        console.error("Error parsing file metadata:", err);
      }
    }
  };

  const removeTrack = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  const uploadAll = async (addToQueue: (track: any) => void, targetPlaylist?: string) => {
    // 1. Fetch existing library tracks to pre-check duplicates instantly (0ms)
    let existingTracks: any[] = [];
    try {
      existingTracks = await fetchUploadedTracks();
    } catch (e) {
      console.warn("Could not fetch existing tracks for duplicate pre-check:", e);
    }

    const existingMap = new Set(
      existingTracks.map((t) => `${(t.title || "").toLowerCase().trim()}|${(t.artist || "").toLowerCase().trim()}`)
    );

    // Pre-mark existing duplicates as 'skipped' instantly without uploading files over network
    setTracks((prev) =>
      prev.map((t) => {
        if (t.status === "pending" || t.status === "error") {
          const key = `${(t.title || "").toLowerCase().trim()}|${(t.artist || "").toLowerCase().trim()}`;
          if (existingMap.has(key)) {
            return { ...t, status: "skipped", progress: 100 };
          }
        }
        return t;
      })
    );

    // Give state a moment to update skipped items
    await new Promise((r) => setTimeout(r, 50));

    const pendingTracks = tracks.filter(t => (t.status === "pending" || t.status === "error") && 
      !existingMap.has(`${(t.title || "").toLowerCase().trim()}|${(t.artist || "").toLowerCase().trim()}`));

    if (pendingTracks.length === 0) return;

    const CONCURRENCY_LIMIT = 6;
    let index = 0;

    const uploadNext = async (): Promise<void> => {
      if (index >= pendingTracks.length) return;
      const track = pendingTracks[index++];

      updateTrackField(track.id, "status", "uploading");
      updateTrackField(track.id, "progress", 0);
      
      const formData = new FormData();
      formData.append("audio", track.file);
      formData.append("title", track.title);
      formData.append("artist", track.artist);
      formData.append("album", track.album);
      formData.append("duration", track.duration.toString());
      if (targetPlaylist) {
        formData.append("playlist", targetPlaylist);
      }
      if (track.coverFile) {
        formData.append("coverArt", track.coverFile);
      }

      const performUpload = async (forceUpload = false) => {
        if (forceUpload) formData.append("force", "true");
        return axios.post(`${API_URL}/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.min(99, Math.round((progressEvent.loaded * 100) / progressEvent.total));
              updateTrackField(track.id, "progress", percentCompleted);
            }
          }
        });
      };

      try {
        const response = await performUpload();
        
        updateTrackField(track.id, "progress", 100);
        updateTrackField(track.id, "status", "success");
        if (response.data) {
          addToQueue(mapSongToPlayerTrack(response.data));
        }
      } catch (err: any) {
        if (err.response?.status === 409) {
          updateTrackField(track.id, "progress", 100);
          updateTrackField(track.id, "status", "skipped");
        } else {
          console.error("Upload failed for", track.title, err);
          updateTrackField(track.id, "status", "error");
        }
      }

      // Continue to next track in the queue
      await uploadNext();
    };

    const workers = [];
    for (let i = 0; i < Math.min(CONCURRENCY_LIMIT, pendingTracks.length); i++) {
      workers.push(uploadNext());
    }

    await Promise.all(workers);
  };

  return (
    <UploadContext.Provider value={{ tracks, processFiles, removeTrack, updateTrackField, uploadAll }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}
