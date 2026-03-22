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
      className="text-xs text-muted-foreground hover:text-foreground"
    >
      Sign Out
    </button>
  );
}
