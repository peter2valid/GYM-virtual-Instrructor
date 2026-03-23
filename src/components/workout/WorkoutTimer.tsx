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
    <div className="rounded-2xl bg-card p-6 shadow-[0_1px_4px_rgba(0,0,0,0.07)]">
      {/* Tap the timer display to play/pause */}
      <button
        onClick={handleToggle}
        disabled={isDone}
        className={cn(
          "mb-5 w-full text-center",
          isDone ? "cursor-default" : "cursor-pointer"
        )}
        aria-label={isRunning ? "Pause timer" : "Start timer"}
      >
        <span
          className={cn(
            "text-[4.5rem] font-bold tabular-nums tracking-tight leading-none",
            isDone ? "text-foreground/30" : "text-foreground"
          )}
        >
          {display}
        </span>
        <p className="mt-2 text-xs text-muted-foreground">
          {isDone ? "Time\u2019s up" : isRunning ? "tap to pause" : "tap to resume"}
        </p>
      </button>

      {/* Progress track — taller, more visible */}
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-1000"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={reset}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80"
          aria-label="Reset"
        >
          <RotateCcw className="h-4 w-4 text-muted-foreground" />
        </button>

        <button
          onClick={handleToggle}
          disabled={isDone}
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full transition-all",
            isDone
              ? "cursor-not-allowed bg-muted opacity-30"
              : "bg-foreground text-background shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:opacity-90 active:scale-95"
          )}
          aria-label={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? (
            <Pause className="h-5 w-5" fill="currentColor" />
          ) : (
            <Play className="ml-1 h-5 w-5" fill="currentColor" />
          )}
        </button>

        <div className="h-11 w-11" aria-hidden />
      </div>

      {isDone && (
        <p className="mt-4 text-center text-sm font-semibold text-foreground">
          Time&apos;s up — moving on
        </p>
      )}
    </div>
  );
}
