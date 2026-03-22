"use client";

import { useState } from "react";
import { deleteWorkout } from "@/features/workouts/admin-actions";
import { useRouter } from "next/navigation";

export function DeleteWorkoutButton({
  workoutId,
  workoutTitle,
}: {
  workoutId: string;
  workoutTitle: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await deleteWorkout(workoutId);
    router.refresh();
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1 text-xs">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="font-medium text-destructive hover:underline disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Confirm"}
        </button>
        <span className="text-muted-foreground">/</span>
        <button
          onClick={() => setConfirming(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title={`Delete ${workoutTitle}`}
      className="text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
    >
      Delete
    </button>
  );
}
