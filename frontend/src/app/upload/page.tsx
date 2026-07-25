"use client";

import { useState, useRef, useEffect } from "react";
import { parseBlob } from "music-metadata-browser";
import axios from "axios";
import { Upload, Music, X, Play, HardDrive } from "lucide-react";
import Image from "next/image";
import { mapSongToPlayerTrack, fetchStorageUsage } from "@/lib/api";
import { usePlayer } from "@/store/playerStore";

interface LocalTrack {
  id: string;
  file: File;
  title: string;
  artist: string;
  album: string;
  duration: number;
  albumArt: string; // Object URL or empty string
  coverFile?: File; // Extracted cover file to send to backend
  progress: number;
  status: "pending" | "uploading" | "success" | "error" | "skipped";
}

export default function UploadPage() {
  const [tracks, setTracks] = useState<LocalTrack[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [storageUsage, setStorageUsage] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { addToQueue } = usePlayer();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(Array.from(e.target.files));
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  useEffect(() => {
    fetchStorageUsage().then(data => setStorageUsage(data)).catch(err => console.error(err));
  }, []);

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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeTrack = (id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  const updateTrackField = (id: string, field: keyof LocalTrack, value: string | number) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const uploadAll = async () => {
    const pendingTracks = tracks.filter(t => t.status === "pending" || t.status === "error");
    
    for (const track of pendingTracks) {
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
          // Ask user to force upload
          const proceed = window.confirm(`"${track.title}" by ${track.artist} already exists in your library. Do you want to upload it anyway?`);
          if (proceed) {
            updateTrackField(track.id, "progress", 0);
            try {
              const response = await performUpload(true);
              updateTrackField(track.id, "status", "success");
              if (response.data) {
                addToQueue(mapSongToPlayerTrack(response.data));
              }
            } catch (err2) {
              console.error("Force upload failed for", track.title, err2);
              updateTrackField(track.id, "status", "error");
            }
          } else {
            updateTrackField(track.id, "status", "skipped");
          }
        } else {
          console.error("Upload failed for", track.title, err);
          updateTrackField(track.id, "status", "error");
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full text-white max-w-4xl mx-auto w-full pt-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Upload Music</h1>
        
        {storageUsage && (
          <div className="flex items-center gap-2 text-sm text-[#b3b3b3] bg-[#282828] py-1.5 px-3 rounded-full">
            <HardDrive className="w-4 h-4" />
            <span>
              Storage: {(storageUsage.storage.usage / (1024 * 1024)).toFixed(1)} MB / {(storageUsage.storage.limit / (1024 * 1024)).toFixed(1)} MB
            </span>
            <div className="w-16 h-1.5 bg-[#404040] rounded-full overflow-hidden ml-1">
              <div 
                className="h-full bg-[#1db954]"
                style={{ width: `${(storageUsage.storage.usage / storageUsage.storage.limit) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Upload Dropzone */}
      <div 
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          isDragging ? "border-[#1db954] bg-[#1db954]/10" : "border-[#282828] hover:border-[#b3b3b3]"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-[#b3b3b3]" />
        <h3 className="text-lg font-medium mb-2">Drag & Drop audio files or folders here</h3>
        <p className="text-[#b3b3b3] text-sm mb-6">or click a button below to browse from your device</p>
        
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#1db954] text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
          >
            Select Files
          </button>
          
          <button 
            onClick={() => folderInputRef.current?.click()}
            className="bg-[#282828] text-white font-bold py-3 px-8 rounded-full hover:scale-105 hover:bg-[#333] transition-colors"
          >
            Select Folder
          </button>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="audio/*" 
          multiple 
          onChange={handleFileChange}
        />
        
        <input 
          type="file" 
          ref={folderInputRef} 
          className="hidden" 
          accept="audio/*" 
          // @ts-expect-error webkitdirectory is a non-standard attribute but widely supported
          webkitdirectory="true" 
          directory="true" 
          multiple 
          onChange={handleFileChange}
        />
      </div>

      {/* Track List */}
      {tracks.length > 0 && (
        <div className="mt-8 flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold">Selected Files ({tracks.length})</h2>
            <button 
              onClick={uploadAll}
              disabled={!tracks.some(t => t.status === "pending" || t.status === "error")}
              className="bg-white text-black font-bold py-2 px-6 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload All
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {tracks.map((track) => (
              <div key={track.id} className={`bg-[#181818] rounded-lg p-4 flex gap-4 items-center group relative ${track.status === 'skipped' ? 'opacity-50' : ''}`}>
                {/* Cover Art Preview */}
                <div className="w-16 h-16 bg-[#282828] rounded flex shrink-0 items-center justify-center relative overflow-hidden">
                  {track.albumArt ? (
                    <Image src={track.albumArt} alt="Cover" fill className="object-cover" />
                  ) : (
                    <Music className="w-6 h-6 text-[#b3b3b3]" />
                  )}
                </div>

                {/* Metadata Editable Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col">
                    <label className="text-xs text-[#b3b3b3] mb-1">Title</label>
                    <input 
                      type="text" 
                      value={track.title}
                      onChange={(e) => updateTrackField(track.id, "title", e.target.value)}
                      disabled={track.status === "uploading" || track.status === "success"}
                      className="bg-[#282828] text-sm text-white px-3 py-1.5 rounded outline-none focus:ring-1 focus:ring-[#1db954] disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-[#b3b3b3] mb-1">Artist</label>
                    <input 
                      type="text" 
                      value={track.artist}
                      onChange={(e) => updateTrackField(track.id, "artist", e.target.value)}
                      disabled={track.status === "uploading" || track.status === "success"}
                      className="bg-[#282828] text-sm text-white px-3 py-1.5 rounded outline-none focus:ring-1 focus:ring-[#1db954] disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-[#b3b3b3] mb-1">Album</label>
                    <input 
                      type="text" 
                      value={track.album}
                      onChange={(e) => updateTrackField(track.id, "album", e.target.value)}
                      disabled={track.status === "uploading" || track.status === "success"}
                      className="bg-[#282828] text-sm text-white px-3 py-1.5 rounded outline-none focus:ring-1 focus:ring-[#1db954] disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Status & Progress */}
                <div className="w-24 shrink-0 flex flex-col items-end gap-2">
                  <span className={`text-xs font-medium uppercase ${
                    track.status === "success" ? "text-[#1db954]" :
                    track.status === "error" ? "text-red-500" :
                    track.status === "uploading" ? "text-blue-400" :
                    track.status === "skipped" ? "text-[#b3b3b3]" :
                    "text-[#b3b3b3]"
                  }`}>
                    {track.status}
                  </span>
                  
                  {track.status === "uploading" && (
                    <div className="w-full h-1 bg-[#282828] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#1db954] transition-all duration-300"
                        style={{ width: `${track.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Remove button */}
                {track.status !== "uploading" && track.status !== "success" && (
                  <button 
                    onClick={() => removeTrack(track.id)}
                    className="absolute -top-2 -right-2 bg-[#282828] rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
