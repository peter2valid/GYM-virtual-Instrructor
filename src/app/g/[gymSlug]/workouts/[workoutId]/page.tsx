import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getTenantBySlug } from "@/features/tenants/queries";
import { getWorkoutBySlugOrId } from "@/features/workouts/queries";
import { DIFFICULTY_STYLES, formatDuration } from "@/lib/utils/workout-ui";
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
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link
            href={`/g/${gymSlug}/workouts`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="text-sm font-semibold text-foreground">Workout</p>
        </div>
      </header>

      {/* Content — padded from sticky CTA */}
      <div className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 pb-28 pt-6">
        {/* Title block */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{workout.category}</span>
            <span className="text-muted-foreground/30">·</span>
            <span>{diff.label}</span>
          </div>
          <h1 className="text-2xl font-bold leading-tight text-foreground">
            {workout.title}
          </h1>
          {workout.description && (
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              {workout.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Duration" value={formatDuration(workout.estimatedMinutes)} />
          <Stat label="Steps" value={String(steps.length)} />
          <Stat label="Level" value={diff.label} />
        </div>

        {/* Steps preview */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            What&apos;s included
          </p>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-start gap-3 px-4 py-3.5">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
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
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <Link
            href={`/g/${gymSlug}/workouts/${workout.id}/session`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            Start Workout
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-3 text-center">
      <p className="text-base font-bold text-foreground">{value}</p>
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
