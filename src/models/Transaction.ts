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
  signature: { type: String, default: "pending" },
  explorerUrl: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
});

// Delete cached model to ensure schema updates take effect
delete mongoose.models.Transaction;

export const Transaction = mongoose.model<ITransaction>("Transaction", TransactionSchema);
