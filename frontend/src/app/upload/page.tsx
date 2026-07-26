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
              <div 
                key={track.id} 
                className={`bg-[#181818] hover:bg-[#202020] border border-[#282828] rounded-xl p-3.5 sm:p-4 flex flex-col gap-3 transition-colors relative group ${
                  track.status === 'skipped' ? 'opacity-50' : ''
                }`}
              >
                {/* Main Card Content: Art + Inputs + Status Badge */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full">
                  {/* Cover Art */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#282828] rounded-lg shrink-0 overflow-hidden relative border border-[#333] shadow-sm flex items-center justify-center">
                    {track.albumArt ? (
                      <Image src={track.albumArt} alt="Cover" fill className="object-cover" />
                    ) : (
                      <Music className="w-6 h-6 text-[#b3b3b3]" />
                    )}
                  </div>

                  {/* Metadata Fields: Title, Artist, Album */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full min-w-0">
                    <div className="flex flex-col min-w-0">
                      <label htmlFor={`title-${track.id}`} className="text-[11px] font-semibold text-[#b3b3b3] uppercase tracking-wider mb-1">
                        Title
                      </label>
                      <input 
                        id={`title-${track.id}`}
                        type="text" 
                        value={track.title}
                        onChange={(e) => updateTrackField(track.id, "title", e.target.value)}
                        disabled={track.status === "uploading" || track.status === "success"}
                        className="bg-[#282828] focus:bg-[#333] text-sm text-white px-3 py-1.5 rounded-lg outline-none border border-transparent focus:border-[#1db954] transition-all disabled:opacity-50 w-full truncate"
                        placeholder="Song title"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <label htmlFor={`artist-${track.id}`} className="text-[11px] font-semibold text-[#b3b3b3] uppercase tracking-wider mb-1">
                        Artist
                      </label>
                      <input 
                        id={`artist-${track.id}`}
                        type="text" 
                        value={track.artist}
                        onChange={(e) => updateTrackField(track.id, "artist", e.target.value)}
                        disabled={track.status === "uploading" || track.status === "success"}
                        className="bg-[#282828] focus:bg-[#333] text-sm text-white px-3 py-1.5 rounded-lg outline-none border border-transparent focus:border-[#1db954] transition-all disabled:opacity-50 w-full truncate"
                        placeholder="Artist name"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <label htmlFor={`album-${track.id}`} className="text-[11px] font-semibold text-[#b3b3b3] uppercase tracking-wider mb-1">
                        Album
                      </label>
                      <input 
                        id={`album-${track.id}`}
                        type="text" 
                        value={track.album}
                        onChange={(e) => updateTrackField(track.id, "album", e.target.value)}
                        disabled={track.status === "uploading" || track.status === "success"}
                        className="bg-[#282828] focus:bg-[#333] text-sm text-white px-3 py-1.5 rounded-lg outline-none border border-transparent focus:border-[#1db954] transition-all disabled:opacity-50 w-full truncate"
                        placeholder="Album name"
                      />
                    </div>
                  </div>

                  {/* Status Badge & Remove Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                      track.status === "success" ? "bg-[#1db954]/20 text-[#1db954]" :
                      track.status === "error" ? "bg-red-500/20 text-red-400" :
                      track.status === "uploading" ? "bg-blue-500/20 text-blue-400 animate-pulse" :
                      track.status === "skipped" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-[#282828] text-[#b3b3b3]"
                    }`}>
                      {track.status === "uploading" ? `Uploading ${track.progress || 0}%` : track.status}
                    </span>

                    {track.status !== "uploading" && track.status !== "success" && (
                      <button 
                        onClick={() => removeTrack(track.id)}
                        aria-label={`Remove track ${track.title}`}
                        className="p-1.5 text-[#b3b3b3] hover:text-red-400 hover:bg-red-500/20 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar (Full width across card bottom when uploading) */}
                {track.status === "uploading" && (
                  <div className="w-full bg-[#282828] h-1.5 rounded-full overflow-hidden mt-1">
                    <div 
                      className="bg-[#1db954] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${track.progress || 0}%` }}
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
