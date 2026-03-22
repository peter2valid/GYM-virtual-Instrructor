"use client";

import { useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCountdown } from "@/hooks/use-countdown";

interface WorkoutTimerProps {
  durationSeconds: number;
  onComplete?: () => void;
}

export function WorkoutTimer({
  durationSeconds,
  onComplete,
}: WorkoutTimerProps) {
  const { seconds, isRunning, isDone, start, pause, reset } =
    useCountdown(durationSeconds);

  useEffect(() => {
    if (isDone && onComplete) {
      const id = setTimeout(onComplete, 700);
      return () => clearTimeout(id);
    }
  }, [isDone, onComplete]);

  const progress = durationSeconds > 0 ? seconds / durationSeconds : 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display =
    mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : String(secs);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Time display */}
      <div className="mb-4 text-center">
        <span
          className={cn(
            "text-5xl font-bold tabular-nums tracking-tight",
            isDone ? "text-foreground/40" : "text-foreground"
          )}
        >
          {display}
        </span>
        {mins > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">remaining</p>
        )}
      </div>

      {/* Progress track */}
      <div className="mb-5 h-[3px] w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-1000"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent"
          aria-label="Reset"
        >
          <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <button
          onClick={isRunning ? pause : start}
          disabled={isDone}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full border transition-colors",
            isDone
              ? "cursor-not-allowed border-border opacity-30"
              : "border-foreground bg-foreground text-background hover:opacity-90 active:scale-95"
          )}
          aria-label={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="ml-0.5 h-5 w-5" />
          )}
        </button>

        <div className="h-10 w-10" aria-hidden />
      </div>

      {isDone && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Time&apos;s up
        </p>
      )}
    </div>
  );
}
