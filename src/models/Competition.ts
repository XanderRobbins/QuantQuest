import mongoose, { Schema, type Document } from "mongoose";

export interface ICompHolding {
  assetId: string;
  assetType: "sector" | "strategy" | "safety";
  amount: number;
}

export interface IValueSnapshot {
  day: number;
  value: number;
}

export interface ICompetitionParticipant {
  userId: string;
  username: string;
  joinedAt: Date;
  cash: number;
  holdings: ICompHolding[];
  valueHistory: IValueSnapshot[];
}

export interface ICompetition extends Document {
  type: "historical" | "live";
  scenario: string | null;
  name: string;
  description: string;
  timeframe: "1w" | "1m" | "3m" | "2y";
  startingCash: number;
  currentDay: number;
  currentInterval: number;
  totalDays: number;
  startedAt: Date | null;
  createdBy: string | null;
  isGlobal: boolean;
  inviteCode: string | null;
  status: "waiting" | "active" | "completed";
  participants: ICompetitionParticipant[];
  createdAt: Date;
  updatedAt: Date;
}

const CompHoldingSchema = new Schema<ICompHolding>(
  {
    assetId: { type: String, required: true },
    assetType: { type: String, enum: ["sector", "strategy", "safety"], required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const ValueSnapshotSchema = new Schema<IValueSnapshot>(
  {
    day: { type: Number, required: true },
    value: { type: Number, required: true },
  },
  { _id: false }
);

const ParticipantSchema = new Schema<ICompetitionParticipant>(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    cash: { type: Number, default: 10000 },
    holdings: [CompHoldingSchema],
    valueHistory: [ValueSnapshotSchema],
  },
  { _id: false }
);

const CompetitionSchema = new Schema<ICompetition>(
  {
    type: { type: String, enum: ["historical", "live"], required: true },
    scenario: { type: String, default: null },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    timeframe: { type: String, enum: ["1w", "1m", "3m", "2y"], required: true },
    startingCash: { type: Number, default: 10000 },
    currentDay: { type: Number, default: 0 },
    currentInterval: { type: Number, default: 0 },
    totalDays: { type: Number, required: true },
    startedAt: { type: Date, default: null },
    createdBy: { type: String, default: null },
    isGlobal: { type: Boolean, default: false },
    inviteCode: { type: String, default: null },
    status: { type: String, enum: ["waiting", "active", "completed"], default: "waiting" },
    participants: [ParticipantSchema],
  },
  { timestamps: true }
);

CompetitionSchema.index({ inviteCode: 1 }, { sparse: true });
CompetitionSchema.index({ "participants.userId": 1 });
CompetitionSchema.index({ status: 1 });

// Drop the old model cache so schema changes take effect in dev
delete mongoose.models.Competition;

export const Competition = mongoose.model<ICompetition>("Competition", CompetitionSchema);
