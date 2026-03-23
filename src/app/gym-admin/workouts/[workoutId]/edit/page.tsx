import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { WorkoutForm } from "@/components/gym-admin/WorkoutForm";
import { updateWorkout } from "@/features/workouts/admin-actions";
import type { WorkoutInput } from "@/features/workouts/admin-actions";

interface Props {
  params: Promise<{ workoutId: string }>;
}

export const metadata = { title: "Edit Workout" };

export default async function EditWorkoutPage({ params }: Props) {
  const { workoutId } = await params;

  const user = await getAuthUser();
  if (!user) redirect(`/login?next=/gym-admin/workouts/${workoutId}/edit`);

  const client = await createServerSupabaseClient();

  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.tenant_id || !["gym_admin", "super_admin"].includes(profile.role ?? "")) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Access denied.</div>;
  }

  const { data: workout } = await client
    .from("workouts")
    .select("*, workout_steps(id, step_order, title, instruction_text, duration_seconds, rest_seconds, exercise_id)")
    .eq("id", workoutId)
    .eq("tenant_id", profile.tenant_id)
    .maybeSingle();

  if (!workout) notFound();

  const sortedSteps = (workout.workout_steps ?? [])
    .sort((a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order)
    .map((s: {
      title: string;
      instruction_text: string | null;
      duration_seconds: number;
      rest_seconds: number;
      exercise_id: string | null;
    }) => ({
      title: s.title,
      description: s.instruction_text ?? "",
      durationSeconds: s.duration_seconds,
      restAfterSeconds: s.rest_seconds,
      exerciseId: s.exercise_id ?? null,
    }));

  const initialData: Partial<WorkoutInput> = {
    title: workout.title,
    category: workout.category,
    difficulty: workout.difficulty,
    estimatedDurationMinutes: workout.estimated_duration_minutes,
    description: workout.description ?? "",
    isPublished: workout.is_published,
    steps: sortedSteps,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Workout</h1>
        <p className="text-sm text-muted-foreground">{workout.title}</p>
      </div>
      <WorkoutForm
        initialData={initialData}
        workoutId={workoutId}
        onSubmit={updateWorkout.bind(null, workoutId)}
        submitLabel="Save Changes"
      />
    </div>
  );
}
