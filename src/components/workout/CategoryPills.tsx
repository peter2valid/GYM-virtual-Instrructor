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
              "tap-bounce flex-shrink-0 flex items-center gap-2 rounded-2xl px-5 py-3 text-[14px] font-black transition-all duration-[150ms]",
              isActive
                ? "bg-primary text-primary-foreground shadow-pill ring-2 ring-primary/20"
                : "bg-background text-muted-foreground/80 ring-1 ring-border/50 hover:ring-border hover:text-foreground hover:bg-muted/40"
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
