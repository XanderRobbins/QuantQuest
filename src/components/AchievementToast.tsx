"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { ACHIEVEMENTS } from "@/lib/achievements";

interface AchievementToastProps {
  achievementIds: string[];
  onDismiss: () => void;
}

export function AchievementToast({
  achievementIds,
  onDismiss,
}: AchievementToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // Wait for fade-out animation
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (achievementIds.length === 0) return null;

  const achievements = achievementIds
    .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
    .filter(Boolean);

  if (achievements.length === 0) return null;

  return (
    <div
      className={`fixed top-6 right-6 z-[100] flex flex-col gap-2 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4"
      }`}
    >
      {achievements.map((achievement) => (
        <div
          key={achievement!.id}
          className="flex items-center gap-3 rounded-xl border border-yellow-500/40 bg-card px-5 py-3 shadow-lg shadow-yellow-500/10 animate-in slide-in-from-top-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
            <Trophy className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-yellow-400">
              {achievement!.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {achievement!.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
