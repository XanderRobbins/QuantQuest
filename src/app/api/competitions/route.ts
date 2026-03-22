import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Competition } from "@/models/Competition";
import { scenarios, COMP_DAYS, type Timeframe } from "@/data/scenarios";
import { safeJson } from "@/lib/utils";

// GET /api/competitions?userId=xxx&status=active
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const userId = sp.get("userId");
  const status = sp.get("status");

  await connectDB();

  const global = sp.get("global");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (status) filter.status = status;
  if (global === "true") {
    filter.isGlobal = true;
  } else if (userId) {
    filter["participants.userId"] = userId;
  }

  const competitions = await Competition.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json(competitions);
}

// POST /api/competitions
export async function POST(req: NextRequest) {
  const body = await safeJson(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { action, userId, username } = body;

  if (!userId || !username) {
    return NextResponse.json({ error: "userId and username required" }, { status: 400 });
  }

  await connectDB();

  // ─── Create a competition ──────────────────────────────────────────────
  if (action === "create") {
    const { name, timeframe, scenarioId } = body;

    if (!name || !timeframe) {
      return NextResponse.json({ error: "name and timeframe required" }, { status: 400 });
    }

    const scenario = scenarioId ? scenarios.find((s) => s.id === scenarioId) : null;
    const totalDays = COMP_DAYS[timeframe as Timeframe] ?? 7;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const now = new Date();

    const competition = await Competition.create({
      type: scenarioId ? "historical" : "live",
      scenario: scenarioId ?? null,
      name,
      description: scenario?.tagline ?? "",
      timeframe,
      startingCash: 10000,
      currentDay: 0,
      totalDays,
      startedAt: now,
      createdBy: userId,
      isGlobal: false,
      inviteCode,
      status: "active",
      participants: [
        {
          userId,
          username,
          joinedAt: now,
          cash: 10000,
          holdings: [],
          valueHistory: [{ day: 0, value: 10000 }],
        },
      ],
    });

    return NextResponse.json({ competition, inviteCode }, { status: 201 });
  }

  // ─── Join a competition by invite code ──────────────────────────────────
  if (action === "join") {
    const { inviteCode } = body;
    if (!inviteCode) {
      return NextResponse.json({ error: "inviteCode required" }, { status: 400 });
    }

    const competition = await Competition.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    if (competition.status === "completed") {
      return NextResponse.json({ error: "Competition has ended" }, { status: 400 });
    }

    const alreadyJoined = competition.participants.some(
      (p: { userId: string }) => p.userId === userId
    );
    if (alreadyJoined) {
      return NextResponse.json({ competition, alreadyJoined: true });
    }

    competition.participants.push({
      userId,
      username,
      joinedAt: new Date(),
      cash: competition.startingCash,
      holdings: [],
      valueHistory: [{ day: 0, value: competition.startingCash }],
    });
    competition.markModified("participants");
    await competition.save();

    return NextResponse.json({ competition, alreadyJoined: false });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
