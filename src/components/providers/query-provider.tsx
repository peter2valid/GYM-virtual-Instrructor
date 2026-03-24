"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // General data: consider fresh for 5 minutes, keep in memory 30 min
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,

            // Always run queryFn even when browser thinks it's offline —
            // the service worker will serve cached Supabase responses.
            networkMode: "always",

            // One retry on failure with backoff, not three
            retry: 1,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),

            // Show stale data immediately while revalidating in background
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
          },
          mutations: {
            // Surface errors instead of silently swallowing them
            networkMode: "always",
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
