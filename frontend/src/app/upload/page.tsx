"use client";

import { useRef, useEffect, useState } from "react";
import { Upload, Music, X, HardDrive } from "lucide-react";
import Image from "next/image";
import { fetchStorageUsage } from "@/lib/api";
import { useUpload } from "@/store/uploadStore";
import { usePlayer } from "@/store/playerStore";

export default function UploadPage() {
  const { 
    tracks, 
    processFiles, 
    removeTrack, 
    updateTrackField, 
    uploadAll 
  } = useUpload();
  
  const { addToQueue } = usePlayer();

  const [isDragging, setIsDragging] = useState(false);
  const [storageUsage, setStorageUsage] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="flex flex-col h-full text-white max-w-4xl mx-auto w-full pt-4 sm:pt-8 px-4 pb-28 sm:pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Upload Music</h1>
        
        {storageUsage && storageUsage.storage && (
          <div className="flex items-center justify-between sm:justify-start gap-2 text-xs sm:text-sm text-[#b3b3b3] bg-[#282828] py-1.5 px-3 rounded-full w-full sm:w-auto">
            <div className="flex items-center gap-2 truncate">
              <HardDrive className="w-4 h-4 shrink-0" />
              <span className="truncate">
                Storage: {(storageUsage.storage.usage / (1024 * 1024)).toFixed(1)} MB / {((storageUsage.storage.limit || 26843545600) / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
            <div className="w-16 h-1.5 bg-[#404040] rounded-full overflow-hidden shrink-0 ml-1">
              <div 
                className="h-full bg-[#1db954]"
                style={{ width: `${(storageUsage.storage.usage / (storageUsage.storage.limit || 26843545600)) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Upload Dropzone */}
      <div 
        className={`border-2 border-dashed rounded-xl p-6 sm:p-12 text-center transition-colors ${
          isDragging ? "border-[#1db954] bg-[#1db954]/10" : "border-[#282828] hover:border-[#b3b3b3]"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-[#b3b3b3]" />
        <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Drag & Drop audio files or folders here</h3>
        <p className="text-[#b3b3b3] text-xs sm:text-sm mb-6">or select files from your device</p>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-xs sm:max-w-none mx-auto">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#1db954] text-black font-bold py-3 px-6 sm:px-8 rounded-full hover:scale-105 transition-transform active:scale-95 text-sm sm:text-base"
          >
            Select Files
          </button>
          
          <button 
            onClick={() => folderInputRef.current?.click()}
            className="bg-[#282828] text-white font-bold py-3 px-6 sm:px-8 rounded-full hover:scale-105 hover:bg-[#333] transition-colors active:scale-95 text-sm sm:text-base"
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
        <div className="mt-6 sm:mt-8 flex-1 flex flex-col min-h-0">
          <div className="flex flex-row justify-between items-center mb-4 gap-2">
            <h2 className="text-lg sm:text-xl font-bold">Selected Files ({tracks.length})</h2>
            <button 
              onClick={() => uploadAll(addToQueue)}
              disabled={!tracks.some(t => t.status === "pending" || t.status === "error")}
              className="bg-white text-black font-bold py-2 px-5 sm:px-6 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Upload All
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1 sm:pr-2">
            {tracks.map((track) => (
              <div key={track.id} className={`bg-[#181818] rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center group relative ${track.status === 'skipped' ? 'opacity-50' : ''}`}>
                {/* Header section on mobile: Cover Art + Status + Delete */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#282828] rounded flex shrink-0 items-center justify-center relative overflow-hidden">
                      {track.albumArt ? (
                        <Image src={track.albumArt} alt="Cover" fill className="object-cover" />
                      ) : (
                        <Music className="w-5 h-5 sm:w-6 sm:h-6 text-[#b3b3b3]" />
                      )}
                    </div>
                    {/* Title preview on mobile */}
                    <div className="sm:hidden truncate font-medium text-sm max-w-[160px]">
                      {track.title || "Untitled"}
                    </div>
                  </div>

                  {/* Status & Mobile Delete Button */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium uppercase ${
                      track.status === "success" ? "text-[#1db954]" :
                      track.status === "error" ? "text-red-500" :
                      track.status === "uploading" ? "text-blue-400" :
                      track.status === "skipped" ? "text-[#b3b3b3]" :
                      "text-[#b3b3b3]"
                    }`}>
                      {track.status}
                    </span>

                    {track.status !== "uploading" && track.status !== "success" && (
                      <button 
                        onClick={() => removeTrack(track.id)}
                        aria-label={`Remove track ${track.title}`}
                        className="bg-[#282828] rounded-full p-1.5 text-[#b3b3b3] hover:text-red-500 hover:bg-red-500/20 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Metadata Editable Fields */}
                <div className="w-full flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="flex flex-col">
                    <label htmlFor={`title-${track.id}`} className="text-xs text-[#b3b3b3] mb-1">Title</label>
                    <input 
                      id={`title-${track.id}`}
                      type="text" 
                      value={track.title}
                      onChange={(e) => updateTrackField(track.id, "title", e.target.value)}
                      disabled={track.status === "uploading" || track.status === "success"}
                      className="bg-[#282828] text-sm text-white px-3 py-1.5 rounded outline-none focus:ring-1 focus:ring-[#1db954] disabled:opacity-50 w-full"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor={`artist-${track.id}`} className="text-xs text-[#b3b3b3] mb-1">Artist</label>
                    <input 
                      id={`artist-${track.id}`}
                      type="text" 
                      value={track.artist}
                      onChange={(e) => updateTrackField(track.id, "artist", e.target.value)}
                      disabled={track.status === "uploading" || track.status === "success"}
                      className="bg-[#282828] text-sm text-white px-3 py-1.5 rounded outline-none focus:ring-1 focus:ring-[#1db954] disabled:opacity-50 w-full"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor={`album-${track.id}`} className="text-xs text-[#b3b3b3] mb-1">Album</label>
                    <input 
                      id={`album-${track.id}`}
                      type="text" 
                      value={track.album}
                      onChange={(e) => updateTrackField(track.id, "album", e.target.value)}
                      disabled={track.status === "uploading" || track.status === "success"}
                      className="bg-[#282828] text-sm text-white px-3 py-1.5 rounded outline-none focus:ring-1 focus:ring-[#1db954] disabled:opacity-50 w-full"
                    />
                  </div>
                </div>

                {/* Upload Progress Bar (when uploading) */}
                {track.status === "uploading" && (
                  <div className="w-full h-1.5 bg-[#282828] rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-[#1db954] transition-all duration-300"
                      style={{ width: `${track.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
