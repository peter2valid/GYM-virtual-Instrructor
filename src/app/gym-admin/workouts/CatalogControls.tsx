"use client";

import { useState, useTransition } from "react";
import { updateCatalogPreference } from "@/features/workouts/catalog-actions";

interface Props {
  workoutId: string;
  isQuickStart: boolean;
  isRecommended: boolean;
  displayOrder: number;
}

export function CatalogControls({
  workoutId,
  isQuickStart,
  isRecommended,
}: Pick<Props, "workoutId" | "isQuickStart" | "isRecommended">) {
  const [quickStart, setQuickStart] = useState(isQuickStart);
  const [recommended, setRecommended] = useState(isRecommended);
  const [isPending, startTransition] = useTransition();

  async function toggle(field: "is_quick_start" | "is_recommended", value: boolean) {
    startTransition(async () => {
      await updateCatalogPreference(workoutId, { [field]: value });
    });
  }

  return (
    <div
      className={`flex items-center gap-3 transition-opacity ${isPending ? "opacity-50" : ""}`}
    >
      {/* Quick Start toggle */}
      <button
        title="Show in Quick Start section"
        onClick={() => {
          const next = !quickStart;
          setQuickStart(next);
          toggle("is_quick_start", next);
        }}
        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
          quickStart
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        ⚡ Quick
      </button>

      {/* Featured toggle */}
      <button
        title="Show in Featured section"
        onClick={() => {
          const next = !recommended;
          setRecommended(next);
          toggle("is_recommended", next);
        }}
        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
          recommended
            ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        ★ Featured
      </button>
    </div>
  );
}
