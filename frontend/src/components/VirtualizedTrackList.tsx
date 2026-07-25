"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import TrackRow from "./TrackRow";
import { TrackItem } from "@/types";

interface VirtualizedTrackListProps {
  tracks: TrackItem[];
  selectable?: boolean;
  selectedTrackIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  scrollParentRef?: React.RefObject<HTMLDivElement | null>;
}

export default function VirtualizedTrackList({
  tracks,
  selectable,
  selectedTrackIds,
  onToggleSelect,
  scrollParentRef,
}: VirtualizedTrackListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => scrollParentRef?.current || containerRef.current?.parentElement || null,
    estimateSize: () => 56, // Row height in px
    overscan: 5,
  });

  if (tracks.length <= 20) {
    return (
      <div className="flex flex-col">
        {tracks.map((track, idx) => (
          <TrackRow
            key={track.id}
            track={track}
            index={idx}
            allTracks={tracks}
            selectable={selectable}
            isSelected={selectedTrackIds?.has(track.id)}
            onToggleSelect={() => onToggleSelect?.(track.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const track = tracks[virtualRow.index];
          return (
            <div
              key={track.id || virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <TrackRow
                track={track}
                index={virtualRow.index}
                allTracks={tracks}
                selectable={selectable}
                isSelected={selectedTrackIds?.has(track.id)}
                onToggleSelect={() => onToggleSelect?.(track.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
