"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  name: string;
  type: "sector" | "strategy" | "safety";
  risk: string;
  availableCash: number;
  onConfirm: (amount: number) => void;
}

export function InvestModal({
  open,
  onClose,
  name,
  type,
  risk,
  availableCash,
  onConfirm,
}: Props) {
  const [amount, setAmount] = useState("");

  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0 && numAmount <= availableCash;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(numAmount);
    setAmount("");
    onClose();
  };

  const presets = [100, 500, 1000, 2500];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invest in {name}</DialogTitle>
          <DialogDescription>
            Allocate funds from your cash reserve into this {type}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Available Cash</span>
            <span className="font-semibold">{formatCurrency(availableCash)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Risk Level</span>
            <Badge variant="secondary">{risk}</Badge>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              placeholder="Enter amount..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
              max={availableCash}
            />
          </div>

          <div className="flex gap-2">
            {presets.map((p) => (
              <Button
                key={p}
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={p > availableCash}
                onClick={() => setAmount(p.toString())}
              >
                ${p.toLocaleString()}
              </Button>
            ))}
          </div>

          <Button className="w-full" size="lg" disabled={!isValid} onClick={handleConfirm}>
            {isValid
              ? `Invest ${formatCurrency(numAmount)}`
              : numAmount > availableCash
              ? "Insufficient funds"
              : "Enter an amount"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
