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
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { CATEGORY_ICON_MAP } from "@/lib/utils/workout-ui";
import { StepProgress } from "./StepProgress";
import { WorkoutTimer } from "./WorkoutTimer";
import { CompletionScreen } from "./CompletionScreen";
import { useWorkoutSessionStore } from "@/stores/workout-session-store";
import { useHaptic } from "@/hooks/useHaptic";
import type { Workout } from "@/types";

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

/** Format seconds into a human-readable timer string: "45" or "2:30" */
function fmtDuration(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : String(total);
}

export function SessionScreen({ workout, gymSlug }: SessionScreenProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>(1);
  const [isComplete, setIsComplete] = useState(false);
  /** Whether the user has explicitly launched the timer for the current step */
  const [timerStarted, setTimerStarted] = useState(false);

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
      setTimerStarted(false);
      storeNext();
    }
  }

  function handlePrev() {
    if (!isFirst) {
      haptic.tap();
      setDirection(-1);
      setStepIndex((i) => i - 1);
      setTimerStarted(false);
    }
  }

  function handleRestart() {
    setIsComplete(false);
    setStepIndex(0);
    setDirection(1);
    setTimerStarted(false);
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

  const hasTimer = currentStep.durationSeconds !== null;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background selection:bg-primary/20">
      {/* ── Immersive Media Area ────────────────────────────────────── */}
      <div className="relative w-full flex-none overflow-hidden bg-muted/20" style={{ height: "min(38vh, 280px)" }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full w-full"
          >
            {currentStep.mediaUrl ? (
              <img
                src={currentStep.mediaUrl}
                alt={currentStep.title}
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-primary/10 via-background to-background">
                <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-card shadow-pill">
                  <IconComponent className="h-12 w-12 text-primary" strokeWidth={1.5} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                  {workout.category}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Floating Glass Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-6">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-xl transition-all active:scale-90"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center">
              <span className="rounded-full bg-black/40 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white/90 shadow-sm border border-white/10">
                STEP {stepIndex + 1} OF {steps.length}
              </span>
            </div>
            <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-xl transition-all active:scale-90">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Bottom Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
      </div>

      {/* ── Content Area ───────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col -mt-6 relative z-10 rounded-t-[2rem] bg-background min-h-0">
        <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-6 pt-6 pb-28" style={{ scrollbarWidth: "none" }}>
          {/* Progress Bar */}
          <div className="mb-8">
            <StepProgress current={stepIndex} total={steps.length} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Step info */}
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-black tracking-tight text-foreground leading-tight px-2">
                  {currentStep.title}
                </h1>
                {currentStep.description && (
                  <p className="text-sm leading-relaxed text-muted-foreground max-w-sm mx-auto">
                    {currentStep.description}
                  </p>
                )}
              </div>

              {/* ── Interaction Area ─────────────────────────────── */}
              {hasTimer ? (
                /* TIMER STEPS: preview → timer */
                <AnimatePresence mode="wait">
                  {!timerStarted ? (
                    /* Preview: show duration + START NOW */
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center gap-6 pt-2"
                    >
                      {/* Duration bubble */}
                      <div className="flex flex-col items-center gap-1 rounded-[2rem] bg-card ring-1 ring-border/40 shadow-badge px-10 py-5">
                        <span className="text-[4rem] font-black tabular-nums tracking-tighter leading-none text-foreground">
                          {fmtDuration(currentStep.durationSeconds!)}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                          {currentStep.durationSeconds! >= 60 ? "minutes" : "seconds"}
                        </span>
                      </div>

                      {/* START NOW button */}
                      <button
                        onClick={() => { haptic.tap(); setTimerStarted(true); }}
                        className="tap-bounce flex h-16 w-full items-center justify-center gap-3 rounded-[1.25rem] bg-primary text-[15px] font-black tracking-wide text-primary-foreground shadow-pill shadow-primary/30 transition-all hover:-translate-y-0.5"
                      >
                        <Play className="h-6 w-6 fill-current" />
                        START NOW
                      </button>
                    </motion.div>
                  ) : (
                    /* Timer running */
                    <motion.div
                      key="timer"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                      <WorkoutTimer
                        key={`timer-${stepIndex}`}
                        durationSeconds={currentStep.durationSeconds!}
                        onComplete={handleNext}
                        autoStart={true}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : (
                /* REPS/SETS STEPS: just show the counts */
                <div className="grid grid-cols-2 gap-4 py-2">
                  {currentStep.reps !== null && (
                    <div className="rounded-3xl bg-secondary/50 p-6 text-center ring-1 ring-border/50">
                      <p className="text-4xl font-black text-foreground">{currentStep.reps}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Reps</p>
                    </div>
                  )}
                  {currentStep.sets !== null && (
                    <div className="rounded-3xl bg-secondary/50 p-6 text-center ring-1 ring-border/50">
                      <p className="text-4xl font-black text-foreground">{currentStep.sets}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Sets</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Navigation Controls (Floating Bar) ───────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pt-2 pb-8 bg-gradient-to-t from-background via-background to-transparent">
        <div className="mx-auto flex max-w-lg items-center gap-4">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-[1.25rem] transition-all",
              isFirst
                ? "opacity-20 bg-muted cursor-not-allowed"
                : "bg-card shadow-pill ring-1 ring-border/50 hover:-translate-y-0.5 active:scale-90"
            )}
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={3} />
          </button>

          <button
            onClick={handleNext}
            className="flex h-16 flex-1 items-center justify-center gap-3 rounded-[1.25rem] bg-primary text-[15px] font-black tracking-wide text-primary-foreground shadow-pill shadow-primary/30 transition-all active:scale-[0.97] hover:shadow-primary/40 hover:-translate-y-0.5"
          >
            {isLast ? "FINISH" : "NEXT STEP"}
            <ChevronRight className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
