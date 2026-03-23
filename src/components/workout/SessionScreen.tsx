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
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-colors hover:bg-muted"
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
            {/* Media area — taller, more immersive */}
            <div className="relative flex h-64 items-center justify-center overflow-hidden bg-muted/30">
              {currentStep.mediaUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentStep.mediaUrl}
                    alt={currentStep.title}
                    className="h-full w-full object-contain"
                    loading="eager"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-muted/50 via-muted/20 to-background/0">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-card shadow-[0_2px_12px_rgba(0,0,0,0.1)]">
                    <IconComponent
                      className="h-11 w-11 text-primary"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {workout.category}
                  </p>
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
      <div className="sticky bottom-0 bg-background/95 px-4 py-4 backdrop-blur border-t border-border/50">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className={cn(
              "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
              isFirst
                ? "cursor-not-allowed opacity-25 bg-muted"
                : "bg-card shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:bg-muted active:scale-95"
            )}
            aria-label="Previous step"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={handleNext}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            {isLast ? (
              "Complete Workout"
            ) : (
              <>
                Next Step
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
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
        <h2 className="text-2xl font-bold leading-snug text-foreground">
          {step.title}
        </h2>
        {pill && (
          <span className="mt-1 flex-shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
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
          className="rounded-2xl bg-card px-3 py-4 text-center shadow-[0_1px_4px_rgba(0,0,0,0.07)]"
        >
          <p className="text-2xl font-bold text-foreground">{value}</p>
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
