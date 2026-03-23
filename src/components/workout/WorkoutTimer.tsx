"use client";

import { useEffect, useMemo } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
      const id = setTimeout(onComplete, 1000); // Slightly more delay for satisfaction
      return () => clearTimeout(id);
    }
  }, [isDone, onComplete]);

  const progress = durationSeconds > 0 ? seconds / durationSeconds : 1;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display =
    mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : String(seconds);

  // SVG ring properties
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  function handleToggle() {
    if (isDone) return;
    isRunning ? pause() : start();
  }

  return (
    <div className="flex flex-col items-center justify-center py-6">
      {/* Timer Container with pulsing effect when running */}
      <div className="relative flex h-64 w-64 items-center justify-center">
        {/* Anchor plate — grounds the timer visually */}
        <div className="absolute inset-6 rounded-full bg-card shadow-[0_2px_20px_rgba(0,0,0,0.06)]" />
        {/* Shadow & Glow */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 0.15 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-primary"
            />
          )}
        </AnimatePresence>

        {/* SVG Ring */}
        <svg className="h-full w-full -rotate-90 transform overflow-visible">
          {/* Background Ring */}
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted/20"
          />
          {/* Progress Ring */}
          <motion.circle
            cx="128"
            cy="128"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            className="text-primary transition-all duration-300 ease-linear"
            animate={{ strokeDashoffset }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>

        {/* Central Display */}
        <button
          onClick={handleToggle}
          disabled={isDone}
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center rounded-full transition-all active:scale-95",
            isDone ? "cursor-default" : "cursor-pointer"
          )}
        >
          <motion.span
            key={display}
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "text-[5rem] font-black tabular-nums tracking-tighter leading-none",
              isDone ? "text-muted-foreground/30" : "text-foreground"
            )}
          >
            {display}
          </motion.span>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            {isDone ? "Done!" : isRunning ? "Pause" : "Start"}
          </p>
        </button>
      </div>

      {/* Control Buttons */}
      <div className="mt-6 flex items-center gap-6">
        <button
          onClick={reset}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-90"
          aria-label="Reset"
        >
          <RotateCcw className="h-5 w-5" />
        </button>

        <button
          onClick={handleToggle}
          disabled={isDone}
          className={cn(
            "flex h-20 w-20 items-center justify-center rounded-full transition-all shadow-xl",
            isDone
              ? "bg-muted opacity-30 cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:scale-105 active:scale-95 hover:shadow-primary/20"
          )}
        >
          {isRunning ? (
            <Pause className="h-8 w-8 fill-current" />
          ) : (
            <Play className="ml-1 h-8 w-8 fill-current" />
          )}
        </button>

        <div className="w-12" aria-hidden /> {/* Spacer for symmetry */}
      </div>

      {isDone && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 font-bold text-primary"
        >
          Great job! Take a breath.
        </motion.p>
      )}
    </div>
  );
}
