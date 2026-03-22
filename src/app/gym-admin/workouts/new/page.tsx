import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { WorkoutForm } from "@/components/gym-admin/WorkoutForm";
import { createWorkout } from "@/features/workouts/admin-actions";

export const metadata = { title: "New Workout" };

export default async function NewWorkoutPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/gym-admin/workouts/new");

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.role || !["gym_admin", "super_admin"].includes(profile.role)) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Access denied.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Workout</h1>
        <p className="text-sm text-muted-foreground">
          Build a workout with steps, durations, and rest periods.
        </p>
      </div>
      <WorkoutForm onSubmit={createWorkout} submitLabel="Create Workout" />
    </div>
  );
}
