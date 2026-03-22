import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware — refreshes the Supabase session cookie on every request
 * and enforces auth guards on protected routes.
 *
 * Protected routes:
 *  - /gym-admin/*   → must be logged in (role check is done in server components)
 *  - /super-admin/* → must be logged in (role check is done in server components)
 *  - /dashboard     → must be logged in
 */
export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — keeps the cookie alive without needing a full sign-in
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith("/gym-admin") ||
    pathname.startsWith("/super-admin") ||
    pathname === "/dashboard";

  if (isProtected && !user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard",
    "/gym-admin/:path*",
    "/super-admin/:path*",
    // Also run on all routes to keep session refreshed (exclude static assets)
    "/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json).*)",
  ],
};
