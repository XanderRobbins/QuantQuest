"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadPortfolio, getUserId, type PortfolioState } from "@/lib/portfolio";
import {
  scenarios,
  timeframeLabels,
  type Timeframe,
  type HistoricalScenario,
} from "@/data/scenarios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  Trophy,
  Clock,
  Users,
  Swords,
  Crown,
  Medal,
  ChevronRight,
  ArrowLeft,
  X,
  Plus,
  Copy,
  ArrowRight,
  Zap,
  History,
  UserPlus,
  CheckCircle2,
  Play,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CompetitionRecord {
  _id: string;
  type: "historical" | "live";
  scenario: string | null;
  name: string;
  description: string;
  timeframe: string;
  inviteCode: string | null;
  isGlobal: boolean;
  currentDay: number;
  totalDays: number;
  status: string;
  participants: {
    userId: string;
    username: string;
    cash: number;
    holdings: { assetId: string; amount: number }[];
  }[];
  createdAt: string;
}

const difficultyColor: Record<string, string> = {
  Easy: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Medium: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  Hard: "bg-red-500/15 text-red-600 border-red-500/30",
  Expert: "bg-violet-500/15 text-violet-600 border-violet-500/30",
};

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-3.5 w-3.5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-3.5 w-3.5 text-slate-400" />;
  if (rank === 3) return <Medal className="h-3.5 w-3.5 text-amber-600" />;
  return <span className="text-xs text-muted-foreground font-mono">{rank}</span>;
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CompetitionPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);
  const [mode, setMode] = useState<null | "historical" | "live" | "ranked">(null);

  // Historical state
  const [activeScenario, setActiveScenario] = useState<HistoricalScenario | null>(null);
  const [createTimeframe, setCreateTimeframe] = useState<Timeframe>("1w");
  const [createName, setCreateName] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Live state
  const [liveName, setLiveName] = useState("");
  const [liveTimeframe, setLiveTimeframe] = useState<Timeframe>("1w");
  const [liveCreatedCode, setLiveCreatedCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinResult, setJoinResult] = useState<string | null>(null);

  // Ranked
  const [rankedComps, setRankedComps] = useState<CompetitionRecord[]>([]);
  const [joiningRanked, setJoiningRanked] = useState<string | null>(null);

  // Shared
  const [copiedCode, setCopiedCode] = useState(false);
  const [userCompetitions, setUserCompetitions] = useState<CompetitionRecord[]>([]);
  const [loadingComps, setLoadingComps] = useState(false);

  const userId = getUserId();
  const username = portfolio?.username ?? "Player";

  useEffect(() => {
    const p = loadPortfolio();
    if (!p) { router.push("/"); return; }
    setPortfolio(p);
  }, [router]);

  const refreshComps = () => {
    if (!userId) return;
    setLoadingComps(true);
    fetch(`/api/competitions?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => setUserCompetitions(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingComps(false));
  };

  useEffect(() => { refreshComps(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch ranked/global competitions
  const refreshRanked = () => {
    fetch("/api/competitions?global=true&status=active")
      .then((r) => r.json())
      .then((data) => setRankedComps(Array.isArray(data) ? data : []))
      .catch(() => {});
  };
  useEffect(() => { refreshRanked(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleJoinRanked(compId: string, inviteCode: string) {
    setJoiningRanked(compId);
    try {
      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", userId, username, inviteCode }),
      });
      if (res.ok) {
        refreshComps();
        refreshRanked();
        router.push(`/competition/${compId}`);
      }
    } catch { /* */ }
    finally { setJoiningRanked(null); }
  }

  // ─── Create historical competition ───────────────────────────────────────

  async function handleCreateHistorical() {
    if (!activeScenario || !createName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          userId,
          username,
          name: createName.trim(),
          timeframe: createTimeframe,
          scenarioId: activeScenario.id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedCode(data.inviteCode);
        refreshComps();
      }
    } catch { /* */ }
    finally { setCreating(false); }
  }

  // ─── Create live competition ─────────────────────────────────────────────

  async function handleCreateLive() {
    if (!liveName.trim()) return;
    try {
      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          userId,
          username,
          name: liveName.trim(),
          timeframe: liveTimeframe,
        }),
      });
      const data = await res.json();
      if (res.ok) { setLiveCreatedCode(data.inviteCode); setLiveName(""); refreshComps(); }
    } catch { /* */ }
  }

  // ─── Join ────────────────────────────────────────────────────────────────

  async function handleJoin() {
    if (!joinCode.trim()) return;
    try {
      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", userId, username, inviteCode: joinCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setJoinResult(data.alreadyJoined ? "Already joined!" : "Joined successfully!");
        setJoinCode("");
        refreshComps();
      } else {
        setJoinResult(data.error ?? "Not found");
      }
    } catch { setJoinResult("Failed to join"); }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function getCompValue(comp: CompetitionRecord) {
    const p = comp.participants.find((p) => p.userId === userId);
    if (!p) return 10000;
    return Math.round((p.cash + (p.holdings ?? []).reduce((s, h) => s + h.amount, 0)) * 100) / 100;
  }

  function getCompRank(comp: CompetitionRecord) {
    const values = comp.participants.map((p) => ({
      userId: p.userId,
      value: p.cash + (p.holdings ?? []).reduce((s, h) => s + h.amount, 0),
    }));
    values.sort((a, b) => b.value - a.value);
    return values.findIndex((v) => v.userId === userId) + 1;
  }

  if (!portfolio) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Competition Arena</h1>
          <p className="text-sm text-muted-foreground">
            Compete in historical market scenarios or live challenges with friends
          </p>
        </div>
      </div>

      {/* ═══════════════════ MODE SELECTOR ═══════════════════ */}
      {!mode && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto pt-8">
          {/* Ranked */}
          <button
            onClick={() => setMode("ranked")}
            className="group relative overflow-hidden rounded-2xl border-2 border-border bg-card p-8 text-left transition-all duration-200 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-500 to-orange-500" />
            <div className="space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/10 ring-1 ring-yellow-500/20">
                <Crown className="h-7 w-7 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Ranked</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Join the official weekly challenge and compete against the entire community.
                  Everyone starts with $10,000 — prove your skills.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Open to all</span>
                <span>·</span>
                <span>Weekly reset</span>
              </div>
            </div>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-colors" />
          </button>

          {/* Historical */}
          <button
            onClick={() => setMode("historical")}
            className="group relative overflow-hidden rounded-2xl border-2 border-border bg-card p-8 text-left transition-all duration-200 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-red-500" />
            <div className="space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
                <History className="h-7 w-7 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Historical</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Relive iconic market events — trade through the COVID crash, 2008 crisis,
                  or dot-com bubble in real time with friends.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{scenarios.length} scenarios</span>
                <span>·</span>
                <span>Week-long simulated markets</span>
              </div>
            </div>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-colors" />
          </button>

          {/* Live */}
          <button
            onClick={() => setMode("live")}
            className="group relative overflow-hidden rounded-2xl border-2 border-border bg-card p-8 text-left transition-all duration-200 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-violet-500" />
            <div className="space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/20">
                <Zap className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Live</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Create a live competition with friends using real-time market data.
                  Start a weekly challenge and see who comes out on top.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Weekly challenges</span>
                <span>·</span>
                <span>Invite friends with a code</span>
              </div>
            </div>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-colors" />
          </button>

          {/* Join */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-border bg-card p-8 text-left transition-all duration-200 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <UserPlus className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Join</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Got an invite code? Enter it below to jump into your friends&apos; competition.
                </p>
              </div>
              <div className="space-y-2">
                <input type="text" value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinResult(null); }}
                  placeholder="INVITE CODE" maxLength={6}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-1 focus:ring-primary" />
                <button onClick={handleJoin} disabled={joinCode.length < 3}
                  className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50">
                  Join →
                </button>
              </div>
              {joinResult && (
                <div className={`rounded-lg border p-3 text-sm ${
                  joinResult.includes("success") || joinResult.includes("Already")
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600"
                    : "border-red-500/30 bg-red-500/5 text-red-600"
                }`}>{joinResult}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ HISTORICAL MODE ═══════════════════ */}
      {mode === "historical" && (
        <div className="space-y-6">
          <button
            onClick={() => { setMode(null); setActiveScenario(null); setCreatedCode(null); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div>
            <h2 className="text-lg font-semibold">Pick a Market Event</h2>
            <p className="text-sm text-muted-foreground">
              Choose a scenario, create a competition, invite your friends, and trade through history together.
            </p>
          </div>

          {/* Scenario grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveScenario(activeScenario?.id === s.id ? null : s);
                  setCreatedCode(null);
                  setCreateName(`${s.name} Challenge`);
                }}
                className={`group relative overflow-hidden rounded-xl border text-left transition-all duration-200 hover:shadow-lg ${
                  activeScenario?.id === s.id
                    ? "border-primary ring-2 ring-primary/20 shadow-lg"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className={`h-1.5 bg-gradient-to-r ${s.gradient}`} />
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs font-mono">{s.year}</Badge>
                    <Badge variant="outline" className={`text-xs ${difficultyColor[s.difficulty]}`}>
                      {s.difficulty}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg leading-tight">{s.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{s.tagline}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{s.period}</span>
                  </div>
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>

          {/* Create competition for selected scenario */}
          {activeScenario && (
            <Card className="border-primary/30 overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${activeScenario.gradient}`} />
              <CardContent className="p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold">{activeScenario.name}</h2>
                    <p className="text-sm text-muted-foreground max-w-2xl">{activeScenario.description}</p>
                  </div>
                  <button onClick={() => { setActiveScenario(null); setCreatedCode(null); }} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Key events */}
                <div className="grid gap-1 sm:grid-cols-2">
                  {activeScenario.keyEvents.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: activeScenario.color }} />
                      <span className="text-muted-foreground">{e}</span>
                    </div>
                  ))}
                </div>

                {createdCode ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span className="font-semibold text-emerald-600">Competition created!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Share this code with your friends. Once they join, everyone can start trading.
                    </p>
                    <div className="flex items-center gap-3">
                      <code className="rounded-lg bg-card px-4 py-2 text-2xl font-bold font-mono tracking-[0.3em]">
                        {createdCode}
                      </code>
                      <button onClick={() => copyCode(createdCode)} className="rounded-lg p-2 hover:bg-accent transition-colors">
                        {copiedCode ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You&apos;ve been auto-joined. Head to &quot;Your Competitions&quot; below to start trading.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="Competition name..."
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground font-medium">Duration</label>
                      <div className="flex gap-2">
                        {(["1w", "1m", "3m"] as const).map((tf) => (
                          <button
                            key={tf}
                            onClick={() => setCreateTimeframe(tf)}
                            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                              createTimeframe === tf
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-accent/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                            }`}
                          >
                            {timeframeLabels[tf]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleCreateHistorical}
                      disabled={!createName.trim() || creating}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
                    >
                      {creating ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      ) : (
                        <Swords className="h-4 w-4" />
                      )}
                      Create Competition & Get Invite Code
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════════════ LIVE MODE ═══════════════════ */}
      {mode === "live" && (
        <div className="space-y-6">
          <button onClick={() => setMode(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <Card className="max-w-lg">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Create a Live Competition</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Start a live competition with real market data. Everyone starts with $10,000.
              </p>
              <div className="space-y-3">
                <input type="text" value={liveName} onChange={(e) => setLiveName(e.target.value)} placeholder="Competition name..."
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Duration</label>
                  <div className="flex gap-2">
                    {(["1w", "1m", "3m"] as const).map((tf) => (
                      <button key={tf} onClick={() => setLiveTimeframe(tf)}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                          liveTimeframe === tf ? "bg-primary text-primary-foreground" : "bg-accent/60 text-muted-foreground hover:bg-accent"
                        }`}>
                        {timeframeLabels[tf]}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleCreateLive} disabled={!liveName.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50">
                  <Plus className="h-4 w-4" />
                  Create Competition
                </button>
                {liveCreatedCode && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-600">Created!</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Code:</span>
                      <code className="rounded-md bg-card px-3 py-1 text-lg font-bold font-mono tracking-widest">{liveCreatedCode}</code>
                      <button onClick={() => copyCode(liveCreatedCode)} className="rounded-md p-1.5 hover:bg-accent transition-colors">
                        {copiedCode ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════ RANKED MODE ═══════════════════ */}
      {mode === "ranked" && (
        <div className="space-y-6">
          <button onClick={() => setMode(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-semibold">Ranked Competitions</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Open competitions anyone can join. Compete against the entire QuantQuest community.
            </p>
          </div>

          {rankedComps.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-2">
                <Crown className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">No active ranked competitions right now.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rankedComps.map((comp) => {
                const alreadyIn = comp.participants.some((p) => p.userId === userId);
                const progressPct = comp.totalDays > 0 ? Math.round((comp.currentDay / comp.totalDays) * 100) : 0;

                return (
                  <Card key={comp._id} className="overflow-hidden border-yellow-500/20">
                    <div className="h-1.5 bg-gradient-to-r from-yellow-500 to-orange-500" />
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-yellow-500" />
                            <h3 className="font-bold text-lg">{comp.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">{comp.description}</p>
                        </div>
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 shrink-0">
                          {timeframeLabels[comp.timeframe as Timeframe]}
                        </Badge>
                      </div>

                      {/* Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Day {comp.currentDay} / {comp.totalDays}</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {comp.participants.length} player{comp.participants.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-accent/60 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all" style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>

                      {/* Top 3 preview */}
                      {comp.participants.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground">Leaderboard</p>
                          {[...comp.participants]
                            .sort((a, b) => {
                              const aVal = a.cash + (a.holdings ?? []).reduce((s, h) => s + h.amount, 0);
                              const bVal = b.cash + (b.holdings ?? []).reduce((s, h) => s + h.amount, 0);
                              return bVal - aVal;
                            })
                            .slice(0, 5)
                            .map((p, i) => {
                              const val = p.cash + (p.holdings ?? []).reduce((s, h) => s + h.amount, 0);
                              const ret = ((val - 10000) / 10000) * 100;
                              return (
                                <div key={p.userId} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    {rankIcon(i + 1)}
                                    <span className="font-medium">{p.username}</span>
                                  </div>
                                  <span className={`font-semibold ${ret >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {ret >= 0 ? "+" : ""}{ret.toFixed(2)}%
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {alreadyIn ? (
                        <Link
                          href={`/competition/${comp._id}`}
                          className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
                        >
                          <Play className="h-4 w-4" />
                          Enter Competition
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleJoinRanked(comp._id, comp.inviteCode ?? "")}
                          disabled={joiningRanked === comp._id}
                          className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                        >
                          {joiningRanked === comp._id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Swords className="h-4 w-4" />
                          )}
                          Join Competition
                        </button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ YOUR COMPETITIONS ═══════════════════ */}
      {!mode && <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Your Competitions</h2>
        </div>

        {loadingComps ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : userCompetitions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-2">
              <Trophy className="h-10 w-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No competitions yet.</p>
              <p className="text-xs text-muted-foreground">Create one above or join with an invite code.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {userCompetitions.map((comp) => {
              const scenarioInfo = comp.scenario ? scenarios.find((s) => s.id === comp.scenario) : null;
              const value = getCompValue(comp);
              const returnPct = Math.round(((value - 10000) / 10000) * 10000) / 100;
              const rank = getCompRank(comp);
              const isActive = comp.status === "active" || comp.status === "waiting";
              const progressPct = comp.totalDays > 0 ? Math.round((comp.currentDay / comp.totalDays) * 100) : 0;

              return (
                <Link
                  key={comp._id}
                  href={`/competition/${comp._id}`}
                  className={`group block rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/40 ${
                    isActive ? "border-border" : "border-border opacity-75"
                  }`}
                >
                  {/* Color bar */}
                  {scenarioInfo && <div className={`h-1 bg-gradient-to-r ${scenarioInfo.gradient}`} />}
                  {!scenarioInfo && <div className="h-1 bg-gradient-to-r from-blue-500 to-violet-500" />}

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{comp.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{scenarioInfo?.name ?? "Live"}</span>
                          <span>·</span>
                          <span>{timeframeLabels[comp.timeframe as Timeframe]}</span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${
                          isActive
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isActive ? "Active" : "Done"}
                      </Badge>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Day {comp.currentDay}/{comp.totalDays}</span>
                        <span>
                          <Users className="inline h-3 w-3 mr-0.5" />
                          {comp.participants.length}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-accent/60 overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>

                    {/* Value + rank */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-lg font-bold">{formatCurrency(value)}</p>
                        <p className={`text-sm font-semibold ${returnPct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {formatPercent(returnPct)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {rankIcon(rank)}
                        <span>#{rank}</span>
                      </div>
                    </div>

                    {/* Enter button */}
                    <div className="flex items-center justify-center gap-1.5 rounded-lg bg-primary/5 py-2 text-xs font-medium text-primary group-hover:bg-primary/10 transition-colors">
                      <Play className="h-3.5 w-3.5" />
                      {isActive ? "Enter Competition" : "View Results"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>}
    </div>
  );
}
