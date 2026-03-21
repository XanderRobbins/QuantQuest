import mongoose, { Schema, type Document } from "mongoose";

export interface ITransaction extends Document {
  userId: string;
  investment: string;
  type: string;
  amount: number;
  signature: string;
  explorerUrl: string;
  timestamp: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  userId: { type: String, required: true, index: true },
  investment: { type: String, required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  signature: { type: String, required: true },
  explorerUrl: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
