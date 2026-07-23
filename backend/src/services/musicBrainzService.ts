import axios from "axios";

const musicBrainz = axios.create({
  baseURL: "https://musicbrainz.org/ws/2",
  headers: {
    "User-Agent": "TuneBox/1.0.0 ( tunebox-dev@example.com )",
    Accept: "application/json",
  },
});

export async function getFeaturedPlaylists() {
  const response = await musicBrainz.get("/release", {
    params: {
      query: "date:2026 AND status:official",
      fmt: "json",
    },
  });
  
  const releases = response.data.releases || [];
  
  return releases.slice(0, 12).map((release: any) => ({
    id: release.id,
    name: release.title,
    description: "Featured release from MusicBrainz",
    images: [{ url: `https://coverartarchive.org/release/${release.id}/front` }],
    owner: { display_name: release["artist-credit"]?.[0]?.name || "MusicBrainz" },
    tracks: { total: release["track-count"] || 10 },
    public: true,
  }));
}

export async function getNewReleases() {
  const response = await musicBrainz.get("/release", {
    params: {
      query: "date:2026 AND status:official",
      fmt: "json",
    },
  });
  
  const releases = response.data.releases || [];
  
  return releases.slice(0, 10).map((release: any) => ({
    id: release.id,
    name: release.title,
    artists: [{ name: release["artist-credit"]?.[0]?.name || "Unknown Artist" }],
    images: [{ url: `https://coverartarchive.org/release/${release.id}/front` }],
    release_date: release.date,
    album_type: release["release-group"]?.["primary-type"] || "album",
    total_tracks: release["track-count"] || 10,
  }));
}

export async function getCategories() {
  const genres = [
    { id: "pop", name: "Pop", color: "linear-gradient(135deg, #FF6B6B, #FF8E53)" },
    { id: "rock", name: "Rock", color: "linear-gradient(135deg, #4facfe, #00f2fe)" },
    { id: "hip-hop", name: "Hip-Hop", color: "linear-gradient(135deg, #43e97b, #38f9d7)" },
    { id: "electronic", name: "Electronic", color: "linear-gradient(135deg, #fa709a, #fee140)" },
    { id: "jazz", name: "Jazz", color: "linear-gradient(135deg, #667eea, #764ba2)" },
    { id: "classical", name: "Classical", color: "linear-gradient(135deg, #89f7fe, #66a6ff)" },
    { id: "rnb", name: "R&B", color: "linear-gradient(135deg, #f83600, #f9d423)" },
    { id: "indie", name: "Indie", color: "linear-gradient(135deg, #96fbc4, #f9f586)" },
  ];

  return genres.map(g => ({
    id: g.id,
    name: g.name,
    icons: [{ url: `https://placehold.co/300x300/222/FFF?text=${encodeURIComponent(g.name)}` }],
  }));
}

export async function getPlaylist(mbid: string) {
  const response = await musicBrainz.get(`/release/${mbid}`, {
    params: {
      inc: "recordings+artist-credits",
      fmt: "json",
    },
  });

  const release = response.data;
  const media = release.media?.[0] || {};
  const tracks = media.tracks || [];

  return {
    id: release.id,
    name: release.title,
    description: `MusicBrainz Release: ${release.title}`,
    images: [{ url: `https://coverartarchive.org/release/${release.id}/front` }],
    owner: { display_name: release["artist-credit"]?.[0]?.name || "MusicBrainz" },
    public: true,
    tracks: {
      total: tracks.length,
      items: tracks.map((t: any) => {
        const recording = t.recording;
        return {
          added_at: release.date,
          track: {
            id: recording.id,
            name: recording.title,
            artists: [{ name: recording["artist-credit"]?.[0]?.name || "Unknown" }],
            album: {
              id: release.id,
              name: release.title,
              images: [{ url: `https://coverartarchive.org/release/${release.id}/front` }],
            },
            duration_ms: recording.length || 180000,
            track_number: t.position || 1,
            preview_url: null,
          }
        };
      })
    }
  };
}
