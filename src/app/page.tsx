"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  BarChart3,
  Shield,
  Zap,
  Brain,
  Blocks,
  Loader2,
} from "lucide-react";
import {
  apiCreatePortfolio,
  apiFetchPortfolio,
  loadPortfolio,
  getDefaultPortfolio,
  savePortfolio,
  getUserId,
  setUserId,
} from "@/lib/portfolio";

const features = [
  {
    icon: BarChart3,
    label: "Smart Sectors",
    desc: "Curated investment baskets",
    color: "#6366f1",
    bg: "bg-indigo-500/10",
  },
  {
    icon: Zap,
    label: "Quant Strategies",
    desc: "Algorithmic alpha",
    color: "#f97316",
    bg: "bg-orange-500/10",
  },
  {
    icon: Shield,
    label: "Safe Assets",
    desc: "Treasuries & bonds",
    color: "#22c55e",
    bg: "bg-green-500/10",
  },
  {
    icon: Brain,
    label: "AI Analysis",
    desc: "Gemini-powered insights",
    color: "#a855f7",
    bg: "bg-purple-500/10",
  },
  {
    icon: Blocks,
    label: "On-Chain Trades",
    desc: "Solana verified",
    color: "#9945FF",
    bg: "bg-violet-500/10",
  },
  {
    icon: TrendingUp,
    label: "Live Portfolio",
    desc: "Real-time tracking",
    color: "#06b6d4",
    bg: "bg-cyan-500/10",
  },
];

export default function LandingPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"create" | "login">("create");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleStart = async () => {
    if (!username.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const checkRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      if (checkRes.ok) {
        setError("An account with that name already exists. Switch to login to access it.");
        setLoading(false);
        return;
      }
    } catch { /* connectivity issue — proceed with create */ }

    try {
      await apiCreatePortfolio(username.trim());
    } catch {
      const existing = loadPortfolio();
      if (!existing || existing.username !== username.trim()) {
        savePortfolio(getDefaultPortfolio(username.trim()));
      }
    }

    try {
      const userId = getUserId();
      fetch("/api/nessie/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username: username.trim() }),
      }).catch(() => {});
    } catch { /* non-fatal */ }

    router.push("/dashboard");
  };

  const handleLogin = async () => {
    if (!username.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error === "Account not found"
          ? "No account found with that name. Try creating a new one."
          : "Login failed. Please try again.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUserId(data.userId);
      const portfolio = await apiFetchPortfolio();
      if (!portfolio) {
        savePortfolio({
          userId: data.userId,
          username: data.username,
          holdings: data.portfolio.holdings,
          history: data.portfolio.history,
        });
      }
      router.push("/dashboard");
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16 overflow-hidden">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-cyan-500/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30 shadow-lg shadow-primary/20">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-6xl font-black tracking-tight">
            Quant<span className="text-gradient">Quest</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-sm mx-auto">
            The investing platform built for your generation.
            <br />
            <span className="text-foreground/70">AI-powered. Gamified. Blockchain-verified.</span>
          </p>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-xl shadow-black/20 p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold">
              {mode === "create" ? "Start Your Portfolio" : "Welcome Back"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "create"
                ? <>Get a <span className="font-semibold text-foreground">$10,000</span> bank balance to start investing.</>
                : "Enter your name to access your portfolio."}
            </p>
          </div>

          <Input
            placeholder={mode === "create" ? "Your name (e.g. Alex Chen)" : "Your account name"}
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && (mode === "create" ? handleStart() : handleLogin())}
            disabled={loading}
            className="h-11 bg-background/60"
          />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/25"
            onClick={mode === "create" ? handleStart : handleLogin}
            disabled={loading || !username.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "create" ? "Setting up..." : "Logging in..."}
              </>
            ) : mode === "create" ? (
              "Start Investing →"
            ) : (
              "Log In →"
            )}
          </Button>

          <button
            type="button"
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => { setMode(mode === "create" ? "login" : "create"); setError(null); }}
          >
            {mode === "create"
              ? "Already have an account? Log in"
              : "New here? Create an account"}
          </button>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="flex flex-col items-center gap-2.5 rounded-xl border border-border/50 bg-card/60 p-3.5 text-center hover:border-border transition-colors"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${f.bg}`}>
                  <Icon className="h-4 w-4" style={{ color: f.color }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{f.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground/60">
          Built for VandyHacks XII · Capital One Track · All trades are simulated
        </p>
      </div>
    </div>
  );
}
