"use client";

import { cn } from "@/lib/utils/cn";
import { getCategoryIcon } from "@/lib/utils/gym-icons";
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
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {all.map((cat) => {
        const isActive = cat === activeCategory;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-[120ms] active:scale-[0.96]",
              isActive
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "bg-card text-muted-foreground shadow-[0_1px_3px_rgba(0,0,0,0.07)] hover:text-foreground"
            )}
          >
            {cat !== "All" && (() => {
              const Icon = getCategoryIcon(cat);
              return <Icon className="h-3.5 w-3.5 text-current" />;
            })()}
            {cat}
          </button>
        );
      })}
    </div>
  );
}
