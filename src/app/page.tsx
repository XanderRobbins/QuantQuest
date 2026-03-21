"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    desc: "Invest in curated baskets",
    color: "text-[#6366f1]",
  },
  {
    icon: Zap,
    label: "Quant Strategies",
    desc: "Algorithmic alpha",
    color: "text-[#f97316]",
  },
  {
    icon: Shield,
    label: "Safe Assets",
    desc: "Treasuries & more",
    color: "text-[#22c55e]",
  },
  {
    icon: Brain,
    label: "AI Analysis",
    desc: "Gemini-powered",
    color: "text-[#a855f7]",
  },
  {
    icon: Blocks,
    label: "On-Chain Trades",
    desc: "Solana verified",
    color: "text-[#9945FF]",
  },
  {
    icon: TrendingUp,
    label: "Live Portfolio",
    desc: "Real-time tracking",
    color: "text-[#06b6d4]",
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

    // Check if username already exists — prompt to log in instead
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

    // Fire-and-forget Nessie account creation
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
      // Set the userId so subsequent API calls use this account
      setUserId(data.userId);
      // Fetch the full portfolio through the normal pipeline
      // (runs simulateReturns, normalizes data, saves to localStorage)
      const portfolio = await apiFetchPortfolio();
      if (!portfolio) {
        // Fallback: save what we got from login
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
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight">
              Quant<span className="text-primary">Quest</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-sm mx-auto">
            The investing platform built for your generation. Gamified, AI-powered, blockchain-verified.
          </p>
        </div>

        {/* Auth card */}
        <Card className="border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="text-xl">
              {mode === "create" ? "Start Your Portfolio" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {mode === "create"
                ? <>Create your account to get a <span className="font-semibold text-foreground">$10,000</span> bank balance — transfer funds to start investing.</>
                : "Enter your name to log back into your existing portfolio."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder={mode === "create" ? "Your name (e.g. Alex Chen)" : "Your account name"}
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === "Enter" && (mode === "create" ? handleStart() : handleLogin())}
              disabled={loading}
              className="h-11"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              className="w-full h-11 text-base font-semibold"
              onClick={mode === "create" ? handleStart : handleLogin}
              disabled={loading || !username.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {mode === "create" ? "Setting up your account..." : "Logging in..."}
                </>
              ) : mode === "create" ? (
                "Start Investing \u2192"
              ) : (
                "Log In \u2192"
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
          </CardContent>
        </Card>

        {/* Feature grid */}
        <div className="grid grid-cols-3 gap-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center"
              >
                <Icon className={`h-6 w-6 ${f.color}`} />
                <div>
                  <p className="text-xs font-semibold text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Built for VandyHacks XII · Capital One Track · All trades are simulated
        </p>
      </div>
    </div>
  );
}
