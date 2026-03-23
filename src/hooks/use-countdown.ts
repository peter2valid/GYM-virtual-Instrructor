"use client";

import { useState, useEffect } from "react";

interface UseCountdownReturn {
  seconds: number;
  isRunning: boolean;
  isDone: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export function useCountdown(
  initialSeconds: number,
  options?: { autoStart?: boolean }
): UseCountdownReturn {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(options?.autoStart ?? false);

  // Reset when initialSeconds changes (new step loaded)
  useEffect(() => {
    setIsRunning(options?.autoStart ?? false);
    setSeconds(initialSeconds);
  }, [initialSeconds, options?.autoStart]);


  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning]);

  return {
    seconds,
    isRunning,
    isDone: seconds === 0,
    start: () => {
      if (seconds > 0) setIsRunning(true);
    },
    pause: () => setIsRunning(false),
    reset: () => {
      setIsRunning(false);
      setSeconds(initialSeconds);
    },
  };
}
