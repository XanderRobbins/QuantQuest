import { NextRequest, NextResponse } from "next/server";
import { createCustomer, createAccount, getAccount } from "@/lib/nessie";

// In-memory fallback when MongoDB is not configured
const memStore: Record<string, { customerId: string; accountId: string; balance: number }> = {};

// GET /api/nessie/account?userId=xxx — get or create Nessie account
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Check if Nessie is configured
  if (!process.env.NESSIE_API_KEY) {
    return NextResponse.json({ error: "NESSIE_API_KEY not configured" }, { status: 503 });
  }

  // Try to load existing record
  let record: { customerId: string; accountId: string; balance: number } | null = null;

  try {
    const { connectDB } = await import("@/lib/mongodb");
    const { NessieAccount } = await import("@/models/NessieAccount");
    await connectDB();
    record = await NessieAccount.findOne({ userId }).lean() as typeof record;
  } catch {
    record = memStore[userId] ?? null;
  }

  if (record) {
    // Use our tracked balance (Nessie sandbox doesn't auto-update on withdrawals/deposits)
    return NextResponse.json(record);
  }

  return NextResponse.json({ error: "Account not found" }, { status: 404 });
}

// POST /api/nessie/account — create customer + account for a new user
export async function POST(req: NextRequest) {
  const { userId, username } = await req.json();
  if (!userId || !username) {
    return NextResponse.json({ error: "userId and username required" }, { status: 400 });
  }

  if (!process.env.NESSIE_API_KEY) {
    return NextResponse.json({ error: "NESSIE_API_KEY not configured" }, { status: 503 });
  }

  // Check if already exists
  let existing: { customerId: string; accountId: string; balance: number } | null = null;
  try {
    const { connectDB } = await import("@/lib/mongodb");
    const { NessieAccount } = await import("@/models/NessieAccount");
    await connectDB();
    existing = await NessieAccount.findOne({ userId }).lean() as typeof existing;
  } catch {
    existing = memStore[userId] ?? null;
  }

  if (existing) return NextResponse.json(existing);

  try {
    const customer = await createCustomer(username);
    const account = await createAccount(customer._id, 10000);

    const record = {
      userId,
      customerId: customer._id,
      accountId: account._id,
      balance: account.balance,
    };

    // Persist
    try {
      const { connectDB } = await import("@/lib/mongodb");
      const { NessieAccount } = await import("@/models/NessieAccount");
      await connectDB();
      await NessieAccount.create(record);
    } catch {
      memStore[userId] = record;
    }

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Nessie account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
