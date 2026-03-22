import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ gymSlug: string; sessionId: string }>;
}

// Old session route — look up the session's workout and redirect to the real session page.
// If already completed, redirect to history. If not found, 404.
export default async function SessionPage({ params }: Props) {
  const { gymSlug, sessionId } = await params;

  const client = await createClient();
  const { data: session } = await client
    .from("workout_sessions")
    .select("workout_id, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();

  if (session.status === "completed") {
    redirect(`/g/${gymSlug}/history`);
  }

  // Active/in-progress — redirect to the real workout session page
  redirect(`/g/${gymSlug}/workouts/${session.workout_id}/session`);
}
