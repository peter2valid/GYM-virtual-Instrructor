export const metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Contact Us
          </h1>
          <p className="text-muted-foreground">
            Interested in bringing the platform to your gym? Get in touch.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Contact form will be available here. For now, reach us directly.
          </p>
        </div>
      </div>
    </main>
  );
}
