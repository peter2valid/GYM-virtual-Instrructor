import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Dumbbell, Zap, Target } from "lucide-react";
import { getExerciseById } from "@/features/exercises/queries";
import { exerciseLoopUrl, exerciseDemoUrl } from "@/lib/exercises/url";
import { ExerciseGifDisplay } from "./ExerciseGifDisplay";

interface Props {
  params: Promise<{ gymSlug: string; exerciseId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { exerciseId } = await params;
  const exercise = await getExerciseById(exerciseId);
  return { title: exercise ? exercise.name : "Exercise" };
}

export default async function ExerciseDetailPage({ params }: Props) {
  const { gymSlug, exerciseId } = await params;
  const exercise = await getExerciseById(exerciseId);
  if (!exercise) notFound();

  const gifUrl = exercise.sourceId
    ? exerciseDemoUrl(exercise.sourceId)
    : null;
  const loopUrl = exercise.sourceId
    ? exerciseLoopUrl(exercise.sourceId)
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link
            href={`/g/${gymSlug}/workouts`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="text-sm font-black text-foreground truncate">{exercise.name}</p>
        </div>
      </div>

      {/* ── GIF ──────────────────────────────────────────────────── */}
      <div className="w-full bg-muted aspect-[4/3] max-h-[320px] overflow-hidden">
        {gifUrl && loopUrl ? (
          <ExerciseGifDisplay demoUrl={gifUrl} loopUrl={loopUrl} name={exercise.name} />
        ) : loopUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={loopUrl} alt={exercise.name} className="h-full w-full object-contain bg-muted" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Dumbbell className="h-16 w-16 text-muted-foreground/20" strokeWidth={1} />
          </div>
        )}
      </div>

      {/* ── Details ──────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-2xl px-5 py-6 pb-20 space-y-6">
        {/* Name + badges */}
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-foreground leading-tight">{exercise.name}</h1>
          <div className="flex flex-wrap gap-2">
            {exercise.category && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary">
                {exercise.category}
              </span>
            )}
            {exercise.level && (
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {exercise.level}
              </span>
            )}
            {exercise.equipment && (
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {exercise.equipment}
              </span>
            )}
          </div>
        </div>

        {/* Muscles */}
        {(exercise.primaryMuscles.length > 0 || exercise.secondaryMuscles.length > 0) && (
          <div className="rounded-2xl bg-card p-4 space-y-3 shadow-sm ring-1 ring-border/5">
            <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
              <Target className="h-3 w-3" />
              Muscles
            </h2>
            {exercise.primaryMuscles.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40 mb-1">Primary</p>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.primaryMuscles.map((m) => (
                    <span key={m} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-bold capitalize text-primary">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {exercise.secondaryMuscles.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40 mb-1">Secondary</p>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.secondaryMuscles.map((m) => (
                    <span key={m} className="rounded-full bg-muted px-2.5 py-0.5 text-[12px] font-bold capitalize text-muted-foreground">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {exercise.instructions.length > 0 && (
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
              <Zap className="h-3 w-3" />
              How To Do It
            </h2>
            <ol className="space-y-3">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-black text-primary">
                    {i + 1}
                  </span>
                  <p className="text-[14px] leading-relaxed text-foreground/80 pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Extra info */}
        {(exercise.mechanic || exercise.force) && (
          <div className="flex gap-3">
            {exercise.mechanic && (
              <div className="flex-1 rounded-2xl bg-card p-3 text-center shadow-sm ring-1 ring-border/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40">Mechanic</p>
                <p className="mt-0.5 text-[13px] font-black capitalize text-foreground">{exercise.mechanic}</p>
              </div>
            )}
            {exercise.force && (
              <div className="flex-1 rounded-2xl bg-card p-3 text-center shadow-sm ring-1 ring-border/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40">Force</p>
                <p className="mt-0.5 text-[13px] font-black capitalize text-foreground">{exercise.force}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
