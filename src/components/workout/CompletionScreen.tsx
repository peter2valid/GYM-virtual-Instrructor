"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, RotateCcw, ArrowRight, Clock, Zap, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { saveWorkoutSession } from "@/features/sessions/actions";
import { useWorkoutSessionStore } from "@/stores/workout-session-store";
import { useHaptic } from "@/hooks/useHaptic";
import type { Workout } from "@/types";

interface CompletionScreenProps {
  workout: Workout;
  gymSlug: string;
  onRestart: () => void;
}

const HEADLINES = [
  "You crushed it.",
  "That's a W.",
  "Beast mode: activated.",
  "Another one done.",
  "No days off.",
  "Keep showing up.",
];

export function CompletionScreen({
  workout,
  gymSlug,
  onRestart,
}: CompletionScreenProps) {
  const { startedAt } = useWorkoutSessionStore();
  const [saved, setSaved] = useState<boolean | null>(null);
  const haptic = useHaptic();

  const headline = HEADLINES[Math.floor(Math.random() * HEADLINES.length)];

  const durationSeconds = startedAt
    ? Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)
    : null;

  const durationLabel = durationSeconds
    ? durationSeconds >= 60
      ? `${Math.round(durationSeconds / 60)} min`
      : `${durationSeconds}s`
    : `${workout.estimatedMinutes ?? "—"} min`;

  const stepCount = workout.stepCount ?? workout.steps.length;

  // Confetti + haptic on mount
  useEffect(() => {
    haptic.success();
    import("canvas-confetti").then(({ default: confetti }) => {
      // First burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#7c3aed", "#a78bfa", "#10b981", "#fbbf24", "#f43f5e"],
      });
      // Second burst with slight delay for a "wow" effect
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.65 },
          colors: ["#7c3aed", "#fbbf24", "#10b981"],
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.65 },
          colors: ["#a78bfa", "#f43f5e", "#fbbf24"],
        });
      }, 300);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save session
  useEffect(() => {
    if (!workout.tenantId || !startedAt) {
      setSaved(false);
      return;
    }
    saveWorkoutSession({
      workoutId: workout.id,
      tenantId: workout.tenantId,
      startedAt,
      totalDurationSeconds: durationSeconds ?? 0,
    })
      .then((result) => setSaved(result !== null))
      .catch(() => setSaved(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleShare() {
    const text = `Just completed "${workout.title}" — ${durationLabel} 💪 #VirtualGYM`;
    if (navigator.share) {
      await navigator.share({ text }).catch(() => null);
    } else {
      await navigator.clipboard.writeText(text).catch(() => null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 pb-12">
      <motion.div
        className="w-full max-w-sm space-y-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Trophy icon — bounces in */}
        <motion.div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg"
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 14 }}
        >
          <Trophy className="h-10 w-10" strokeWidth={1.5} />
        </motion.div>

        {/* Headline + subtitle */}
        <motion.div
          className="space-y-2 text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {headline}
          </h1>
          <p className="text-base text-muted-foreground">{workout.title}</p>
          {saved === true && (
            <p className="text-xs font-medium text-primary">✓ Saved to your history</p>
          )}
        </motion.div>

        {/* Stats grid */}
        <motion.div
          className="grid grid-cols-3 gap-2.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatCard
            value={durationLabel}
            label="Time"
            icon={<Clock className="h-4 w-4 text-muted-foreground/60" />}
          />
          {stepCount > 0 && (
            <StatCard
              value={String(stepCount)}
              label="Exercises"
              icon={<Zap className="h-4 w-4 text-muted-foreground/60" />}
            />
          )}
          <StatCard
            value={workout.category}
            label="Focus"
          />
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-col gap-2.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link
            href={`/g/${gymSlug}/workouts`}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            Browse Workouts
            <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onRestart}
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent active:scale-[0.98]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Repeat
            </button>
            <button
              onClick={handleShare}
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent active:scale-[0.98]"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          </div>

          {saved === true && (
            <Link
              href={`/g/${gymSlug}/history`}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent active:scale-[0.98]"
            >
              View History
            </Link>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-4 text-center">
      {icon && <div className="mb-1 flex justify-center">{icon}</div>}
      <p className="text-lg font-bold leading-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
