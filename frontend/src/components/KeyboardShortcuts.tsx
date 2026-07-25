"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "?") {
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#282828] rounded-xl shadow-2xl w-full max-w-md border border-[#3e3e3e] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#3e3e3e]">
          <h2 className="text-xl font-bold text-white tracking-tight">Keyboard Shortcuts</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-[#b3b3b3] hover:text-white transition-colors p-1 rounded-full hover:bg-[#3e3e3e]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <ul className="flex flex-col gap-4">
            <ShortcutRow label="Play / Pause" keys={["Space"]} />
            <ShortcutRow label="Seek Forward 10s" keys={["→"]} />
            <ShortcutRow label="Seek Backward 10s" keys={["←"]} />
            <ShortcutRow label="Show Keyboard Shortcuts" keys={["?"]} />
          </ul>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ label, keys }: { label: string; keys: string[] }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-[#b3b3b3] text-sm font-medium">{label}</span>
      <div className="flex gap-2">
        {keys.map((k, i) => (
          <kbd 
            key={i} 
            className="bg-[#121212] text-white text-xs px-2.5 py-1 rounded border border-[#3e3e3e] font-mono shadow-sm flex items-center justify-center min-w-[28px]"
          >
            {k}
          </kbd>
        ))}
      </div>
    </li>
  );
}
