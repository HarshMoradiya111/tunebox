import mongoose, { Document, Schema } from "mongoose";

export interface ITrack extends Document {
  spotifyId?: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number; // in milliseconds
  trackNumber: number;
  previewUrl?: string;
  streamUrl?: string;
  audioFileURL?: string;
  source?: string;
  uploadedAt?: Date;
}

const trackSchema = new Schema<ITrack>(
  {
    spotifyId: { type: String, unique: true, index: true, sparse: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    album: { type: String, required: true },
    albumArt: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    trackNumber: { type: Number, default: 1 },
    previewUrl: { type: String },
    streamUrl: { type: String, default: "" },
    audioFileURL: { type: String },
    source: { type: String, default: "search" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<ITrack>("Track", trackSchema);
