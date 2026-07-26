"use client";

import { useState } from "react";
import { X, Copy, Check, Share2 } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareUrl: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  title,
  shareUrl,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Listen to "${title}" on TuneBox: ${shareUrl}`)}`, "_blank");
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out "${title}" on TuneBox!`)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#181818] border border-[#282828] rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#b3b3b3] hover:text-white p-1 rounded-full hover:bg-[#282828] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#1db954]/20 flex items-center justify-center text-[#1db954]">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Share</h3>
            <p className="text-xs text-[#b3b3b3] truncate max-w-[260px]">{title}</p>
          </div>
        </div>

        {/* Copy Link Bar */}
        <div className="flex items-center gap-2 bg-[#282828] p-2 rounded-xl border border-[#333] mb-6">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="bg-transparent text-xs text-white outline-none flex-1 px-2 truncate"
          />
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              copied
                ? "bg-[#1db954] text-black"
                : "bg-white text-black hover:scale-105"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy Link
              </>
            )}
          </button>
        </div>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
          >
            WhatsApp
          </button>
          <button
            onClick={shareTwitter}
            className="flex items-center justify-center gap-2 bg-[#1DA1F2]/20 text-[#1DA1F2] hover:bg-[#1DA1F2]/30 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
          >
            X (Twitter)
          </button>
        </div>
      </div>
    </div>
  );
}
