import { create } from "zustand";

export type SessionPhase = "idle" | "active" | "rest" | "completed";

interface WorkoutSessionState {
  sessionId: string | null;
  workoutId: string | null;
  currentStepIndex: number;
  totalSteps: number;
  phase: SessionPhase;
  startedAt: string | null;

  startSession: (workoutId: string, totalSteps: number) => void;
  nextStep: () => void;
  completeSession: () => void;
  resetSession: () => void;
}

export const useWorkoutSessionStore = create<WorkoutSessionState>(
  (set, get) => ({
    sessionId: null,
    workoutId: null,
    currentStepIndex: 0,
    totalSteps: 0,
    phase: "idle",
    startedAt: null,

    startSession: (workoutId, totalSteps) => {
      set({
        workoutId,
        totalSteps,
        currentStepIndex: 0,
        phase: "active",
        startedAt: new Date().toISOString(),
      });
    },

    nextStep: () => {
      const { currentStepIndex, totalSteps } = get();
      if (currentStepIndex + 1 >= totalSteps) {
        set({ phase: "completed" });
      } else {
        set({ currentStepIndex: currentStepIndex + 1 });
      }
    },

    completeSession: () => {
      set({ phase: "completed" });
    },

    resetSession: () => {
      set({
        sessionId: null,
        workoutId: null,
        currentStepIndex: 0,
        totalSteps: 0,
        phase: "idle",
        startedAt: null,
      });
    },
  })
);
