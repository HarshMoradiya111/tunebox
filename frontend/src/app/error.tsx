"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-center p-6 bg-[#181818] rounded-xl border border-[#282828]">
      <div className="w-16 h-16 rounded-full bg-[#ff4d4d15] flex items-center justify-center text-[#ff4d4d]">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-white">Something went wrong!</h2>
      <p className="text-sm text-[#b3b3b3] max-w-md">
        Unable to load requested media. Please check your backend connection or try refreshing the page.
      </p>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-semibold transition-all mt-2 cursor-pointer"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    </div>
  );
}
