"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportPoller({
  playlistId,
  initialStatus,
  initialTotal,
  initialImported,
}: {
  playlistId: string;
  initialStatus: string;
  initialTotal: number;
  initialImported: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [imported, setImported] = useState(initialImported);
  const [total, setTotal] = useState(initialTotal);

  useEffect(() => {
    if (status !== "importing") return;

    const interval = setInterval(async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${baseUrl}/playlist/${playlistId}/import-status`);
        if (!res.ok) return;

        const data = await res.json();
        if (data && data.success) {
          // If status changed to completed/failed, or new tracks arrived, refresh the server component
          if (
            data.importStatus !== status ||
            data.tracksImportedSoFar > imported
          ) {
            router.refresh(); // This re-runs the page.tsx Server Component seamlessly
            
            setStatus(data.importStatus);
            setImported(data.tracksImportedSoFar);
            if (data.totalTracks) setTotal(data.totalTracks);
          }
        }
      } catch (err) {
        // Ignore fetch errors during polling
      }
    }, 4000); // Poll every 4 seconds

    return () => clearInterval(interval);
  }, [playlistId, status, imported, router]);

  if (status !== "importing") return null;

  return (
    <div className="bg-indigo-600 text-white px-6 py-4 mx-6 rounded-md flex items-center gap-3">
      <svg
        className="animate-spin h-5 w-5 text-white shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <div className="font-medium flex flex-col sm:flex-row gap-1 sm:gap-4">
        <span>This playlist is currently being imported.</span>
        <span className="text-indigo-200">
          Progress: {imported} / {total > 0 ? total : "?"} tracks
        </span>
      </div>
    </div>
  );
}
