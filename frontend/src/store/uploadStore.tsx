"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";
import { parseBlob } from "music-metadata-browser";
import axios from "axios";
import { mapSongToPlayerTrack } from "@/lib/api";

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
  uploadAll: (addToQueue: (track: any) => void) => Promise<void>;
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

  const uploadAll = async (addToQueue: (track: any) => void) => {
    // We get the current list of pending tracks by looking at the state ref,
    // or just rely on the current state. To avoid closure staleness across loops,
    // we can use a ref or just loop over the captured `tracks`.
    // We will just loop over the captured `tracks` for simplicity.
    const pendingTracks = tracks.filter(t => t.status === "pending" || t.status === "error");

    const CONCURRENCY_LIMIT = 4;
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
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              updateTrackField(track.id, "progress", percentCompleted);
            }
          }
        });
      };

      try {
        const response = await performUpload();
        
        updateTrackField(track.id, "status", "success");
        if (response.data) {
          addToQueue(mapSongToPlayerTrack(response.data));
        }
      } catch (err: any) {
        if (err.response?.status === 409) {
          // Silently skip duplicate track as requested by user
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
