import mongoose, { Schema, type Document } from "mongoose";

export interface IGameProfile extends Document {
  userId: string;
  xp: number;
  achievements: string[];
  totalTrades: number;
  largestTrade: number;
  hasAnalyzed: boolean;
  hasSold: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GameProfileSchema = new Schema<IGameProfile>(
  {
    userId: { type: String, required: true, unique: true },
    xp: { type: Number, default: 0 },
    achievements: { type: [String], default: [] },
    totalTrades: { type: Number, default: 0 },
    largestTrade: { type: Number, default: 0 },
    hasAnalyzed: { type: Boolean, default: false },
    hasSold: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const GameProfile =
  mongoose.models.GameProfile ||
  mongoose.model<IGameProfile>("GameProfile", GameProfileSchema);
