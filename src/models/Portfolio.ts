import mongoose, { Schema, type Document } from "mongoose";

export interface IHolding {
  id: string;
  type: "sector" | "strategy" | "safety";
  amount: number;
}

export interface IHistoryEntry {
  date: string;
  value: number;
}

export interface IPortfolio extends Document {
  userId: string;
  username: string;
  holdings: IHolding[];
  history: IHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const HoldingSchema = new Schema<IHolding>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["sector", "strategy", "safety"], required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const HistoryEntrySchema = new Schema<IHistoryEntry>(
  {
    date: { type: String, required: true },
    value: { type: Number, required: true },
  },
  { _id: false }
);

const PortfolioSchema = new Schema<IPortfolio>(
  {
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    holdings: [HoldingSchema],
    history: [HistoryEntrySchema],
  },
  { timestamps: true }
);

export const Portfolio =
  mongoose.models.Portfolio ||
  mongoose.model<IPortfolio>("Portfolio", PortfolioSchema);
