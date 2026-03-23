"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function SignOutButton({ gymSlug }: { gymSlug: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push(`/g/${gymSlug}`);
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
    >
      Sign out
    </button>
  );
}
