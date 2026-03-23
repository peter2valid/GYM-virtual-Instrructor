"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkoutInput, WorkoutStepInput } from "@/features/workouts/admin-actions";
import { ExerciseSearch } from "./ExerciseSearch";

const CATEGORIES = [
  "Strength", "Cardio", "HIIT", "Flexibility", "Yoga",
  "Pilates", "CrossFit", "Bodyweight", "Stretching", "Recovery",
  "Warmup", "Full Body",
];

const DIFFICULTIES = [
  { value: "beginner",     label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced",     label: "Advanced" },
] as const;

interface Props {
  initialData?: Partial<WorkoutInput>;
  workoutId?: string;
  onSubmit: (data: WorkoutInput) => Promise<{ error: string } | { success: true }>;
  submitLabel?: string;
}

export function WorkoutForm({
  initialData,
  onSubmit,
  submitLabel = "Save Workout",
}: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "Strength");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">(
    initialData?.difficulty ?? "beginner"
  );
  const [duration, setDuration] = useState(initialData?.estimatedDurationMinutes ?? 30);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? true);
  const [steps, setSteps] = useState<WorkoutStepInput[]>(
    initialData?.steps ?? [{ title: "", description: "", durationSeconds: 40, restAfterSeconds: 20, exerciseId: null }]
  );
  // Track exercise names for display (id → name)
  const [exerciseNames, setExerciseNames] = useState<Record<number, string | null>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addStep() {
    setSteps((prev) => [
      ...prev,
      { title: "", description: "", durationSeconds: 40, restAfterSeconds: 20, exerciseId: null },
    ]);
  }

  function removeStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateStep(i: number, patch: Partial<WorkoutStepInput>) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function moveStep(i: number, dir: -1 | 1) {
    const next = [...steps];
    const swap = i + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[i], next[swap]] = [next[swap], next[i]];
    setSteps(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Workout title is required."); return; }
    if (steps.some((s) => !s.title.trim())) {
      setError("All steps must have a title.");
      return;
    }
    setLoading(true);
    setError(null);

    const result = await onSubmit({
      title,
      category,
      difficulty,
      estimatedDurationMinutes: duration,
      description: description || undefined,
      isPublished,
      steps,
    });

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      router.push("/gym-admin/workouts");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Workout Details ────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Workout Details</h2>

        <Field label="Title">
          <input
            type="text"
            required
            placeholder="e.g. Full Body Strength"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Difficulty">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
              className="input"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Duration (min)">
            <input
              type="number"
              min={1}
              max={240}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="input"
            />
          </Field>
        </div>

        <Field label="Description (optional)">
          <textarea
            rows={3}
            placeholder="Describe what this workout targets..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input resize-none"
          />
        </Field>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 rounded accent-primary"
          />
          <span className="text-sm text-foreground">
            Published{" "}
            <span className="text-xs text-muted-foreground">(visible to members)</span>
          </span>
        </label>
      </section>

      {/* ── Steps ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Steps{" "}
            <span className="font-normal text-muted-foreground">({steps.length})</span>
          </h2>
          <button
            type="button"
            onClick={addStep}
            className="text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            + Add Step
          </button>
        </div>

        {steps.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            No steps yet. Click &quot;Add Step&quot; to add one.
          </div>
        )}

        <div className="space-y-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Step {i + 1}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveStep(i, -1)}
                    disabled={i === 0}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(i, 1)}
                    disabled={i === steps.length - 1}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <Field label="Step title">
                <input
                  type="text"
                  required
                  placeholder="e.g. Push-ups"
                  value={step.title}
                  onChange={(e) => updateStep(i, { title: e.target.value })}
                  className="input"
                />
              </Field>

              <Field label="Notes (optional)">
                <input
                  type="text"
                  placeholder="e.g. Keep your core tight"
                  value={step.description ?? ""}
                  onChange={(e) => updateStep(i, { description: e.target.value })}
                  className="input"
                />
              </Field>

              <Field label="Link exercise (optional)" hint="Adds GIF media when available">
                <ExerciseSearch
                  value={step.exerciseId ?? null}
                  valueName={exerciseNames[i] ?? null}
                  onChange={(id, name) => {
                    updateStep(i, { exerciseId: id });
                    setExerciseNames((prev) => ({ ...prev, [i]: name }));
                  }}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Duration (seconds)">
                  <input
                    type="number"
                    min={5}
                    max={3600}
                    value={step.durationSeconds}
                    onChange={(e) =>
                      updateStep(i, { durationSeconds: Number(e.target.value) })
                    }
                    className="input"
                  />
                </Field>
                <Field label="Rest after (seconds)">
                  <input
                    type="number"
                    min={0}
                    max={600}
                    value={step.restAfterSeconds}
                    onChange={(e) =>
                      updateStep(i, { restAfterSeconds: Number(e.target.value) })
                    }
                    className="input"
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Actions ───────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/gym-admin/workouts")}
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
