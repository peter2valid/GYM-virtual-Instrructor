import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import { DIFFICULTY_STYLES, formatDuration } from "@/lib/utils/workout-ui";
import { getCategoryIcon } from "@/lib/utils/gym-icons";
import { cn } from "@/lib/utils/cn";
import type { Workout } from "@/types";

interface WorkoutCardProps {
  workout: Workout;
  gymSlug: string;
}

export function WorkoutCard({ workout, gymSlug }: WorkoutCardProps) {
  const diff = DIFFICULTY_STYLES[workout.difficulty];
  const IconComponent = getCategoryIcon(workout.category);
  
  // Use first step media if available for card preview
  const previewImage = workout.steps.find(s => s.mediaUrl)?.mediaUrl || null;

  return (
    <Link
      href={`/g/${gymSlug}/workouts/${workout.id}`}
      className="group relative flex items-center gap-4 rounded-3xl bg-card p-3 pr-6 shadow-badge ring-1 ring-border/5 transition-all hover:shadow-pill hover:-translate-y-0.5 active:scale-[0.98]"
    >
      {/* Visual Anchor */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-sm">
        {previewImage ? (
          <img 
            src={previewImage} 
            alt={workout.title} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/5">
            <IconComponent className="h-8 w-8 text-primary/40" strokeWidth={1.5} />
          </div>
        )}
        
        {/* Play button overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
           <div className="rounded-full bg-white/20 backdrop-blur-md p-2">
             <Play className="h-4 w-4 fill-white text-white" />
           </div>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-base font-black leading-tight tracking-tight text-foreground truncate">
          {workout.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
          <span>{workout.category}</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <span className={cn(
            "transition-colors group-hover:text-primary",
            diff.label === "Expert" ? "text-red-500/70" : 
            diff.label === "Intermediate" ? "text-orange-500/70" : 
            "text-green-500/70"
          )}>{diff.label}</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <span>{formatDuration(workout.estimatedMinutes)}</span>
        </div>
      </div>

      <div className="shrink-0 text-muted-foreground/20 group-hover:text-primary transition-all group-hover:translate-x-1">
        <ChevronRight className="h-6 w-6" strokeWidth={3} />
      </div>
    </Link>
  );
}
