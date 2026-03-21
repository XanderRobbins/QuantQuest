"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

export function InvestmentCard({
  id,
  name,
  description,
  risk,
  type,
  returnValue,
  returnLabel,
  extraInfo,
  color,
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

  return (
    <div className="block cursor-pointer" onClick={() => onDetail(id)}>
      <Card className="flex flex-col transition-all hover:shadow-md hover:border-primary/30 h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
              <CardTitle className="text-lg">{name}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={generateAiDescription}
                className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                title="Generate AI description"
              >
                <Sparkles className={`h-4 w-4 ${aiLoading ? "animate-pulse" : ""} ${aiDescription ? "text-primary" : ""}`} />
              </button>
              <Badge variant={riskVariant}>{risk} Risk</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {aiDescription ?? description}
          </p>
          {aiDescription && (
            <Badge variant="outline" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" /> AI Generated
            </Badge>
          )}
          {returnValue !== undefined && (
            <div className="flex items-center gap-2">
              {returnValue >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span
                className={`text-sm font-semibold ${
                  returnValue >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {formatPercent(returnValue)}
              </span>
              <span className="text-xs text-muted-foreground">{returnLabel ?? "1Y Return"}</span>
            </div>
          )}
          {extraInfo && (
            <p className="text-xs text-muted-foreground italic">{extraInfo}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleInvestClick}>
            Invest
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
