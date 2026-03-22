import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware responsibilities:
 * 1. Refresh Supabase session on every request (keeps JWT fresh)
 * 2. Protect admin routes — redirect to /login if unauthenticated
 * 3. Protect member-only gym routes (history, progress)
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write updated cookies onto both request and response so the
          // session stays fresh for the rest of this request chain.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: use getUser() not getSession() — getUser() re-validates
  // the JWT with Supabase Auth server, preventing token forgery.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ─── Admin route protection ───────────────────────────────────────
  const isAdminRoute =
    pathname.startsWith("/gym-admin") ||
    pathname.startsWith("/super-admin");

  if (isAdminRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ─── Member-only gym routes ───────────────────────────────────────
  // /g/[gymSlug]/history and /g/[gymSlug]/progress require auth.
  // Other gym routes (/workouts, session) are public (Starter plan).
  const memberOnlyPattern = /^\/g\/[^/]+\/(history|progress)/;

  if (memberOnlyPattern.test(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
