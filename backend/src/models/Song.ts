import mongoose, { Document, Schema } from "mongoose";

export type SongStatus = "pending" | "downloading" | "ready" | "failed";

export interface ISong extends Document {
  spotifyTrackId: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number; // in seconds
  filePath: string; // local path or R2 key
  streamUrl: string; // URL to stream from
  fileSize: number; // in bytes
  format: string; // mp3, m4a, etc.
  status: SongStatus;
  errorMessage?: string;
}

const songSchema = new Schema<ISong>(
  {
    spotifyTrackId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    album: { type: String, default: "" },
    albumArt: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    filePath: { type: String, default: "" },
    streamUrl: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    format: { type: String, default: "mp3" },
    status: {
      type: String,
      enum: ["pending", "downloading", "ready", "failed"],
      default: "pending",
    },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ISong>("Song", songSchema);
