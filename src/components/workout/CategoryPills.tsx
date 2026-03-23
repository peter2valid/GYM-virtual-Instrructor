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
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {all.map((cat) => {
        const isActive = cat === activeCategory;
        const IconComponent = cat !== "All" ? getCategoryIcon(cat) : null;
        
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 rounded-2xl px-5 py-3 text-[14px] font-black transition-all duration-[150ms] active:scale-[0.96]",
              isActive
                ? "bg-primary text-primary-foreground shadow-pill shadow-primary/20 scale-105"
                : "bg-card text-muted-foreground/60 shadow-badge ring-1 ring-border/5 hover:text-foreground hover:bg-muted/50"
            )}
          >
            {IconComponent && (
              <IconComponent className={cn(
                "h-4 w-4",
                isActive ? "text-primary-foreground" : "text-primary/40"
              )} strokeWidth={2.5} />
            )}
            {cat}
          </button>
        );
      })}
    </div>
  );
}
