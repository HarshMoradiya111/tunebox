import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPlaylist extends Document {
  spotifyId: string;
  name: string;
  description: string;
  coverImage: string;
  owner: string;
  tracks: Types.ObjectId[];
  totalTracks: number;
  isPublic: boolean;
}

const playlistSchema = new Schema<IPlaylist>(
  {
    spotifyId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    owner: { type: String, default: "" },
    tracks: [{ type: Schema.Types.ObjectId, ref: "Track" }],
    totalTracks: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPlaylist>("Playlist", playlistSchema);
