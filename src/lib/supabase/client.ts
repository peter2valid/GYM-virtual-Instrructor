import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton — reuse the same client across all components so the session
// is shared and never lost between renders or page transitions.
let _client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (_client) return _client;

  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,     // Store session in localStorage
        autoRefreshToken: true,   // Keep the JWT alive automatically
        detectSessionInUrl: true, // Handle OAuth / magic-link callbacks
      },
    }
  );

  return _client;
}
