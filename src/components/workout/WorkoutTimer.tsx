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
    <div className="flex flex-col items-center justify-center gap-5 py-2">
      {/* ── Play / Pause / Done button — ABOVE the ring ── */}
      <button
        onClick={handleToggle}
        disabled={isDone}
        className={cn(
          "flex h-16 w-full max-w-xs items-center justify-center gap-3 rounded-[1.25rem] text-[15px] font-black tracking-widest transition-all shadow-xl active:scale-[0.97]",
          isDone
            ? "bg-muted text-muted-foreground/40 cursor-default"
            : isRunning
            ? "bg-card ring-1 ring-border text-foreground hover:-translate-y-0.5"
            : "bg-primary text-primary-foreground shadow-primary/30 hover:-translate-y-0.5"
        )}
      >
        {isDone ? (
          "✓  Done!"
        ) : isRunning ? (
          <><Pause className="h-5 w-5 fill-current" />PAUSE</>
        ) : (
          <><Play className="ml-0.5 h-5 w-5 fill-current" />RESUME</>
        )}
      </button>

      {/* ── Timer ring ── */}
      <div className="relative flex h-56 w-56 items-center justify-center">
        {/* Pulsing glow — sits below everything via DOM order */}
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

        {/* SVG Ring — the anchor plate circle lives INSIDE the SVG so it
            is painted behind the rings but above the background */}
        <svg viewBox="0 0 256 256" className="h-full w-full -rotate-90 overflow-visible">
          <circle cx="128" cy="128" r="80" className="fill-card" />
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

        {/* Central Display — time only, no tap target */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full pointer-events-none">
          <motion.span
            key={display}
            initial={{ scale: 0.92, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "text-[4.5rem] font-black tabular-nums tracking-tighter leading-none",
              isDone ? "text-muted-foreground/30" : "text-foreground"
            )}
          >
            {display}
          </motion.span>
          <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
            {isDone ? "Complete" : "seconds"}
          </p>
        </div>
      </div>

      {/* Reset button — below ring */}
      <button
        onClick={reset}
        className="flex h-10 items-center gap-2 rounded-xl px-4 text-[12px] font-bold text-muted-foreground/50 transition-colors hover:text-muted-foreground active:scale-95"
        aria-label="Reset timer"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset
      </button>

      {isDone && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-bold text-primary"
        >
          Great job! Take a breath. 🔥
        </motion.p>
      )}
    </div>
  );
}
