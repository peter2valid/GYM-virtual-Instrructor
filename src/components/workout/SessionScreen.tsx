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
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      {/* ── Immersive Media Area ────────────────────────────────────── */}
      <div className="relative h-[48vh] w-full overflow-hidden bg-muted/20">
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

        {/* Bottom Gradient for readability on content below */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
      </div>

      {/* ── Content Area ───────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col -mt-8 relative z-10 rounded-t-[2.5rem] bg-background">
        <div className="mx-auto w-full max-w-xl px-6 pt-8 pb-32">
          {/* Progress Bar (Integrated) */}
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
              className="space-y-8"
            >
              {/* Step info */}
              <div className="space-y-4 text-center">
                <h1 className="text-3xl font-black tracking-tight text-foreground leading-tight px-4">
                  {currentStep.title}
                </h1>
                {currentStep.description && (
                  <p className="text-base leading-relaxed text-muted-foreground max-w-sm mx-auto">
                    {currentStep.description}
                  </p>
                )}
              </div>

              {/* Interaction Area (Timer or Stats) */}
              <div className="py-2">
                {currentStep.durationSeconds !== null ? (
                  <WorkoutTimer
                    key={`timer-${stepIndex}`}
                    durationSeconds={currentStep.durationSeconds}
                    onComplete={handleNext}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-4">
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
              </div>
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
                : "bg-card shadow-badge ring-1 ring-border leading-none active:scale-90"
            )}
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={3} />
          </button>

          <button
            onClick={handleNext}
            className="flex h-16 flex-1 items-center justify-center gap-3 rounded-[1.25rem] bg-primary text-[15px] font-black tracking-wide text-primary-foreground shadow-pill shadow-primary/25 transition-all active:scale-[0.98] hover:shadow-primary/35"
          >
            {isLast ? "FINISH" : "NEXT STEP"}
            <ChevronRight className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
