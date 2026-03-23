import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getTenantBySlug } from "@/features/tenants/queries";
import { getWorkoutBySlugOrId } from "@/features/workouts/queries";
import { DIFFICULTY_STYLES, formatDuration } from "@/lib/utils/workout-ui";
import { getCategoryIcon, getDifficultyIcon, STAT_ICONS } from "@/lib/utils/gym-icons";
import type { WorkoutStep } from "@/types";

interface Props {
  params: Promise<{ gymSlug: string; workoutId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { gymSlug, workoutId } = await params;
  const tenant = await getTenantBySlug(gymSlug);
  if (!tenant) return {};
  const workout = await getWorkoutBySlugOrId(tenant.id, workoutId);
  return { title: workout ? workout.title : "Workout Not Found" };
}

export default async function WorkoutDetailPage({ params }: Props) {
  const { gymSlug, workoutId } = await params;

  const tenant = await getTenantBySlug(gymSlug);
  if (!tenant) notFound();

  const workout = await getWorkoutBySlugOrId(tenant.id, workoutId);
  if (!workout) notFound();

  const diff = DIFFICULTY_STYLES[workout.difficulty];
  const steps = workout.steps.slice().sort((a, b) => a.order - b.order);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link
            href={`/g/${gymSlug}/workouts`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-colors hover:bg-muted"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="text-sm font-semibold text-foreground">Workout</p>
        </div>
      </header>

      {/* Content — padded from sticky CTA */}
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 pb-28 pt-6">
        {/* Title block */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {(() => {
              const Icon = getCategoryIcon(workout.category);
              return <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />;
            })()}
            <span className="font-medium">{workout.category}</span>
            <span className="text-muted-foreground/30">·</span>
            {(() => {
              const Icon = getDifficultyIcon(workout.difficulty);
              return <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />;
            })()}
            <span className="font-medium">{diff.label}</span>
          </div>
          <h1 className="text-2xl font-extrabold leading-tight text-foreground">
            {workout.title}
          </h1>
          {workout.description && (
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              {workout.description}
            </p>
          )}
        </div>

        {/* Stats — tinted, no hard border */}
        <div className="grid grid-cols-3 gap-2.5">
          <Stat label="Duration" value={formatDuration(workout.estimatedMinutes)} icon={STAT_ICONS.duration} />
          <Stat label="Steps" value={String(steps.length)} icon={STAT_ICONS.steps} />
          <Stat label="Level" value={diff.label} icon={getDifficultyIcon(workout.difficulty)} />
        </div>

        {/* Steps preview */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            What&apos;s included
          </p>
          <div className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-start gap-3 rounded-xl bg-card px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {step.title}
                  </p>
                  {stepMeta(step) && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {stepMeta(step)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 px-4 py-4 backdrop-blur border-t border-border/50">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/g/${gymSlug}/workouts/${workout.id}/session`}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            Start Workout
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="rounded-2xl bg-card px-3 py-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
      {Icon && (
        <Icon className="mx-auto mb-2 h-5 w-5 text-primary/70" strokeWidth={2} />
      )}
      <p className="text-base font-extrabold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function stepMeta(step: WorkoutStep): string {
  const parts: string[] = [];
  if (step.reps !== null) parts.push(`${step.reps} reps`);
  if (step.sets !== null) parts.push(`${step.sets} sets`);
  if (step.durationSeconds !== null) {
    const s = step.durationSeconds;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    parts.push(m > 0 ? (sec > 0 ? `${m}m ${sec}s` : `${m} min`) : `${s}s`);
  }
  if (step.restSeconds !== null) parts.push(`${step.restSeconds}s rest`);
  return parts.join(" · ");
}
