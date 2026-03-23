"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { ROUTES } from "@/lib/constants";

const emailSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const phoneSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number is too short"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "Code must be exactly 6 digits"),
  phone: z.string(),
});

interface SignupFormProps {
  gymName?: string | null;
}

export function SignupForm({ gymName }: SignupFormProps) {
  const searchParams = useSearchParams();
  const gymSlug = searchParams.get("gym");
  const next = searchParams.get("next") ?? (gymSlug ? `/g/${gymSlug}` : "/");

  const [tab, setTab] = useState<"email" | "phone">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [currentPhone, setCurrentPhone] = useState("");

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { fullName: "", email: "", password: "" },
    mode: "onChange",
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { fullName: "", phone: "" },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "", phone: "" },
  });

  const supabase = createBrowserSupabaseClient();

  async function handleEmailSignUp(data: z.infer<typeof emailSchema>) {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        data: { full_name: data.fullName, ...(gymSlug ? { gym_slug: gymSlug } : {}) },
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone("Check your email — we've sent you a confirmation link. Click it to activate your account.");
  }

  async function handleSendOtp(data: z.infer<typeof phoneSchema>) {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      phone: data.phone,
      options: { data: { full_name: data.fullName, ...(gymSlug ? { gym_slug: gymSlug } : {}) } },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setOtpSent(true);
    setCurrentPhone(data.phone);
    otpForm.setValue("phone", data.phone);
  }

  async function handleVerifyOtp(data: z.infer<typeof otpSchema>) {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ phone: data.phone, token: data.otp, type: "sms" });
    setLoading(false);
    if (error) { setError(error.message); return; }
    window.location.href = next;
  }

  async function handleOAuth(provider: "google" | "apple") {
    setLoading(true);
    setError(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) { setLoading(false); setError(error.message); }
  }

  if (done) {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z" />
          </svg>
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Check your email</h2>
          <p className="text-sm text-muted-foreground">{done}</p>
        </div>
        <Link href={ROUTES.LOGIN} className="block text-sm font-medium text-foreground underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create account</h1>
        <p className="text-sm text-muted-foreground">
          {gymName ? `Join ${gymName}` : "Sign up to get started"}
        </p>
      </div>

      <div className="space-y-2">
        <button onClick={() => handleOAuth("google")} disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50">
          <GoogleIcon /> Continue with Google
        </button>
        <button onClick={() => handleOAuth("apple")} disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50">
          <AppleIcon /> Continue with Apple
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</p>
      )}

      <Tabs.Root value={tab} onValueChange={(v) => { setTab(v as "email" | "phone"); setError(null); }}>
        <Tabs.List className="flex rounded-xl border border-border bg-muted/40 p-1">
          <Tabs.Trigger value="email" className="flex-1 rounded-lg py-2 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Email</Tabs.Trigger>
          <Tabs.Trigger value="phone" className="flex-1 rounded-lg py-2 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Phone</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="email" className="mt-4">
          <form onSubmit={emailForm.handleSubmit(handleEmailSignUp)} className="space-y-3">
            <Field label="Full name" error={emailForm.formState.errors.fullName?.message}>
              <input type="text" autoComplete="name" placeholder="Your name" {...emailForm.register("fullName")}
                className={`input ${emailForm.formState.errors.fullName ? "border-destructive focus:ring-destructive" : ""}`} />
            </Field>
            <Field label="Email" error={emailForm.formState.errors.email?.message}>
              <input type="email" autoComplete="email" placeholder="you@example.com" {...emailForm.register("email")}
                className={`input ${emailForm.formState.errors.email ? "border-destructive focus:ring-destructive" : ""}`} />
            </Field>
            <Field label="Password" error={emailForm.formState.errors.password?.message}>
              <input type="password" autoComplete="new-password" placeholder="Min 8 characters" {...emailForm.register("password")}
                className={`input ${emailForm.formState.errors.password ? "border-destructive focus:ring-destructive" : ""}`} />
            </Field>
            <SubmitButton loading={loading}>Create account</SubmitButton>
          </form>
        </Tabs.Content>

        <Tabs.Content value="phone" className="mt-4">
          {!otpSent ? (
            <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-3">
              <Field label="Full name" error={phoneForm.formState.errors.fullName?.message}>
                <input type="text" autoComplete="name" placeholder="Your name" {...phoneForm.register("fullName")}
                  className={`input ${phoneForm.formState.errors.fullName ? "border-destructive focus:ring-destructive" : ""}`} />
              </Field>
              <Field label="Phone number" error={phoneForm.formState.errors.phone?.message}>
                <input type="tel" autoComplete="tel" placeholder="+1 234 567 8900" {...phoneForm.register("phone")}
                  className={`input ${phoneForm.formState.errors.phone ? "border-destructive focus:ring-destructive" : ""}`} />
              </Field>
              <SubmitButton loading={loading}>Send code</SubmitButton>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-3">
              <Field label={`Code sent to ${currentPhone}`} error={otpForm.formState.errors.otp?.message}>
                <input type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" maxLength={6}
                  {...otpForm.register("otp")}
                  className={`input tracking-widest ${otpForm.formState.errors.otp ? "border-destructive focus:ring-destructive" : ""}`} />
              </Field>
              <SubmitButton loading={loading}>Verify &amp; create account</SubmitButton>
              <button type="button" onClick={() => { setOtpSent(false); otpForm.reset(); }}
                className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline">
                Use a different number
              </button>
            </form>
          )}
        </Tabs.Content>
      </Tabs.Root>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={ROUTES.LOGIN} className="font-medium text-foreground underline-offset-4 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading}
      className="mt-1 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50">
      {loading ? <Spinner /> : children}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-foreground" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.42.07 2.4.83 3.23.87 1.22-.24 2.39-1.03 3.72-.88 1.59.2 2.79.96 3.56 2.42-3.28 1.94-2.55 6.38.5 7.6-.57 1.6-1.32 3.18-3.01 4.85zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
