import mongoose, { Document, Schema } from "mongoose";

export interface IPlayHistory extends Document {
  songId: mongoose.Types.ObjectId;
  playedAt: Date;
}

const playHistorySchema = new Schema<IPlayHistory>({
  songId: { type: Schema.Types.ObjectId, ref: "Song", required: true, index: true },
  playedAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.model<IPlayHistory>("PlayHistory", playHistorySchema);
