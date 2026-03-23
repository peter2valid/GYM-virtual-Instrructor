"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { createGym } from "@/features/onboarding/actions";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { ROUTES } from "@/lib/constants";

// ─── Slugify ──────────────────────────────────────────────────────────────────
function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

// ─── Plans ────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "starter" as const,
    name: "Starter",
    price: "Free",
    description: "Perfect for getting started",
    features: [
      "QR code gym access",
      "Guided workout viewer",
      "Step-by-step instructions",
      "No member accounts needed",
    ],
    cta: "Get Started Free",
  },
  {
    id: "track" as const,
    name: "Track",
    price: "₦15,000/mo",
    description: "For gyms that track members",
    features: [
      "Everything in Starter",
      "Member login & profiles",
      "Attendance tracking",
      "Workout history",
      "Admin dashboard analytics",
    ],
    cta: "Start 7-Day Trial",
    highlighted: true,
  },
  {
    id: "premium" as const,
    name: "Premium",
    price: "₦30,000/mo",
    description: "Full platform power",
    features: [
      "Everything in Track",
      "Custom gym branding",
      "Advanced analytics",
      "Priority support",
      "Custom recommendations",
    ],
    cta: "Start 7-Day Trial",
  },
];

// ─── Page wrapper with Suspense ───────────────────────────────────────────────
export default function OnboardPage() {
  return (
    <Suspense>
      <OnboardPageInner />
    </Suspense>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function OnboardPageInner() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: gym info
  const [gymName, setGymName] = useState("");
  const [gymSlug, setGymSlug] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");

  // Step 2: admin account
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Step 3: plan
  const [plan, setPlan] = useState<"starter" | "track" | "premium">("starter");

  function handleGymNameChange(val: string) {
    setGymName(val);
    setGymSlug(slugify(val));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const result = await createGym({
      gymName,
      gymSlug,
      welcomeMessage: welcomeMessage || undefined,
      adminName,
      adminEmail,
      adminPassword,
      plan,
    });

    if (result.error) {
      setLoading(false);
      setError(result.error);
      return;
    }

    // Sign in with the newly created credentials
    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (signInError) {
      setLoading(false);
      setError("Gym created, but sign-in failed. Please go to /login.");
      return;
    }

    // If paid plan, initiate Paystack payment
    if (plan !== "starter") {
      try {
        const res = await fetch("/api/paystack/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, tenantId: result.tenantId }),
        });
        const json = await res.json();
        if (json.authorization_url) {
          window.location.href = json.authorization_url;
          return;
        }
      } catch {
        // Payment init failed — still continue to dashboard (trialing)
      }
    }

    window.location.href = ROUTES.GYM_ADMIN;
  }

  const steps = ["Your Gym", "Your Account", "Choose a Plan"];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-14 items-center border-b border-border px-6">
        <Link href={ROUTES.HOME} className="text-sm font-semibold text-foreground">
          VirtualGYM
        </Link>
        <span className="ml-2 text-sm text-muted-foreground">· Set up your gym</span>
      </header>

      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {steps.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3;
            const active = step === n;
            const done = step > n;
            return (
              <div key={n} className="flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                      ? "border-2 border-primary text-primary"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {done ? "✓" : n}
                </div>
                <span
                  className={`text-sm ${active ? "font-medium text-foreground" : "text-muted-foreground"}`}
                >
                  {label}
                </span>
                {i < steps.length - 1 && (
                  <div className="mx-2 h-px w-6 bg-border" />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* ── Step 1: Gym Details ─────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Your Gym</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell us about your gym. You can change these details later.
              </p>
            </div>

            <div className="space-y-4">
              <Field label="Gym name">
                <input
                  type="text"
                  required
                  placeholder="Iron House Gym"
                  value={gymName}
                  onChange={(e) => handleGymNameChange(e.target.value)}
                  className="input"
                />
              </Field>

              <Field
                label="Gym URL"
                hint={`Members will access your gym at /g/${gymSlug || "your-gym"}`}
              >
                <div className="flex items-center gap-0 overflow-hidden rounded-xl border border-input bg-muted/40 opacity-75">
                  <span className="border-r border-border px-3 text-sm text-muted-foreground">/g/</span>
                  <input
                    type="text"
                    readOnly
                    placeholder="your-gym"
                    value={gymSlug}
                    className="flex-1 bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </Field>

              <Field label="Welcome message" hint="Optional — shown on your gym's homepage">
                <textarea
                  rows={3}
                  placeholder="Welcome to our gym! Get fit, stay strong."
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="input resize-none"
                />
              </Field>
            </div>

            <button
              onClick={() => {
                if (!gymName.trim() || !gymSlug.trim()) {
                  setError("Gym name and URL are required.");
                  return;
                }
                setError(null);
                setStep(2);
              }}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Step 2: Admin Account ───────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Your Account</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your admin account to manage {gymName}.
              </p>
            </div>

            <div className="space-y-4">
              <Field label="Full name">
                <input
                  type="text"
                  required
                  placeholder="Your name"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Email address">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Password" hint="Minimum 8 characters">
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="input"
                />
              </Field>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-accent"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!adminName.trim() || !adminEmail.trim() || adminPassword.length < 8) {
                    setError("Please fill in all fields. Password must be 8+ characters.");
                    return;
                  }
                  setError(null);
                  setStep(3);
                }}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Plan Selection ──────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Choose a Plan</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                You can upgrade or downgrade at any time.
              </p>
            </div>

            <div className="space-y-3">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    plan === p.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{p.name}</span>
                        {p.highlighted && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-foreground">{p.price}</span>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="text-primary">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-accent"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <Spinner />
                ) : (
                  PLANS.find((p) => p.id === plan)?.cta ?? "Get Started"
                )}
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              By continuing you agree to our{" "}
              <Link href="/contact" className="underline">
                Terms of Service
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Small components ──────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="mx-auto h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
