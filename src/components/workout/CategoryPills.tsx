"use client";

import { cn } from "@/lib/utils/cn";
import type { WorkoutCategory } from "@/types";

interface CategoryPillsProps {
  categories: WorkoutCategory[];
  activeCategory: WorkoutCategory | "All";
  onSelect: (cat: WorkoutCategory | "All") => void;
}

export function CategoryPills({
  categories,
  activeCategory,
  onSelect,
}: CategoryPillsProps) {
  const all = ["All", ...categories] as (WorkoutCategory | "All")[];

  return (
    <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {all.map((cat) => {
        const isActive = cat === activeCategory;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={cn(
              "flex-shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-all duration-[120ms] active:scale-[0.96]",
              isActive
                ? "border-primary/40 bg-primary/10 font-medium text-primary"
                : "border-border text-muted-foreground hover:border-border/60 hover:text-foreground"
            )}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
