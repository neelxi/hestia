import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// API routes that don't require auth - skip middleware entirely
const SKIP_AUTH_PATHS = ["/api/webhooks", "/api/apply", "/api/leads"];

const BROKERAGE_BLOCKED_PATHS = [
  "/team/campaigns",
  "/team/capacity",
  "/team/clients",
  "/team/directives",
  "/team/docs",
  "/team/financial",
  "/team/metrics",
  "/team/notes",
  "/team/projects",
];

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (SKIP_AUTH_PATHS.some((p) => path.startsWith(p))) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in middleware");
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Allow unauthenticated access to login/signup pages
    if (path.startsWith("/login") || path.startsWith("/signup")) {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Fetch profile once for all role-based logic
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  const role = profile?.role || "team";

  if (path.startsWith("/login") || path.startsWith("/signup")) {
    const url = request.nextUrl.clone();
    url.pathname =
      role === "client"
        ? "/client/dashboard"
        : role === "agent"
          ? "/agent/dashboard"
          : "/team/dashboard";
    return NextResponse.redirect(url);
  }

  if (path === "/") {
    const url = request.nextUrl.clone();
    url.pathname =
      role === "client"
        ? "/client/dashboard"
        : role === "agent"
          ? "/agent/dashboard"
          : "/team/dashboard";
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/client") && role !== "client") {
    const url = request.nextUrl.clone();
    url.pathname = "/team/dashboard";
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/team") && !["admin", "team"].includes(role)) {
    const url = request.nextUrl.clone();
    url.pathname = role === "agent" ? "/agent/dashboard" : "/client/dashboard";
    return NextResponse.redirect(url);
  }

  if (
    process.env.NEXT_PUBLIC_PORTAL_MODE === "brokerage" &&
    BROKERAGE_BLOCKED_PATHS.some((blockedPath) => path.startsWith(blockedPath))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/team/dashboard";
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/agent") && role !== "agent") {
    const url = request.nextUrl.clone();
    url.pathname = role === "client" ? "/client/dashboard" : "/team/dashboard";
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/admin") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname =
      role === "client"
        ? "/client/dashboard"
        : role === "agent"
          ? "/agent/dashboard"
          : "/team/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
  } catch (err) {
    console.error("Middleware error:", err);
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }
}
