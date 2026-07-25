"use client";

import Image from "next/image";
import { X, GripVertical } from "lucide-react";
import { usePlayer } from "@/store/playerStore";
import { useState } from "react";

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QueuePanel({ isOpen, onClose }: QueuePanelProps) {
  const { currentTrack, queue, queueIndex, removeFromQueue, reorderQueue, playTrack } = usePlayer();
  
  // HTML5 Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const upcomingQueue = queue.slice(queueIndex + 1);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // For visual feedback
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedIndex(null);
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = "1";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    
    // The indices passed are relative to upcomingQueue, so we need to map them back to the full queue
    const actualDraggedIndex = queueIndex + 1 + draggedIndex;
    const actualTargetIndex = queueIndex + 1 + targetIndex;
    
    reorderQueue(actualDraggedIndex, actualTargetIndex);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-[#121212] border-l border-[#282828] z-40 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 pb-24 pt-16">
      <div className="flex items-center justify-between p-4 border-b border-[#282828]">
        <h2 className="text-white font-bold">Queue</h2>
        <button onClick={onClose} className="text-[#b3b3b3] hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Now Playing */}
        <div className="mb-6">
          <h3 className="text-[#b3b3b3] text-sm font-bold mb-3">Now Playing</h3>
          {currentTrack ? (
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded overflow-hidden shrink-0">
                <Image src={currentTrack.albumArt || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop"} alt={currentTrack.title} fill sizes="48px" className="object-cover" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[#1db954] font-medium truncate">{currentTrack.title}</span>
                <span className="text-[#b3b3b3] text-xs truncate">{currentTrack.artist}</span>
              </div>
            </div>
          ) : (
            <div className="text-[#b3b3b3] text-sm">Nothing is playing</div>
          )}
        </div>

        {/* Up Next */}
        <div>
          <h3 className="text-[#b3b3b3] text-sm font-bold mb-3">Next In Queue</h3>
          {upcomingQueue.length > 0 ? (
            <div className="space-y-2">
              {upcomingQueue.map((track, i) => (
                <div 
                  key={`${track.id}-${i}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, i)}
                  className="group flex items-center gap-3 p-2 hover:bg-[#ffffff10] rounded-md transition-colors cursor-move"
                >
                  <GripVertical className="w-4 h-4 text-[#b3b3b3] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0" />
                  <div 
                    className="relative w-10 h-10 rounded overflow-hidden shrink-0 cursor-pointer"
                    onDoubleClick={() => playTrack(track)}
                  >
                    <Image src={track.albumArt || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop"} alt={track.title} fill sizes="40px" className="object-cover" />
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-white text-sm font-medium truncate">{track.title}</span>
                    <span className="text-[#b3b3b3] text-xs truncate">{track.artist}</span>
                  </div>
                  <button 
                    onClick={() => removeFromQueue(queueIndex + 1 + i)}
                    className="text-[#b3b3b3] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[#b3b3b3] text-sm">No upcoming tracks</div>
          )}
        </div>
      </div>
    </div>
  );
}
