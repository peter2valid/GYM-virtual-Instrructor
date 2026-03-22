// Browser-only export — safe to import in client components
export { createClient as createBrowserSupabaseClient } from "./client";

// NOTE: createServerSupabaseClient is NOT re-exported here because it imports
// next/headers, which cannot be bundled into client components.
// Server components / server actions should import directly:
//   import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * True when Supabase env vars are present and look like a real URL.
 * When false, query functions fall back to mock data so local dev
 * works without a connected Supabase project.
 */
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("https://");
