import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            VirtualGYM
          </h1>
          <p className="text-lg text-muted-foreground">
            The modern gym management platform for trainers and members.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={ROUTES.ONBOARD}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
          >
            Get Started Free
          </Link>
          <Link
            href={ROUTES.PRICING}
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground sm:w-auto"
          >
            View Pricing
          </Link>
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground sm:w-auto"
          >
            Sign In
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          Are you a gym member?{" "}
          <span className="font-medium text-foreground">
            Scan the QR code at your gym to get started.
          </span>
        </p>
      </div>
    </main>
  );
}
