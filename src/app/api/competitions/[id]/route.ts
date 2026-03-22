import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Competition, type ICompetition } from "@/models/Competition";
import { getDayMultiplier, type Timeframe } from "@/data/scenarios";

// ─── Simulation engine ──────────────────────────────────────────────────────

/** Each simulation "day" is split into 26 intervals of 15 minutes (6.5 trading hours) */
const INTERVALS_PER_DAY = 26;
const MS_PER_INTERVAL = 15 * 60 * 1000; // 15 minutes

function advanceSimulation(competition: ICompetition) {
  if (!competition.startedAt || competition.status === "completed") return;

  const elapsed = Date.now() - new Date(competition.startedAt).getTime();
  const totalIntervalsElapsed = Math.floor(elapsed / MS_PER_INTERVAL);

  // Where we are now
  const targetDay = Math.floor(totalIntervalsElapsed / INTERVALS_PER_DAY);
  const targetInterval = totalIntervalsElapsed % INTERVALS_PER_DAY;

  // Where we were
  const currentTotal = competition.currentDay * INTERVALS_PER_DAY + (competition.currentInterval ?? 0);
  const targetTotal = Math.min(
    targetDay * INTERVALS_PER_DAY + targetInterval,
    competition.totalDays * INTERVALS_PER_DAY
  );

  // Nothing new to simulate
  if (targetTotal <= currentTotal) return;

  const scenarioId = competition.scenario;
  const timeframe = competition.timeframe as Timeframe;

  // Apply returns for each interval we've missed
  let simDay = competition.currentDay;
  let simInterval = competition.currentInterval ?? 0;

  for (let i = currentTotal; i < targetTotal; i++) {
    simInterval++;
    if (simInterval >= INTERVALS_PER_DAY) {
      simInterval = 0;
      simDay++;
    }

    // Cap at totalDays
    if (simDay >= competition.totalDays) {
      simDay = competition.totalDays;
      break;
    }

    // The "day" whose returns we're applying (1-indexed for getDayMultiplier)
    const applyDay = simDay + 1;

    for (const participant of competition.participants) {
      if (scenarioId) {
        for (const holding of participant.holdings) {
          const dayMult = getDayMultiplier(
            scenarioId,
            timeframe,
            holding.assetId,
            Math.min(applyDay, competition.totalDays),
            competition.totalDays
          );
          // Apply 1/26th of the day's return per interval
          const intervalMult = 1 + (dayMult - 1) / INTERVALS_PER_DAY;
          holding.amount = Math.round(holding.amount * intervalMult * 100) / 100;
        }
      }
    }

    // Snapshot value every interval (fractional day for intraday chart resolution)
    const fractionalDay = Math.round((simDay + simInterval / INTERVALS_PER_DAY) * 100) / 100;
    for (const participant of competition.participants) {
      const totalValue =
        Math.round(
          (participant.cash +
            participant.holdings.reduce((s, h) => s + h.amount, 0)) *
            100
        ) / 100;
      participant.valueHistory.push({ day: fractionalDay, value: totalValue });
    }
  }

  competition.currentDay = simDay;
  competition.currentInterval = simInterval;

  if (competition.currentDay >= competition.totalDays) {
    competition.status = "completed";
    // Final snapshot if not already added
    for (const participant of competition.participants) {
      const lastSnap = participant.valueHistory[participant.valueHistory.length - 1];
      if (!lastSnap || lastSnap.day !== competition.totalDays) {
        const totalValue =
          Math.round(
            (participant.cash +
              participant.holdings.reduce((s, h) => s + h.amount, 0)) *
              100
          ) / 100;
        participant.valueHistory.push({ day: competition.totalDays, value: totalValue });
      }
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildLeaderboard(competition: ICompetition) {
  return [...competition.participants]
    .map((p) => {
      const totalValue =
        Math.round(
          (p.cash + p.holdings.reduce((s, h) => s + h.amount, 0)) * 100
        ) / 100;
      const returnPct =
        Math.round(
          ((totalValue - competition.startingCash) / competition.startingCash) *
            10000
        ) / 100;
      return {
        userId: p.userId,
        username: p.username,
        totalValue,
        returnPct,
        rank: 0,
      };
    })
    .sort((a, b) => b.totalValue - a.totalValue)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

// ─── GET /api/competitions/[id] ──────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const competition = await Competition.findById(id);
  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  // Advance simulation to current day
  const prevDay = competition.currentDay;
  advanceSimulation(competition);

  if (competition.currentDay !== prevDay) {
    competition.markModified("participants");
    await competition.save();
  }

  const leaderboard = buildLeaderboard(competition);

  return NextResponse.json({
    ...competition.toObject(),
    leaderboard,
  });
}

// ─── POST /api/competitions/[id] — trade within a competition ────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { action, userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  await connectDB();

  const competition = await Competition.findById(id);
  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  // Advance simulation first
  advanceSimulation(competition);

  // ─── Leave (handle before participant check) ──────────────────────────
  if (action === "leave") {
    competition.participants = competition.participants.filter(
      (p: { userId: string }) => p.userId !== userId
    );
    competition.markModified("participants");
    await competition.save();
    return NextResponse.json({ success: true });
  }

  if (competition.status === "completed") {
    const leaderboard = buildLeaderboard(competition);
    competition.markModified("participants");
    await competition.save();
    return NextResponse.json({ error: "Competition has ended", leaderboard }, { status: 400 });
  }

  const participant = competition.participants.find(
    (p: { userId: string }) => p.userId === userId
  );
  if (!participant) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  if (action === "buy") {
    // ─── Buy ────────────────────────────────────────────────────────────
    const { assetId, assetType, amount } = body;

    if (!assetId || !assetType || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "assetId, assetType, and positive amount required" },
        { status: 400 }
      );
    }

    if (participant.cash < amount) {
      return NextResponse.json({ error: "Insufficient cash" }, { status: 400 });
    }

    participant.cash = Math.round((participant.cash - amount) * 100) / 100;

    const existing = participant.holdings.find(
      (h: { assetId: string }) => h.assetId === assetId
    );
    if (existing) {
      existing.amount = Math.round((existing.amount + amount) * 100) / 100;
    } else {
      participant.holdings.push({ assetId, assetType, amount });
    }
  } else if (action === "sell") {
    // ─── Sell ───────────────────────────────────────────────────────────
    const { assetId, amount } = body;

    if (!assetId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "assetId and positive amount required" },
        { status: 400 }
      );
    }

    const holding = participant.holdings.find(
      (h: { assetId: string }) => h.assetId === assetId
    );
    if (!holding || holding.amount < amount) {
      return NextResponse.json(
        { error: `Insufficient holdings (have ${holding?.amount ?? 0})` },
        { status: 400 }
      );
    }

    holding.amount = Math.round((holding.amount - amount) * 100) / 100;
    participant.cash = Math.round((participant.cash + amount) * 100) / 100;

    // Remove empty holdings
    participant.holdings = participant.holdings.filter(
      (h: { amount: number }) => h.amount > 0.01
    );
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  competition.markModified("participants");
  await competition.save();

  const leaderboard = buildLeaderboard(competition);

  // Return the participant's updated portfolio + leaderboard
  const totalValue =
    Math.round(
      (participant.cash + participant.holdings.reduce((s, h) => s + h.amount, 0)) * 100
    ) / 100;

  return NextResponse.json({
    cash: participant.cash,
    holdings: participant.holdings,
    totalValue,
    leaderboard,
  });
}
