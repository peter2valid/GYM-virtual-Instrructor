import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/actions";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { DeleteWorkoutButton } from "./DeleteWorkoutButton";
import { CatalogControls } from "./CatalogControls";
import { WorkoutQrButton } from "./WorkoutQrButton";

export const metadata = { title: "Workouts" };

export default async function GymAdminWorkoutsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/gym-admin/workouts");

  const client = await createServerSupabaseClient();
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.tenant_id || !["gym_admin", "super_admin"].includes(profile.role ?? "")) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Access denied.</div>;
  }

  // Fetch tenant slug for QR codes
  const { data: tenant } = await client
    .from("tenants")
    .select("slug")
    .eq("id", profile.tenant_id)
    .maybeSingle();

  const gymSlug = tenant?.slug ?? "";

  // Fetch workouts from workout_templates
  const { data: workouts } = await client
    .from("workout_templates")
    .select(
      "id, title, category, difficulty, is_published, estimated_duration_minutes, created_at, is_featured, is_quick_start"
    )
    .eq("gym_id", profile.tenant_id)
    .order("created_at", { ascending: false });

  const rows = (workouts ?? []).map((w) => ({
    ...w,
    isQuickStart: w.is_quick_start ?? false,
    isRecommended: w.is_featured ?? false,
  }));

  const DIFFICULTY_LABEL: Record<string, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workouts</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} workout{rows.length !== 1 ? "s" : ""} in your catalog
          </p>
        </div>
        <Link
          href="/gym-admin/workouts/new"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          + New Workout
        </Link>
      </div>

      {/* Legend */}
      {rows.length > 0 && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">⚡ Quick</span> — appears in the &quot;Start now&quot; section.{" "}
          <span className="font-medium">★ Featured</span> — appears in the &quot;Featured&quot; section.
        </p>
      )}

      <div className="rounded-xl border border-border bg-card">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No workouts yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first workout to start building your catalog.
            </p>
            <Link
              href="/gym-admin/workouts/new"
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Create Workout
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((w) => (
              <div key={w.id} className="px-4 py-3 space-y-2">
                {/* Row 1: title + status + actions */}
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{w.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {w.category} · {DIFFICULTY_LABEL[w.difficulty] ?? w.difficulty} · {w.estimated_duration_minutes} min
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold ${
                      w.is_published
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {w.is_published ? "Published" : "Draft"}
                  </span>
                  <Link
                    href={`/gym-admin/workouts/${w.id}/edit`}
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Edit
                  </Link>
                  <WorkoutQrButton workoutId={w.id} workoutTitle={w.title} gymSlug={gymSlug} />
                  <DeleteWorkoutButton workoutId={w.id} workoutTitle={w.title} />
                </div>

                {/* Row 2: catalog controls */}
                <CatalogControls
                  workoutId={w.id}
                  isQuickStart={w.isQuickStart}
                  isRecommended={w.isRecommended}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
