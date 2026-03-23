"use client";

import { useEffect } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCountdown } from "@/hooks/use-countdown";

interface WorkoutTimerProps {
  durationSeconds: number;
  onComplete?: () => void;
  /** Auto-start the timer when this component mounts. Defaults to true. */
  autoStart?: boolean;
}

export function WorkoutTimer({
  durationSeconds,
  onComplete,
  autoStart = true,
}: WorkoutTimerProps) {
  const { seconds, isRunning, isDone, start, pause, reset } =
    useCountdown(durationSeconds);

  // Auto-start on mount
  useEffect(() => {
    if (autoStart && !isDone) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Advance to next step when timer finishes
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
    mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : String(seconds);

  function handleToggle() {
    if (isDone) return;
    isRunning ? pause() : start();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Tap the timer display to play/pause — accommodates sweaty/shaky hands */}
      <button
        onClick={handleToggle}
        disabled={isDone}
        className={cn(
          "mb-4 w-full text-center",
          isDone ? "cursor-default" : "cursor-pointer"
        )}
        aria-label={isRunning ? "Pause timer" : "Start timer"}
      >
        <span
          className={cn(
            "text-5xl font-bold tabular-nums tracking-tight",
            isDone ? "text-foreground/40" : "text-foreground"
          )}
        >
          {display}
        </span>
        {mins > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {isDone ? "Time\u2019s up" : isRunning ? "tap to pause" : "tap to resume"}
          </p>
        )}
        {mins === 0 && !isDone && (
          <p className="mt-1 text-xs text-muted-foreground">
            {isRunning ? "tap to pause" : "tap to resume"}
          </p>
        )}
      </button>

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
          onClick={handleToggle}
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
        <p className="mt-3 text-center text-sm font-medium text-foreground">
          Time&apos;s up — moving on
        </p>
      )}
    </div>
  );
}
