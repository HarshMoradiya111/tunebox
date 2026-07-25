import type { Metadata, Viewport } from "next";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import PlayerBar from "@/components/PlayerBar";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import { PlayerProvider } from "@/store/playerStore";
import { UploadProvider } from "@/store/uploadStore";
import "./globals.css";

export const metadata: Metadata = {
  title: "TuneBox — Web Player: Music for everyone",
  description: "Personal Spotify Clone built with Next.js, Express, and MongoDB",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-black text-white antialiased">
      <body className="h-full flex flex-col overflow-hidden">
        <PlayerProvider>
          <UploadProvider>
            {/* App Content Area (Sidebar + Main View) */}
            <div className="flex-1 flex overflow-hidden p-0 md:p-2 gap-0 md:gap-2">
              <Sidebar />

              <main className="flex-1 bg-[#121212] rounded-none md:rounded-lg overflow-y-auto flex flex-col relative">
                <Header />
                <div className="flex-1 p-4 md:p-6 pb-36 md:pb-12">{children}</div>
              </main>
            </div>

            {/* Fixed Player Bar at Bottom */}
            <PlayerBar />

            {/* Keyboard Shortcuts Modal Overlay */}
            <KeyboardShortcuts />
          </UploadProvider>
        </PlayerProvider>
      </body>
    </html>
  );
}
