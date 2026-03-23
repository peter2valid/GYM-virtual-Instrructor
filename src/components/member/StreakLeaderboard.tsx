"use client";

import { Flame, Trophy, Medal } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { LeaderboardEntry } from "@/features/sessions/queries";

interface StreakLeaderboardProps {
  entries: LeaderboardEntry[];
  currentMemberId?: string;
}

export function StreakLeaderboard({ entries, currentMemberId }: StreakLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/20" />
        <p className="text-sm font-medium text-foreground">No streaks yet!</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Complete a workout today to start the first streak.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Gym Leaderboard
          </p>
          <div className="flex items-center gap-1 text-[10px] font-medium text-primary">
            <Flame className="h-3 w-3 fill-current" />
            STREAKS
          </div>
        </div>
      </div>

      <div className="divide-y divide-border">
        {entries.map((entry, index) => {
          const isTop3 = index < 3;
          const isCurrentUser = entry.profileId === currentMemberId;

          return (
            <div
              key={entry.profileId}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors",
                isCurrentUser && "bg-primary/5"
              )}
            >
              <div className="flex w-6 shrink-0 items-center justify-center font-bold text-sm">
                {isTop3 ? (
                  <Medal
                    className={cn(
                      "h-4 w-4",
                      index === 0 && "text-yellow-500",
                      index === 1 && "text-slate-400",
                      index === 2 && "text-amber-600"
                    )}
                  />
                ) : (
                  <span className="text-muted-foreground/60">{index + 1}</span>
                )}
              </div>

              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                {entry.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.avatarUrl}
                    alt={entry.fullName || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold uppercase text-muted-foreground">
                    {(entry.fullName || "U").charAt(0)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className={cn(
                  "truncate text-sm font-semibold",
                  isCurrentUser ? "text-primary" : "text-foreground"
                )}>
                  {entry.fullName || "Anonymous Member"}
                  {isCurrentUser && <span className="ml-2 text-[10px] font-medium text-primary/60">(You)</span>}
                </p>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-2.5 py-1 text-orange-500">
                <Flame className="h-3.5 w-3.5 fill-current" />
                <span className="text-sm font-bold tabular-nums">{entry.streak}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
