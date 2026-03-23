"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WorkoutCard } from "./WorkoutCard";
import { CategoryPills } from "./CategoryPills";
import type { Workout, WorkoutCategory } from "@/types";

interface WorkoutsListProps {
  workouts: Workout[];
  gymSlug: string;
  categories: WorkoutCategory[];
  initialCategory?: WorkoutCategory | "All";
}

export function WorkoutsList({
  workouts,
  gymSlug,
  categories,
  initialCategory = "All",
}: WorkoutsListProps) {
  const [activeCategory, setActiveCategory] = useState<WorkoutCategory | "All">(
    initialCategory
  );
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const filtered = workouts.filter((w) => {
    const matchesCategory = activeCategory === "All" || w.category === activeCategory;
    const matchesSearch =
      !q ||
      w.title.toLowerCase().includes(q) ||
      w.category.toLowerCase().includes(q) ||
      (w.description ?? "").toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search workouts…"
          className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <CategoryPills
        categories={categories}
        activeCategory={activeCategory}
        onSelect={(cat) => { setActiveCategory(cat); setQuery(""); }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory + q}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-2"
        >
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {q ? `No workouts matching "${query}".` : "No workouts in this category yet."}
              </p>
            </div>
          ) : (
            filtered.map((workout, i) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: i * 0.04, ease: "easeOut" }}
              >
                <WorkoutCard workout={workout} gymSlug={gymSlug} />
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
