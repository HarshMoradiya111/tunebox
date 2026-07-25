import mongoose, { Schema, Document } from "mongoose";

export interface IArtistMetadata extends Document {
  name: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

const ArtistMetadataSchema = new Schema<IArtistMetadata>(
  {
    name: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.ArtistMetadata || mongoose.model<IArtistMetadata>("ArtistMetadata", ArtistMetadataSchema);
