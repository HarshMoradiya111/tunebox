import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import PlayerBar from "@/components/PlayerBar";
import { PlayerProvider } from "@/store/playerStore";
import "./globals.css";

export const metadata: Metadata = {
  title: "TuneBox — Web Player: Music for everyone",
  description: "Personal Spotify Clone built with Next.js, Express, and MongoDB",
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
          {/* App Content Area (Sidebar + Main View) */}
          <div className="flex-1 flex overflow-hidden p-2 gap-2">
            <Sidebar />

            <main className="flex-1 bg-[#121212] rounded-lg overflow-y-auto flex flex-col relative">
              <Header />
              <div className="flex-1 p-6 pb-12">{children}</div>
            </main>
          </div>

          {/* Fixed Player Bar at Bottom */}
          <PlayerBar />
        </PlayerProvider>
      </body>
    </html>
  );
}
