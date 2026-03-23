import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Clock, List, Zap, MoreHorizontal } from "lucide-react";
import { getTenantBySlug } from "@/features/tenants/queries";
import { getWorkoutBySlugOrId } from "@/features/workouts/queries";
import { DIFFICULTY_STYLES, formatDuration } from "@/lib/utils/workout-ui";
import { getCategoryIcon, getDifficultyIcon } from "@/lib/utils/gym-icons";
import { cn } from "@/lib/utils/cn";
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
  
  // Use first step media as hero if available, else null
  const heroImage = steps.find(s => s.mediaUrl)?.mediaUrl || null;
  const IconComponent = getCategoryIcon(workout.category);

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/10">
      {/* ── Hero & Header Area ────────────────────────────────────────── */}
      <div className="relative h-[45vh] w-full overflow-hidden bg-muted">
        {heroImage ? (
          <img
            src={heroImage}
            alt={workout.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-background">
            <IconComponent className="h-20 w-20 text-primary/20" strokeWidth={1} />
          </div>
        )}

        {/* Floating Back Button */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-6">
          <Link
            href={`/g/${gymSlug}/workouts`}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-xl transition-all active:scale-90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        {/* Glass Title Card Overlay */}
        <div className="absolute bottom-6 left-4 right-4 z-20">
          <div className="rounded-[2rem] bg-black/30 backdrop-blur-2xl border border-white/10 p-6 text-white shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                {workout.category}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/80 border border-white/5">
                {diff.label}
              </span>
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-tight">
              {workout.title}
            </h1>
          </div>
        </div>

        {/* Bottom Fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />
      </div>

      {/* ── Content Area ───────────────────────────────────────────── */}
      <div className="flex-1 w-full max-w-2xl mx-auto px-5 pb-32 pt-10">
        {/* Description */}
        {workout.description && (
          <p className="text-lg font-medium leading-relaxed text-muted-foreground/80 mb-8 italic">
            &ldquo;{workout.description}&rdquo;
          </p>
        )}

        {/* Simplified Stat Row */}
        <div className="flex items-center justify-between py-6 px-2 border-y border-border/40 gap-4 mb-10 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-[15px] font-black text-foreground">{formatDuration(workout.estimatedMinutes)}</span>
          </div>
          <div className="h-4 w-px bg-border/50 shrink-0" />
          <div className="flex items-center gap-2 shrink-0">
            <List className="h-4 w-4 text-primary" />
            <span className="text-[15px] font-black text-foreground">{steps.length} steps</span>
          </div>
          <div className="h-4 w-px bg-border/50 shrink-0" />
          <div className="flex items-center gap-2 shrink-0">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-[15px] font-black text-foreground">{diff.label}</span>
          </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50">
              Training Plan
            </h2>
            <span className="text-[11px] font-bold text-muted-foreground/40">{steps.length} EXERCISES</span>
          </div>
          
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div 
                key={step.id} 
                className="group flex items-center gap-4 rounded-3xl bg-card p-3 pr-5 shadow-badge ring-1 ring-border/5 transition-all hover:shadow-pill"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-sm">
                  {step.mediaUrl ? (
                    <img src={step.mediaUrl} alt={step.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/5">
                      <span className="text-lg font-black text-primary/40">{i+1}</span>
                    </div>
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-black text-foreground truncate">{step.title}</h3>
                  <p className="mt-0.5 text-xs font-bold text-muted-foreground/60 uppercase tracking-wide">
                    {stepMeta(step)}
                  </p>
                </div>

                <div className="shrink-0 text-muted-foreground/20 group-hover:text-primary/40 transition-colors">
                   <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky CTA ────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pt-4 pb-8 bg-gradient-to-t from-background via-background/90 to-transparent">
        <div className="mx-auto max-w-lg">
          <Link
            href={`/g/${gymSlug}/workouts/${workout.id}/session`}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-[1.25rem] bg-primary text-[15px] font-black tracking-wide text-primary-foreground shadow-pill shadow-primary/25 transition-all active:scale-[0.98] hover:shadow-primary/35"
          >
            START TRAINING
            <ChevronRight className="h-5 w-5" strokeWidth={3} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  if (parts.length === 0) return "Included";
  return parts.join(" · ");
}
