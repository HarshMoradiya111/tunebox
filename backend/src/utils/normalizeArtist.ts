export const normalizeArtist = (artist: string | undefined | null): string => {
  if (!artist) return "Unknown Artist";
  return artist.trim();
};
