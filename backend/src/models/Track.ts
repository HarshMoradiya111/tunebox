import mongoose, { Document, Schema } from "mongoose";

export interface ITrack extends Document {
  spotifyId: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number; // in milliseconds
  trackNumber: number;
  previewUrl?: string;
}

const trackSchema = new Schema<ITrack>(
  {
    spotifyId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    album: { type: String, required: true },
    albumArt: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    trackNumber: { type: Number, default: 1 },
    previewUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ITrack>("Track", trackSchema);
