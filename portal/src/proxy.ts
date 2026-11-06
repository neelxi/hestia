import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Exclude static files, login, signup, and API routes that don't need auth
    "/((?!_next/static|_next/image|favicon.ico|login|signup|api/webhooks|api/apply|api/leads|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
