import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTenantBySlug } from "@/features/tenants/queries";
import {
  getWorkoutsByTenant,
  getCategoriesForTenant,
} from "@/features/workouts/queries";
import { WorkoutsList } from "@/components/workout/WorkoutsList";
import type { WorkoutCategory } from "@/types";

export const revalidate = 60;

interface Props {
  params: Promise<{ gymSlug: string }>;
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { gymSlug } = await params;
  const tenant = await getTenantBySlug(gymSlug);
  return {
    title: tenant ? `Workouts — ${tenant.name}` : "Workouts",
  };
}

export default async function GymWorkoutsPage({ params, searchParams }: Props) {
  const { gymSlug } = await params;
  const { category } = await searchParams;

  const tenant = await getTenantBySlug(gymSlug);
  if (!tenant) notFound();

  const [workouts, categories] = await Promise.all([
    getWorkoutsByTenant(tenant.id),
    getCategoriesForTenant(tenant.id),
  ]);

  const initialCategory =
    category && (categories as string[]).includes(category)
      ? (category as WorkoutCategory)
      : "All";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link
            href={`/g/${gymSlug}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent"
            aria-label="Back to gym home"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm font-semibold text-foreground">Workouts</p>
            <p className="text-xs text-muted-foreground">{tenant.name}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-5 pb-24">
        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground">
              No workouts available yet. Check back soon.
            </p>
          </div>
        ) : (
          <WorkoutsList
            workouts={workouts}
            gymSlug={gymSlug}
            categories={categories}
            initialCategory={initialCategory}
          />
        )}
      </main>
    </div>
  );
}
