import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/features/tenants/queries";
import { getWorkoutBySlugOrId } from "@/features/workouts/queries";
import { SessionScreen } from "@/components/workout/SessionScreen";

interface Props {
  params: Promise<{ gymSlug: string; workoutId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { gymSlug, workoutId } = await params;
  const tenant = await getTenantBySlug(gymSlug);
  if (!tenant) return {};
  const workout = await getWorkoutBySlugOrId(tenant.id, workoutId);
  return { title: workout ? `${workout.title} — Session` : "Session" };
}

export default async function SessionPage({ params }: Props) {
  const { gymSlug, workoutId } = await params;

  const tenant = await getTenantBySlug(gymSlug);
  if (!tenant) notFound();

  const workout = await getWorkoutBySlugOrId(tenant.id, workoutId);
  if (!workout) notFound();

  return <SessionScreen workout={workout} gymSlug={gymSlug} />;
}
