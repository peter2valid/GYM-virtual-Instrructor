"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X, Sparkles, Dumbbell, ChevronRight, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WorkoutCard } from "./WorkoutCard";
import { CategoryPills } from "./CategoryPills";
import { cn } from "@/lib/utils/cn";
import { useAllExercises } from "@/lib/exercises/queries";
import { exerciseLoopUrl } from "@/lib/exercises/url";
import { searchExercises, getSuggestions } from "@/lib/exercises/search";
import type { Workout, WorkoutCategory } from "@/types";

interface WorkoutsListProps {
  workouts: Workout[];
  gymSlug: string;
  categories: WorkoutCategory[];
  initialCategory?: WorkoutCategory | "All";
}

const LEVEL_COLOR: Record<string, string> = {
  beginner:     "bg-green-500/10 text-green-600",
  intermediate: "bg-orange-500/10 text-orange-600",
  advanced:     "bg-red-500/10 text-red-600",
  expert:       "bg-red-500/10 text-red-600",
};

export function WorkoutsList({
  workouts,
  gymSlug,
  categories,
  initialCategory = "All",
}: WorkoutsListProps) {
  const [activeCategory, setActiveCategory] = useState<WorkoutCategory | "All">(initialCategory);
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);

  // Preload all 900 exercises on mount — cached forever, search is instant after
  const { data: allExercises, isLoading: exercisesLoading } = useAllExercises();

  const q = query.trim().toLowerCase();
  const isSearching = q.length >= 2;

  // Autocomplete suggestions
  const suggestions = useMemo(() => getSuggestions(q.length >= 1 ? query.trim() : ""), [query]);

  // Smart search — instant client-side once cache is loaded
  const searchResult = useMemo(() => {
    if (!isSearching || !allExercises) return null;
    return searchExercises(allExercises, query.trim());
  }, [allExercises, query, isSearching]);

  // Workout filter for browse mode (not searching)
  const filteredWorkouts = useMemo(() => {
    return workouts.filter((w) => activeCategory === "All" || w.category === activeCategory);
  }, [workouts, activeCategory]);

  // Featured workout for the hero slot
  const showFeatured = !isSearching && activeCategory === "All" && filteredWorkouts.length > 0;
  const featured = showFeatured ? filteredWorkouts[0] : null;
  const standardList = showFeatured ? filteredWorkouts.slice(1) : filteredWorkouts;

  // Close suggestions when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        suggestRef.current &&
        !suggestRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function applySuggestion(s: string) {
    setQuery(s);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function clearSearch() {
    setQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-7">
      {/* ── Search Bar ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/40" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search exercises, muscles, goals…"
            autoComplete="off"
            className="h-14 w-full rounded-[1.25rem] bg-card pl-12 pr-12 text-[15px] font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground/35 shadow-badge ring-1 ring-border/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background transition-all"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted-foreground/20 active:scale-90"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && query.length >= 1 && (
              <motion.div
                ref={suggestRef}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-border/10"
              >
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onMouseDown={(e) => { e.preventDefault(); applySuggestion(s); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-medium text-foreground transition-colors hover:bg-accent first:pt-3.5 last:pb-3.5"
                  >
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category pills — hidden while searching */}
        {!isSearching && (
          <CategoryPills
            categories={categories}
            activeCategory={activeCategory}
            onSelect={(cat) => setActiveCategory(cat)}
          />
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {isSearching ? (
          /* ── Search Mode ────────────────────────────────────────── */
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Result count / status */}
            <div className="flex items-center gap-2">
              {exercisesLoading ? (
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/50" />
                  Loading exercises…
                </span>
              ) : searchResult?.isFallback ? (
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-primary/60">
                  <TrendingUp className="h-3 w-3" />
                  Showing closest matches
                </span>
              ) : (
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                  {searchResult?.exercises.length ?? 0} exercises found
                </span>
              )}
            </div>

            {/* Fallback banner */}
            {searchResult?.isFallback && (
              <div className="rounded-2xl bg-primary/5 px-4 py-3 ring-1 ring-primary/10">
                <p className="text-[13px] font-semibold text-foreground/70">
                  No exact match for <span className="font-black text-primary">"{query}"</span> — here are related exercises:
                </p>
              </div>
            )}

            {/* No results at all */}
            {searchResult?.isEmpty && !exercisesLoading && (
              <div className="rounded-[2rem] bg-card px-6 py-10 text-center shadow-badge ring-1 ring-border/5">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Dumbbell className="h-6 w-6 text-muted-foreground/30" strokeWidth={1.5} />
                </div>
                <p className="text-base font-black text-foreground">Nothing found</p>
                <p className="mt-1 text-sm text-muted-foreground/60">
                  Try: abs, cardio, legs, home workout, no equipment
                </p>
                <button
                  onClick={clearSearch}
                  className="mt-4 rounded-xl bg-primary/10 px-4 py-2 text-[13px] font-bold text-primary transition-colors hover:bg-primary/15"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* Exercise results */}
            {(searchResult?.exercises.length ?? 0) > 0 && (
              <div className="space-y-2">
                {searchResult!.exercises.map((ex, i) => (
                  <motion.div
                    key={ex.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.025 }}
                  >
                    <Link
                      href={`/g/${gymSlug}/exercises/${ex.id}`}
                      className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-badge ring-1 ring-border/5 transition-all active:scale-[0.98] hover:ring-primary/20 hover:shadow-md"
                    >
                      {/* GIF thumbnail */}
                      <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-xl bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={exerciseLoopUrl(ex.source_id)}
                          alt={ex.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-black text-foreground">{ex.name}</p>
                        <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground/55">
                          {ex.category}
                          {ex.primary_muscles.length > 0 &&
                            ` · ${ex.primary_muscles.slice(0, 2).join(", ")}`}
                          {ex.equipment ? ` · ${ex.equipment}` : ""}
                        </p>
                      </div>

                      {/* Level badge + arrow */}
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            LEVEL_COLOR[ex.level] ?? "bg-muted text-muted-foreground/60"
                          )}
                        >
                          {ex.level}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/25" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* ── Browse Mode (workout cards) ────────────────────────── */
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {filteredWorkouts.length === 0 ? (
              <div className="rounded-[2.5rem] bg-card px-6 py-16 text-center shadow-badge ring-1 ring-border/5">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
                  <Dumbbell className="h-8 w-8 text-muted-foreground/20" strokeWidth={1} />
                </div>
                <p className="text-lg font-black text-foreground">No workouts yet</p>
                <p className="mt-1 text-sm text-muted-foreground/60">
                  This category has no workouts right now
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Featured hero card */}
                {featured && (
                  <div className="space-y-3">
                    <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-primary/70">
                      <Sparkles className="h-3 w-3 fill-current" />
                      Recommended For You
                    </h2>
                    <WorkoutCard workout={featured} gymSlug={gymSlug} />
                  </div>
                )}

                {/* Standard list */}
                {standardList.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground/45">
                      {activeCategory !== "All" ? activeCategory : "All"} Workouts
                    </h2>
                    <div className="space-y-3">
                      {standardList.map((workout, i) => (
                        <motion.div
                          key={workout.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.04 }}
                          className={cn(
                            (i + 1) % 5 === 0 && "rounded-[2rem] bg-primary/5 p-1 ring-1 ring-primary/5"
                          )}
                        >
                          <WorkoutCard workout={workout} gymSlug={gymSlug} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
