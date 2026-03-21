"use client";

import { useState } from "react";
import { CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";

interface Props {
  id: string;
  name: string;
  description: string;
  risk: string;
  type: "sector" | "strategy" | "safety";
  returnValue?: number;
  returnLabel?: string;
  extraInfo?: string;
  color: string;
  onInvest: () => void;
  onDetail: (id: string) => void;
}

const typeConfig = {
  sector: { label: "Sector", badgeClass: "bg-blue-50 text-blue-600 border-blue-200" },
  strategy: { label: "Strategy", badgeClass: "bg-blue-50 text-blue-600 border-blue-200" },
  safety: { label: "Safe Asset", badgeClass: "bg-blue-50 text-blue-600 border-blue-200" },
};

export function InvestmentCard({
  id,
  name,
  description,
  risk,
  type,
  returnValue,
  returnLabel,
  extraInfo,
  onInvest,
  onDetail,
}: Props) {
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const riskVariant =
    risk === "High" || risk === "Very High"
      ? "destructive"
      : risk === "Medium"
      ? "warning"
      : "success";

  const generateAiDescription = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (aiDescription || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, existingDescription: description }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiDescription(data.description);
      }
    } catch {
      // keep original description
    } finally {
      setAiLoading(false);
    }
  };

  const handleInvestClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onInvest();
  };

  const { badgeClass } = typeConfig[type];

  return (
    <div
      className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5 h-full"
      onClick={() => onDetail(id)}
    >
      {/* Blue top accent bar */}
      <div className="h-0.5 w-full bg-primary/70" />

      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-primary/10">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight truncate">{name}</h3>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold mt-0.5 ${badgeClass}`}>
              {typeConfig[type].label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <button
            onClick={generateAiDescription}
            className="text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer p-0.5"
            title="Generate AI description"
          >
            <Sparkles className={`h-3.5 w-3.5 ${aiLoading ? "animate-pulse" : ""} ${aiDescription ? "text-primary" : ""}`} />
          </button>
          <Badge variant={riskVariant} className="text-[10px] px-1.5 py-0.5">{risk}</Badge>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 pb-3 space-y-2.5">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {aiDescription ?? description}
        </p>
        {aiDescription && (
          <span className="inline-flex items-center gap-1 text-[10px] text-primary/70 border border-primary/20 rounded-full px-2 py-0.5">
            <Sparkles className="h-2.5 w-2.5" /> AI Enhanced
          </span>
        )}
        {returnValue !== undefined && (
          <div className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                returnValue >= 0
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {returnValue >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {formatPercent(returnValue)}
            </div>
            <span className="text-[10px] text-muted-foreground">{returnLabel ?? "1Y Return"}</span>
          </div>
        )}
        {extraInfo && (
          <p className="text-[10px] text-muted-foreground/60 italic line-clamp-2">{extraInfo}</p>
        )}
      </div>

      <CardFooter className="p-3 pt-0">
        <Button className="w-full h-8 text-xs font-semibold" onClick={handleInvestClick}>
          Invest
        </Button>
      </CardFooter>
    </div>
  );
}
