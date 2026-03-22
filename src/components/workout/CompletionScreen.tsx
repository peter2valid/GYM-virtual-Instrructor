"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, RotateCcw, ArrowRight, Clock } from "lucide-react";
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

export function CompletionScreen({
  workout,
  gymSlug,
  onRestart,
}: CompletionScreenProps) {
  const { startedAt } = useWorkoutSessionStore();
  const [saved, setSaved] = useState<boolean | null>(null); // null=saving, true=saved, false=skipped/anon
  const haptic = useHaptic();

  const durationSeconds = startedAt
    ? Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)
    : null;

  const durationLabel = durationSeconds
    ? durationSeconds >= 60
      ? `${Math.round(durationSeconds / 60)} min`
      : `${durationSeconds}s`
    : `${workout.estimatedMinutes ?? "—"} min`;

  // Fire confetti + haptic on mount (reward psychology)
  useEffect(() => {
    haptic.success();
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.55 },
        colors: ["#7c3aed", "#a78bfa", "#ddd6fe", "#10b981", "#fbbf24"],
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save when completion screen mounts
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 pb-12">
      <motion.div
        className="w-full max-w-sm space-y-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* Icon */}
        <motion.div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 18 }}
        >
          <CheckCircle2 className="h-7 w-7 text-foreground" strokeWidth={1.5} />
        </motion.div>

        {/* Text */}
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-foreground">Workout complete</h1>
          <p className="text-[15px] text-muted-foreground">{workout.title}</p>
          {saved === true && (
            <p className="text-xs text-muted-foreground">✓ Saved to your history</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard value={String(workout.steps.length)} label="Steps" />
          <StatCard
            value={durationLabel}
            label="Duration"
            icon={<Clock className="mb-0.5 h-3.5 w-3.5 text-muted-foreground/60" />}
          />
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2.5">
          <Link
            href={`/g/${gymSlug}/workouts`}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Browse Workouts
            <ArrowRight className="h-4 w-4" />
          </Link>
          {saved === true && (
            <Link
              href={`/g/${gymSlug}/history`}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              View History
            </Link>
          )}
          <button
            onClick={onRestart}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <RotateCcw className="h-4 w-4" />
            Repeat Workout
          </button>
        </div>
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
    <div className="rounded-xl border border-border bg-card px-4 py-4 text-center">
      {icon && <div className="flex justify-center">{icon}</div>}
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
