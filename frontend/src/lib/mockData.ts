export interface MockTrack {
  id: string;
  spotifyId: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number; // seconds
  dateAdded: string;
}

export interface MockMediaItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  type: "playlist" | "album" | "artist";
  gradient?: string;
}

export interface MockGenre {
  id: string;
  name: string;
  color: string;
  image: string;
}

export const MOCK_RECENT_GRID: MockMediaItem[] = [
  {
    id: "liked-songs",
    title: "Liked Songs",
    subtitle: "320 songs",
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop",
    type: "playlist",
  },
  {
    id: "today-top-hits",
    title: "Today's Top Hits",
    subtitle: "Sabrina Carpenter, Billie Eilish and more",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    type: "playlist",
  },
  {
    id: "chill-vibes",
    title: "Chill Lofi Study Beats",
    subtitle: "Beats to relax/study to",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
    type: "playlist",
  },
  {
    id: "deep-focus",
    title: "Deep Focus",
    subtitle: "Keep your focus with ambient music",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
    type: "playlist",
  },
  {
    id: "synthwave-drive",
    title: "Synthwave Retro Drive",
    subtitle: "Neon nights & analog synth waves",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
    type: "playlist",
  },
  {
    id: "rock-classics",
    title: "Rock Classics",
    subtitle: "Rock legends & epic anthems",
    image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&h=300&fit=crop",
    type: "playlist",
  },
];

export const MOCK_FEATURED_PLAYLISTS: MockMediaItem[] = [
  {
    id: "p1",
    title: "Discover Weekly",
    subtitle: "Your weekly mixtape of fresh music tailored for you.",
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop",
    type: "playlist",
  },
  {
    id: "p2",
    title: "Hot Hits India",
    subtitle: "The hottest tracks right now in India.",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    type: "playlist",
  },
  {
    id: "p3",
    title: "Coding Mode",
    subtitle: "Flow state instrumental electronic & ambient synth.",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
    type: "playlist",
  },
  {
    id: "p4",
    title: "Peaceful Piano",
    subtitle: "Relax and focus with beautiful piano pieces.",
    image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=300&h=300&fit=crop",
    type: "playlist",
  },
  {
    id: "p5",
    title: "All Out 2010s",
    subtitle: "The biggest songs of the 2010s decade.",
    image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&h=300&fit=crop",
    type: "playlist",
  },
];

export const MOCK_NEW_RELEASES: MockMediaItem[] = [
  {
    id: "a1",
    title: "HIT ME HARD AND SOFT",
    subtitle: "Billie Eilish • Album",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
    type: "album",
  },
  {
    id: "a2",
    title: "Short n' Sweet",
    subtitle: "Sabrina Carpenter • Album",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    type: "album",
  },
  {
    id: "a3",
    title: "Chromakopia",
    subtitle: "Tyler, The Creator • Album",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
    type: "album",
  },
  {
    id: "a4",
    title: "GNX",
    subtitle: "Kendrick Lamar • Album",
    image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&h=300&fit=crop",
    type: "album",
  },
];

export const MOCK_TRACKS: MockTrack[] = [
  {
    id: "t1",
    spotifyId: "3n3Ppam7vgaVa1iaRUc9Lp",
    title: "Espresso",
    artist: "Sabrina Carpenter",
    album: "Short n' Sweet",
    albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    duration: 175,
    dateAdded: "2 days ago",
  },
  {
    id: "t2",
    spotifyId: "62aP9fBQKYwxiSpXGzPh2D",
    title: "BIRDS OF A FEATHER",
    artist: "Billie Eilish",
    album: "HIT ME HARD AND SOFT",
    albumArt: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
    duration: 198,
    dateAdded: "3 days ago",
  },
  {
    id: "t3",
    spotifyId: "0VjIjW4GlUZAMYd2vXMi3b",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    albumArt: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
    duration: 200,
    dateAdded: "1 week ago",
  },
  {
    id: "t4",
    spotifyId: "7qiZ2292HYiIsDph2cZaiE",
    title: "Shape of You",
    artist: "Ed Sheeran",
    album: "÷ (Divide)",
    albumArt: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&h=300&fit=crop",
    duration: 233,
    dateAdded: "2 weeks ago",
  },
  {
    id: "t5",
    spotifyId: "2XU0WhGl92qVy2wO7chG9N",
    title: "Starboy",
    artist: "The Weeknd, Daft Punk",
    album: "Starboy",
    albumArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
    duration: 230,
    dateAdded: "1 month ago",
  },
  {
    id: "t6",
    spotifyId: "1BxfEFI2v94iB3D500hx2E",
    title: "As It Was",
    artist: "Harry Styles",
    album: "Harry's House",
    albumArt: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop",
    duration: 167,
    dateAdded: "1 month ago",
  },
];

export const MOCK_GENRES: MockGenre[] = [
  {
    id: "pop",
    name: "Pop",
    color: "from-pink-500 to-rose-600",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
  },
  {
    id: "hip-hop",
    name: "Hip-Hop",
    color: "from-amber-500 to-orange-600",
    image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&h=300&fit=crop",
  },
  {
    id: "rock",
    name: "Rock",
    color: "from-red-600 to-rose-800",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
  },
  {
    id: "dance",
    name: "Dance / Electronic",
    color: "from-teal-500 to-emerald-700",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
  },
  {
    id: "indie",
    name: "Indie",
    color: "from-purple-600 to-indigo-800",
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop",
  },
  {
    id: "chill",
    name: "Chill & Study",
    color: "from-blue-500 to-cyan-600",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
  },
  {
    id: "bollywood",
    name: "Bollywood",
    color: "from-yellow-500 to-amber-600",
    image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=300&h=300&fit=crop",
  },
  {
    id: "classical",
    name: "Classical",
    color: "from-emerald-600 to-green-800",
    image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=300&h=300&fit=crop",
  },
];
