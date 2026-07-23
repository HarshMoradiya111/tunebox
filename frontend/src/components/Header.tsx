"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, User } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isSearchPage = pathname === "/search";

  return (
    <header className="h-16 px-6 bg-[#121212]/90 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between gap-4">
      {/* Navigation Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors"
          title="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => router.forward()}
          className="w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors"
          title="Go forward"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Conditional Search Bar */}
      {isSearchPage && (
        <div className="flex-1 max-w-md relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#b3b3b3]" />
          <input
            type="text"
            placeholder="What do you want to play?"
            className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-white text-sm rounded-full pl-10 pr-4 py-2.5 outline-none border border-transparent focus:border-white/30 transition-all placeholder:text-[#727272]"
          />
        </div>
      )}

      {/* User Profile Pill */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 bg-black/70 hover:bg-[#282828] text-white rounded-full p-1 pr-3 transition-colors text-sm font-medium">
          <div className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center text-white">
            <User className="w-4 h-4" />
          </div>
          <span>Harsh</span>
        </button>
      </div>
    </header>
  );
}
