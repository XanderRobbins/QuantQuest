"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star } from "lucide-react";
import { getUserId } from "@/lib/portfolio";
import { ACHIEVEMENTS } from "@/lib/achievements";

interface LevelInfo {
  level: number;
  name: string;
  xp: number;
  nextLevelXp: number;
  progress: number;
}

interface GameProfileData {
  xp: number;
  level: LevelInfo;
  achievements: string[];
}

export function GameProfile() {
  const [profile, setProfile] = useState<GameProfileData | null>(null);

  useEffect(() => {
    async function load() {
      const userId = getUserId();
      if (!userId) return;
      try {
        const res = await fetch(`/api/gamification?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch {
        // Non-blocking — silently fail
      }
    }
    load();
  }, []);

  if (!profile) return null;

  const { level } = profile;
  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = profile.achievements.length;

  return (
    <Card className="border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Player Profile</CardTitle>
          </div>
          <Badge
            variant="secondary"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          >
            Level {level.level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level Info */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-semibold text-yellow-400">{level.name}</span>
            <span className="text-muted-foreground">
              {profile.xp} / {level.nextLevelXp} XP
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
              style={{ width: `${level.progress}%` }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span>
              {unlockedCount}/{totalAchievements} Achievements
            </span>
          </div>
          <span className="text-sm font-semibold text-yellow-400">
            {profile.xp} XP Total
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
