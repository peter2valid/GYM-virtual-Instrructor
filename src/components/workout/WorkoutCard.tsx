import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DIFFICULTY_STYLES, formatDuration } from "@/lib/utils/workout-ui";
import { getCategoryIcon } from "@/lib/utils/gym-icons";
import type { Workout } from "@/types";

interface WorkoutCardProps {
  workout: Workout;
  gymSlug: string;
}

export function WorkoutCard({ workout, gymSlug }: WorkoutCardProps) {
  const diff = DIFFICULTY_STYLES[workout.difficulty];

  return (
    <Link
      href={`/g/${gymSlug}/workouts/${workout.id}`}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-4 transition-all duration-[120ms] hover:border-border/60 hover:bg-accent/50 active:scale-[0.98] active:bg-accent/70"
    >
      <div className="h-11 w-11 flex-shrink-0 rounded-xl bg-muted p-1.5 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors duration-120">
        {(() => {
          const Icon = getCategoryIcon(workout.category);
          return <Icon className="h-6 w-6" />;
        })()}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold leading-snug text-foreground">
          {workout.title}
        </h3>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {workout.category}
          <Dot />
          {diff.label}
          <Dot />
          {formatDuration(workout.estimatedMinutes)}
          {(workout.stepCount ?? workout.steps.length) > 0 && (
            <>
              <Dot />
              {workout.stepCount ?? workout.steps.length} steps
            </>
          )}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/30 transition-transform duration-[120ms] group-hover:translate-x-0.5 group-hover:text-muted-foreground/60" />
    </Link>
  );
}

function Dot() {
  return <span className="mx-1.5 text-muted-foreground/25">·</span>;
}
