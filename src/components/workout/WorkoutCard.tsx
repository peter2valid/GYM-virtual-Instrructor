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
      className="group flex items-center gap-4 rounded-2xl bg-card px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.07)] transition-all duration-[150ms] hover:shadow-[0_3px_10px_rgba(0,0,0,0.1)] active:scale-[0.98]"
    >
      <div className="h-11 w-11 flex-shrink-0 rounded-xl bg-primary/10 p-1.5 flex items-center justify-center text-primary transition-colors duration-150">
        {(() => {
          const Icon = getCategoryIcon(workout.category);
          return <Icon className="h-6 w-6" strokeWidth={2} />;
        })()}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold leading-snug text-foreground">
          {workout.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
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
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/40 transition-transform duration-[120ms] group-hover:translate-x-0.5 group-hover:text-muted-foreground/70" />
    </Link>
  );
}

function Dot() {
  return <span className="mx-1.5 text-muted-foreground/30">·</span>;
}
