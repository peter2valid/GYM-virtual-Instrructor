"use client";

import { useState, useMemo } from "react";
import { Search, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WorkoutCard } from "./WorkoutCard";
import { CategoryPills } from "./CategoryPills";
import { cn } from "@/lib/utils/cn";
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

  const filtered = useMemo(() => {
    return workouts.filter((w) => {
      const matchesCategory = activeCategory === "All" || w.category === activeCategory;
      const matchesSearch =
        !q ||
        w.title.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q) ||
        (w.description ?? "").toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [workouts, activeCategory, q]);

  // Highlight first workout if in "All" and no search
  const showFeatured = activeCategory === "All" && !q && filtered.length > 0;
  const featured = showFeatured ? filtered[0] : null;
  const standardList = showFeatured ? filtered.slice(1) : filtered;

  return (
    <div className="space-y-10">
      {/* ── Search & Filter ────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search workouts or focus areas…"
            className="h-14 w-full rounded-[1.25rem] bg-card pl-12 pr-12 text-[15px] font-bold text-foreground placeholder:text-muted-foreground/30 shadow-badge ring-1 ring-border/5 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground active:scale-90"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <CategoryPills
          categories={categories}
          activeCategory={activeCategory}
          onSelect={(cat) => { setActiveCategory(cat); setQuery(""); }}
        />
      </div>

      {/* ── Results ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory + q}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {filtered.length === 0 ? (
            <div className="rounded-[2.5rem] bg-card px-6 py-16 text-center shadow-badge">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/5 text-primary/20">
                <Search className="h-8 w-8" />
              </div>
              <p className="text-lg font-black text-foreground">No matches found</p>
              <p className="mt-1 text-sm text-muted-foreground/60">
                {q ? `Try searching for something else than "${query}"` : "This selection is empty for now"}
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Featured Card */}
              {featured && (
                <div className="space-y-4">
                  <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary">
                    <Sparkles className="h-3 w-3 fill-current" />
                    Recommended For You
                  </h2>
                  <WorkoutCard workout={featured} gymSlug={gymSlug} />
                </div>
              )}

              {/* Standard List */}
              <div className="space-y-6">
                {!q && standardList.length > 0 && (
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    Latest {activeCategory !== "All" ? activeCategory : ""} Workouts
                  </h2>
                )}
                <div className="space-y-4">
                  {standardList.map((workout, i) => (
                    <motion.div
                      key={workout.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <WorkoutCard workout={workout} gymSlug={gymSlug} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
