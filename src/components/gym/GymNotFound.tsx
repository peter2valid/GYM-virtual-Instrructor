import Link from "next/link";
import { MapPin } from "lucide-react";

export function GymNotFound({ slug }: { slug?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card">
        <MapPin className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold text-foreground">Gym Not Found</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        {slug ? (
          <>
            We couldn&apos;t find a gym with the address{" "}
            <span className="font-mono text-xs text-foreground">/{slug}</span>.
          </>
        ) : (
          "We couldn\u2019t find this gym."
        )}{" "}
        Check the QR code or link and try again.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-md border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        Back to Home
      </Link>
    </div>
  );
}
