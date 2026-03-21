import mongoose, { Schema, type Document } from "mongoose";

export interface INessieAccount extends Document {
  userId: string;
  customerId: string;
  accountId: string;
  balance: number;
  createdAt: Date;
}

const NessieAccountSchema = new Schema<INessieAccount>({
  userId: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  accountId: { type: String, required: true },
  balance: { type: Number, default: 10000 },
  createdAt: { type: Date, default: Date.now },
});

export const NessieAccount =
  mongoose.models.NessieAccount ||
  mongoose.model<INessieAccount>("NessieAccount", NessieAccountSchema);
