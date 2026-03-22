"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiFetchPortfolio,
  loadPortfolio,
  getTotalValue,
  getAllocationByType,
  type PortfolioState,
} from "@/lib/portfolio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, AlertTriangle, Sparkles, Scale, Loader2, TrendingUp, MessageCircle, Send, X } from "lucide-react";
import { AchievementToast } from "@/components/AchievementToast";
import { getUserId } from "@/lib/portfolio";
import { sectors } from "@/data/sectors";
import { strategies } from "@/data/strategies";
import { safeties } from "@/data/safeties";
import { formatCurrency } from "@/lib/utils";

interface Analysis {
  critic: string;
  optimist: string;
  realist: string;
}

type Perspective = "critic" | "optimist" | "realist";

// Renders a markdown string: **bold**, *italic*, - bullet lists
function MarkdownText({ text, baseColor }: { text: string; baseColor: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = (key: string) => {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={key} className="space-y-2 my-2">
        {bulletBuffer.map((item, i) => (
          <li key={i} className="flex gap-2.5">
            <span className={`mt-[3px] h-1.5 w-1.5 rounded-full flex-shrink-0 ${baseColor}`} style={{ marginTop: 7 }} />
            <span className="text-sm leading-relaxed text-foreground/85">
              <InlineMarkdown text={item} />
            </span>
          </li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      bulletBuffer.push(trimmed.replace(/^[-•]\s+/, ""));
    } else {
      flushBullets(`bullets-${idx}`);
      elements.push(
        <p key={idx} className="text-sm leading-relaxed text-foreground/85">
          <InlineMarkdown text={trimmed} />
        </p>
      );
    }
  });

  flushBullets("bullets-end");

  return <div className="space-y-1">{elements}</div>;
}

// Handles inline **bold** and *italic* within a text string
function InlineMarkdown({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  // Match **bold**, *italic*, or plain text
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={match.index} className="font-semibold text-foreground">{token.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={match.index} className="italic text-foreground/70">{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

export default function AnalysisPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [chatOpen, setChatOpen] = useState<Perspective | null>(null);
  const [chatHistories, setChatHistories] = useState<Record<Perspective, { role: "user" | "model"; text: string }[]>>({
    critic: [], optimist: [], realist: [],
  });
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const p = (await apiFetchPortfolio()) ?? loadPortfolio();
      if (!p) { router.push("/"); return; }
      setPortfolio(p);
    }
    load();
  }, [router]);

  if (!portfolio) return null;

  const totalValue = getTotalValue(portfolio);
  const allocation = getAllocationByType(portfolio);

  const holdingNames = portfolio.holdings
    .filter((h) => h.id !== "cash" && h.amount > 0)
    .map((h) => {
      const item =
        sectors.find((s) => s.id === h.id) ||
        strategies.find((s) => s.id === h.id) ||
        safeties.find((s) => s.id === h.id);
      return `${item?.name ?? h.id} (${formatCurrency(h.amount)})`;
    });

  const runAnalysis = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalValue, allocation, holdings: holdingNames }),
      });
      const data = await res.json();
      if (res.ok && data.critic && data.optimist && data.realist) {
        setAnalysis(data);
      }
      try {
        const gamRes = await fetch("/api/gamification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: getUserId(), action: "analyze" }),
        });
        if (gamRes.ok) {
          const gamData = await gamRes.json();
          if (gamData.newAchievements?.length > 0) setNewAchievements(gamData.newAchievements);
        }
      } catch { /* gamification non-fatal */ }
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    if (!chatOpen || !chatInput.trim() || !analysis) return;
    const message = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    const perspective = chatOpen;
    const newHistory = [...chatHistories[perspective], { role: "user" as const, text: message }];
    setChatHistories((prev) => ({ ...prev, [perspective]: newHistory }));

    try {
      const res = await fetch("/api/analysis/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perspective,
          analysisText: analysis[perspective],
          holdings: holdingNames,
          history: chatHistories[perspective],
          message,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setChatHistories((prev) => ({
          ...prev,
          [perspective]: [...newHistory, { role: "model" as const, text: data.reply }],
        }));
      }
    } catch { /* */ }
    finally { setChatLoading(false); }
  };

  const perspectives: {
    key: Perspective;
    title: string;
    subtitle: string;
    icon: typeof AlertTriangle;
    gradient: string;
    border: string;
    headerBg: string;
    iconBg: string;
    iconColor: string;
    dotColor: string;
    divider: string;
  }[] = [
    {
      key: "critic",
      title: "The Critic",
      subtitle: "Risk & Downside",
      icon: AlertTriangle,
      gradient: "from-red-500/6 to-transparent",
      border: "border-red-500/25",
      headerBg: "bg-red-500/8",
      iconBg: "bg-red-500/15",
      iconColor: "text-red-400",
      dotColor: "bg-red-400",
      divider: "border-red-500/15",
    },
    {
      key: "optimist",
      title: "The Optimist",
      subtitle: "Upside Potential",
      icon: Sparkles,
      gradient: "from-emerald-500/6 to-transparent",
      border: "border-emerald-500/25",
      headerBg: "bg-emerald-500/8",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
      dotColor: "bg-emerald-400",
      divider: "border-emerald-500/15",
    },
    {
      key: "realist",
      title: "The Realist",
      subtitle: "Balanced Outlook",
      icon: Scale,
      gradient: "from-blue-500/6 to-transparent",
      border: "border-blue-500/25",
      headerBg: "bg-blue-500/8",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-400",
      dotColor: "bg-blue-400",
      divider: "border-blue-500/15",
    },
  ];

  return (
    <div className="space-y-6">
      {newAchievements.length > 0 && (
        <AchievementToast achievementIds={newAchievements} onDismiss={() => setNewAchievements([])} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary/80">AI Analysis</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Portfolio Analysis</h1>
          <p className="text-muted-foreground text-sm mt-1">Three AI perspectives powered by Google Gemini</p>
        </div>
        <Button size="lg" onClick={runAnalysis} disabled={loading} className="gap-2 flex-shrink-0 shadow-lg shadow-primary/20">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          {loading ? "Analyzing..." : "Run Analysis"}
        </Button>
      </div>

      {/* Portfolio snapshot */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Value",  value: formatCurrency(totalValue),         color: "text-primary",     bg: "bg-primary/10",      border: "border-primary/20" },
          { label: "Sectors",      value: formatCurrency(allocation.sector),   color: "text-indigo-400",  bg: "bg-indigo-500/10",   border: "border-indigo-500/20" },
          { label: "Strategies",   value: formatCurrency(allocation.strategy), color: "text-orange-400",  bg: "bg-orange-500/10",   border: "border-orange-500/20" },
          { label: "Safe Assets",  value: formatCurrency(allocation.safety),   color: "text-emerald-400", bg: "bg-emerald-500/10",  border: "border-emerald-500/20" },
        ].map((m) => (
          <div key={m.label} className={`rounded-xl border ${m.border} ${m.bg} p-4`}>
            <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
            <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {holdingNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {holdingNames.map((name) => (
            <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>
          ))}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid gap-5 lg:grid-cols-3">
          {perspectives.map((p) => (
            <div key={p.key} className={`rounded-xl border ${p.border} bg-gradient-to-b ${p.gradient} overflow-hidden`}>
              <div className={`${p.headerBg} px-5 py-4 border-b ${p.divider} flex items-center gap-3`}>
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="p-5 space-y-3">
                <Skeleton className="h-4 w-full" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-2.5">
                    <Skeleton className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0" />
                    <Skeleton className={`h-3 ${["w-full","w-5/6","w-4/5","w-full","w-3/4"][i]}`} />
                  </div>
                ))}
                <Skeleton className="h-3 w-2/3 mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {analysis && !loading && (
        <div className="grid gap-5 lg:grid-cols-3">
          {perspectives.map((p) => {
            const Icon = p.icon;
            const isChatOpen = chatOpen === p.key;
            const messages = chatHistories[p.key];
            return (
              <div key={p.key} className={`rounded-xl border ${p.border} bg-gradient-to-b ${p.gradient} overflow-hidden flex flex-col`}>
                {/* Card header */}
                <div className={`${p.headerBg} px-5 py-4 border-b ${p.divider} flex items-center gap-3`}>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${p.iconBg} flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${p.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-base ${p.iconColor}`}>{p.title}</h3>
                    <p className="text-xs text-muted-foreground">{p.subtitle}</p>
                  </div>
                  {isChatOpen && (
                    <button onClick={() => setChatOpen(null)} className="rounded-lg p-1.5 hover:bg-accent/50 transition-colors">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                {/* Card body */}
                <div className="p-5 flex-1">
                  <MarkdownText text={analysis[p.key]} baseColor={p.dotColor} />
                </div>

                {/* Chat panel */}
                {isChatOpen && (
                  <div className={`border-t ${p.divider} flex flex-col`}>
                    {/* Messages */}
                    <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                      {messages.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Ask {p.title} anything about their analysis...
                        </p>
                      )}
                      {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : `${p.headerBg} border ${p.border}`
                          }`}>
                            {msg.role === "model" ? (
                              <MarkdownText text={msg.text} baseColor={p.dotColor} />
                            ) : (
                              msg.text
                            )}
                          </div>
                        </div>
                      ))}
                      {chatLoading && chatOpen === p.key && (
                        <div className="flex justify-start">
                          <div className={`rounded-xl px-3 py-2 ${p.headerBg} border ${p.border}`}>
                            <Loader2 className={`h-4 w-4 animate-spin ${p.iconColor}`} />
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Input */}
                    <div className={`border-t ${p.divider} p-3 space-y-2`}>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatOpen === p.key ? chatInput : ""}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                          placeholder={`Ask ${p.title}...`}
                          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          disabled={chatLoading}
                        />
                        <button
                          onClick={sendChat}
                          disabled={chatLoading || !chatInput.trim()}
                          className={`rounded-lg px-3 py-2 ${p.iconBg} ${p.iconColor} transition-all hover:opacity-80 disabled:opacity-40`}
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60">
                        <Sparkles className="h-3 w-3" />
                        <span>Powered by Google Gemini</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Discuss button */}
                {!isChatOpen && (
                  <div className={`border-t ${p.divider} p-3`}>
                    <button
                      onClick={() => { setChatOpen(p.key); setChatInput(""); }}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${p.headerBg} ${p.iconColor} hover:opacity-80`}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Discuss with {p.title}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!analysis && !loading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 p-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Brain className="h-8 w-8 text-primary/60" />
          </div>
          <h3 className="text-xl font-bold">Ready for AI Analysis</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Get three detailed AI perspectives on your portfolio — a Critic, an Optimist, and a Realist — powered by Google Gemini.
          </p>
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground/60">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{holdingNames.length} positions · {formatCurrency(totalValue)} total value</span>
          </div>
          <Button onClick={runAnalysis} className="mt-6 gap-2 shadow-lg shadow-primary/20">
            <Brain className="h-4 w-4" />
            Run Analysis
          </Button>
        </div>
      )}
    </div>
  );
}
