import { create } from "zustand";

interface TimerState {
  seconds: number;
  isRunning: boolean;
  mode: "countdown" | "stopwatch";
  initialSeconds: number;

  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  setCountdown: (seconds: number) => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  seconds: 0,
  isRunning: false,
  mode: "stopwatch",
  initialSeconds: 0,

  start: () => set({ isRunning: true }),
  pause: () => set({ isRunning: false }),

  reset: () => {
    const { mode, initialSeconds } = get();
    set({
      isRunning: false,
      seconds: mode === "countdown" ? initialSeconds : 0,
    });
  },

  tick: () => {
    const { mode, seconds, isRunning } = get();
    if (!isRunning) return;

    if (mode === "countdown") {
      if (seconds <= 0) {
        set({ isRunning: false, seconds: 0 });
      } else {
        set({ seconds: seconds - 1 });
      }
    } else {
      set({ seconds: seconds + 1 });
    }
  },

  setCountdown: (seconds: number) => {
    set({
      mode: "countdown",
      seconds,
      initialSeconds: seconds,
      isRunning: false,
    });
  },
}));
