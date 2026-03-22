interface Props {
  params: Promise<{ gymSlug: string; sessionId: string }>;
}

export default async function SessionPage({ params }: Props) {
  const { sessionId } = await params;

  return (
    <div className="flex min-h-[80vh] flex-col px-4 py-6">
      <div className="mb-6 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Active Session
        </p>
        <h1 className="text-xl font-bold text-foreground">
          Workout in Progress
        </h1>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Live workout session engine will be built in Phase 1.
            <br />
            Session:{" "}
            <span className="font-mono text-xs text-foreground">
              {sessionId}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
