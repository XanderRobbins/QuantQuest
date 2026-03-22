import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Portfolio } from "@/models/Portfolio";
import { NessieAccount } from "@/models/NessieAccount";
import { createDeposit, createWithdrawal } from "@/lib/nessie";

// POST /api/nessie/transfer — move money between bank and portfolio
// direction: "deposit" = bank → portfolio, "withdraw" = portfolio → bank
export async function POST(req: NextRequest) {
  const { userId, accountId, amount, direction } = await req.json();

  if (!userId || !accountId || !amount || !direction) {
    return NextResponse.json(
      { error: "userId, accountId, amount, and direction required" },
      { status: 400 }
    );
  }

  if (direction !== "deposit" && direction !== "withdraw") {
    return NextResponse.json(
      { error: "direction must be 'deposit' or 'withdraw'" },
      { status: 400 }
    );
  }

  if (amount <= 0) {
    return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
  }

  if (!process.env.NESSIE_API_KEY) {
    return NextResponse.json({ error: "NESSIE_API_KEY not configured" }, { status: 503 });
  }

  await connectDB();

  // Load portfolio and Nessie account
  const [portfolio, nessieAccount] = await Promise.all([
    Portfolio.findOne({ userId }),
    NessieAccount.findOne({ userId }),
  ]);

  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }
  if (!nessieAccount) {
    return NextResponse.json({ error: "Bank account not found" }, { status: 404 });
  }

  const cashHolding = portfolio.holdings.find(
    (h: { id: string }) => h.id === "cash"
  );

  if (direction === "deposit") {
    // Bank → Portfolio: withdraw from Nessie, add to portfolio cash
    if (amount > nessieAccount.balance) {
      return NextResponse.json(
        { error: `Insufficient bank balance. Available: $${nessieAccount.balance.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Record withdrawal on Nessie API (fire-and-forget, non-blocking)
    createWithdrawal(accountId, amount, "Transfer to QuantQuest Portfolio").catch(() => {});

    // Update our tracked bank balance
    nessieAccount.balance = Math.round((nessieAccount.balance - amount) * 100) / 100;

    // Add to portfolio cash
    if (cashHolding) {
      cashHolding.amount = Math.round((cashHolding.amount + amount) * 100) / 100;
    } else {
      portfolio.holdings.push({ id: "cash", type: "safety", amount });
    }
    portfolio.totalDeposited = Math.round(((portfolio.totalDeposited ?? 0) + amount) * 100) / 100;
  } else {
    // Portfolio → Bank: remove from portfolio cash, deposit to Nessie
    const portfolioCash = cashHolding?.amount ?? 0;
    if (amount > portfolioCash) {
      return NextResponse.json(
        { error: `Insufficient portfolio cash. Available: $${portfolioCash.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Record deposit on Nessie API (fire-and-forget, non-blocking)
    createDeposit(accountId, amount, "Withdrawal from QuantQuest Portfolio").catch(() => {});

    // Update our tracked bank balance
    nessieAccount.balance = Math.round((nessieAccount.balance + amount) * 100) / 100;

    // Remove from portfolio cash
    cashHolding.amount = Math.round((cashHolding.amount - amount) * 100) / 100;
    portfolio.totalDeposited = Math.round((Math.max(0, (portfolio.totalDeposited ?? 0) - amount)) * 100) / 100;
  }

  // Persist both
  portfolio.markModified("holdings");
  portfolio.markModified("totalDeposited");
  await Promise.all([portfolio.save(), nessieAccount.save()]);

  return NextResponse.json({
    portfolio: {
      userId: portfolio.userId,
      username: portfolio.username,
      holdings: portfolio.holdings,
      history: portfolio.history,
      totalDeposited: portfolio.totalDeposited ?? 0,
      baselineDeposited: portfolio.baselineDeposited ?? 0,
      dailyBaseline: portfolio.dailyBaseline ?? null,
    },
    bankBalance: nessieAccount.balance,
  });
}
