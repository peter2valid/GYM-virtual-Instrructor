export const metadata = {
  title: "Pricing",
};

const plans = [
  {
    name: "Starter",
    description: "Guided workouts. No login required.",
    features: [
      "QR code gym access",
      "Guided workout viewer",
      "Step-by-step instructions",
      "No member accounts needed",
    ],
  },
  {
    name: "Track",
    description: "Full member profiles and progress tracking.",
    features: [
      "Everything in Starter",
      "Member login & profiles",
      "Attendance tracking",
      "Workout history",
      "Admin dashboard",
    ],
  },
  {
    name: "Premium",
    description: "Advanced analytics and custom branding.",
    features: [
      "Everything in Track",
      "Custom gym branding",
      "Advanced analytics",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-4xl space-y-10">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, Transparent Pricing
          </h1>
          <p className="text-muted-foreground">
            Choose the plan that fits your gym.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-lg border border-border bg-card p-6 space-y-4"
            >
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {plan.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <span className="mt-0.5 text-primary">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Pricing details will be finalized. Contact us to discuss your
          gym&apos;s needs.
        </p>
      </div>
    </main>
  );
}
