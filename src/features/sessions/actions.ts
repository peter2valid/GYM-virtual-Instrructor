"use server";

import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase";

export interface SaveSessionInput {
  workoutId: string;
  tenantId: string;
  startedAt: string;
  totalDurationSeconds: number;
}

/**
 * Saves a completed workout session to the database.
 * Silently skips if the user is not authenticated (Starter plan / not logged in).
 */
export async function saveWorkoutSession(
  input: SaveSessionInput
): Promise<{ id: string } | null> {
  if (!isSupabaseConfigured) return null;

  const client = await createServerSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  // Not logged in — Starter plan has no session tracking. That's fine.
  if (!user) return null;

  const { data, error } = await client
    .from("workout_sessions")
    .insert({
      tenant_id: input.tenantId,
      member_id: user.id,
      workout_id: input.workoutId,
      workout_template_id: input.workoutId, // V2: same UUID, template table FK
      started_at: input.startedAt,
      completed_at: new Date().toISOString(),
      status: "completed",
      completion_percent: 100,
      total_duration_seconds: input.totalDurationSeconds,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[saveWorkoutSession] failed:", error.message);
    return null;
  }
  if (!data) return null;
  return { id: data.id };
}
