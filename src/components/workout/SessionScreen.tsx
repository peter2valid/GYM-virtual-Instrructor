"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  Dumbbell,
  Activity,
  Zap,
  Heart,
  Target,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { CATEGORY_ICON_MAP } from "@/lib/utils/workout-ui";
import { StepProgress } from "./StepProgress";
import { WorkoutTimer } from "./WorkoutTimer";
import { CompletionScreen } from "./CompletionScreen";
import { useWorkoutSessionStore } from "@/stores/workout-session-store";
import { useHaptic } from "@/hooks/useHaptic";
import type { Workout, WorkoutStep } from "@/types";

const ICONS = {
  Flame,
  Dumbbell,
  Activity,
  Zap,
  Heart,
  Target,
} as const;

interface SessionScreenProps {
  workout: Workout;
  gymSlug: string;
}

type Direction = 1 | -1;

export function SessionScreen({ workout, gymSlug }: SessionScreenProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>(1);
  const [isComplete, setIsComplete] = useState(false);

  const { startSession, nextStep: storeNext, completeSession } =
    useWorkoutSessionStore();
  const haptic = useHaptic();

  useEffect(() => {
    startSession(workout.id, workout.steps.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout.id]);

  const steps = workout.steps.slice().sort((a, b) => a.order - b.order);
  const currentStep = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const iconName = CATEGORY_ICON_MAP[workout.category];
  const IconComponent = ICONS[iconName as keyof typeof ICONS] ?? Dumbbell;

  function handleNext() {
    haptic.tap();
    if (isLast) {
      haptic.success();
      completeSession();
      setIsComplete(true);
    } else {
      setDirection(1);
      setStepIndex((i) => i + 1);
      storeNext();
    }
  }

  function handlePrev() {
    if (!isFirst) {
      haptic.tap();
      setDirection(-1);
      setStepIndex((i) => i - 1);
    }
  }

  function handleRestart() {
    setIsComplete(false);
    setStepIndex(0);
    setDirection(1);
    startSession(workout.id, workout.steps.length);
  }

  if (isComplete) {
    return (
      <CompletionScreen
        workout={workout}
        gymSlug={gymSlug}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {workout.title}
            </p>
            <p className="text-xs text-muted-foreground">
              Step {stepIndex + 1} of {steps.length}
            </p>
          </div>
        </div>
        <div className="px-4 pb-3">
          <StepProgress current={stepIndex} total={steps.length} />
        </div>
      </header>

      {/* Animated step content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, x: direction * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -28 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex flex-1 flex-col"
          >
            {/* Media area — GIF/image if available, styled placeholder otherwise */}
            <div className="relative flex h-52 items-center justify-center overflow-hidden border-b border-border bg-muted/20">
              {currentStep.mediaUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentStep.mediaUrl}
                    alt={currentStep.title}
                    className="h-full w-full object-contain"
                    loading="eager"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/10 to-transparent" />
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-muted/60 via-muted/30 to-background/0 px-6">
                  {/* Category icon — full opacity, primary-tinted */}
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-border bg-card shadow-sm">
                    <IconComponent
                      className="h-9 w-9 text-primary"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                      {currentStep.title}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                      {workout.category}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Step content */}
            <div className="mx-auto w-full max-w-lg flex-1 space-y-5 px-4 py-6">
              <StepInfo step={currentStep} />

              {currentStep.durationSeconds !== null ? (
                <WorkoutTimer
                  key={`timer-${stepIndex}`}
                  durationSeconds={currentStep.durationSeconds}
                  onComplete={handleNext}
                />
              ) : (
                <StepMeta step={currentStep} />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky bottom nav */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className={cn(
              "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-border transition-colors",
              isFirst
                ? "cursor-not-allowed opacity-25"
                : "hover:bg-accent active:scale-95"
            )}
            aria-label="Previous step"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={handleNext}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            {isLast ? (
              "Complete Workout"
            ) : (
              <>
                Next Step
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepInfo({ step }: { step: WorkoutStep }) {
  const pill =
    step.reps !== null
      ? `${step.reps} reps${step.sets ? ` × ${step.sets}` : ""}`
      : step.durationSeconds !== null
        ? fmtDuration(step.durationSeconds)
        : null;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold leading-snug text-foreground">
          {step.title}
        </h2>
        {pill && (
          <span className="mt-0.5 flex-shrink-0 rounded-lg border border-border bg-muted px-2.5 py-1 text-sm font-semibold text-foreground">
            {pill}
          </span>
        )}
      </div>
      {step.description && (
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {step.description}
        </p>
      )}
    </div>
  );
}

function StepMeta({ step }: { step: WorkoutStep }) {
  const items = [
    step.reps !== null && { label: "Reps", value: String(step.reps) },
    step.sets !== null && { label: "Sets", value: String(step.sets) },
    step.restSeconds !== null && {
      label: "Rest",
      value: `${step.restSeconds}s`,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-card px-3 py-3.5 text-center"
        >
          <p className="text-xl font-bold text-foreground">{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

function fmtDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0 && sec > 0) return `${m}m ${sec}s`;
  if (m > 0) return `${m} min`;
  return `${s}s`;
}
