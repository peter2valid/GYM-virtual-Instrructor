import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTenantBySlug } from "@/features/tenants/queries";
import { getAuthUser } from "@/features/auth/actions";
import { getSessionHistory } from "@/features/sessions/queries";
import type { SessionWithWorkout } from "@/features/sessions/queries";
import { getCategoryIcon } from "@/lib/utils/gym-icons";

interface Props {
  params: Promise<{ gymSlug: string }>;
}

export const metadata = { title: "Session History" };

export default async function HistoryPage({ params }: Props) {
  const { gymSlug } = await params;

  const [tenant, user] = await Promise.all([
    getTenantBySlug(gymSlug),
    getAuthUser(),
  ]);

  if (!tenant) notFound();

  const sessions = user ? await getSessionHistory(user.id, tenant.id) : [];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link
            href={`/g/${gymSlug}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="text-sm font-semibold text-foreground">Session History</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-6 pb-24">
        {sessions.length === 0 ? (
          <EmptyState gymSlug={gymSlug} loggedIn={!!user} />
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {sessions.length} workout{sessions.length !== 1 ? "s" : ""} completed
            </p>
            <div className="space-y-2">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} gymSlug={gymSlug} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SessionCard({ session, gymSlug }: { session: SessionWithWorkout; gymSlug: string }) {
  const date = session.completedAt
    ? new Date(session.completedAt).toLocaleDateString("en", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "—";

  const duration = session.totalDurationSeconds
    ? session.totalDurationSeconds >= 60
      ? `${Math.round(session.totalDurationSeconds / 60)} min`
      : `${session.totalDurationSeconds}s`
    : null;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5">
      <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-muted p-2 flex items-center justify-center text-muted-foreground">
        {(() => {
          const Icon = getCategoryIcon(session.workoutCategory ?? "");
          return <Icon className="h-full w-full" strokeWidth={2} />;
        })()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {session.workoutTitle}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {session.workoutCategory} · {date}
        </p>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-1">
        {duration && (
          <span className="text-xs font-medium text-foreground">{duration}</span>
        )}
        <Link
          href={`/g/${gymSlug}/workouts/${session.workoutId}`}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Repeat
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ gymSlug, loggedIn }: { gymSlug: string; loggedIn: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <div className="text-muted-foreground opacity-60">
          {(() => {
            const Icon = getCategoryIcon("Default");
            return <Icon className="h-7 w-7" strokeWidth={2.5} />;
          })()}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">No sessions yet</p>
        <p className="text-sm text-muted-foreground">
          {loggedIn
            ? "Complete a workout and it will appear here."
            : "Sign in to track your workout history."}
        </p>
      </div>
      {!loggedIn ? (
        <Link
          href={`/login?next=/g/${gymSlug}/history`}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Sign in
        </Link>
      ) : (
        <Link
          href={`/g/${gymSlug}/workouts`}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Browse Workouts
        </Link>
      )}
    </div>
  );
}
