"use client";

import { useState } from "react";
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

  const filtered =
    activeCategory === "All"
      ? workouts
      : workouts.filter((w) => w.category === activeCategory);

  return (
    <div className="space-y-5">
      <CategoryPills
        categories={categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-2"
        >
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No workouts in this category yet.
              </p>
            </div>
          ) : (
            filtered.map((workout, i) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.22,
                  delay: i * 0.04,
                  ease: "easeOut",
                }}
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
