import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/helpers";
import { LayoutDashboard } from "lucide-react";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile;
  try {
    profile = await requireRole(["agent"]);
  } catch {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-64 border-r bg-background md:flex md:flex-col">
        <div className="flex h-14 items-center border-b px-5">
          <Link href="/agent/dashboard" className="text-lg font-semibold tracking-tight">
            Hestia Agent
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4">
          <Link
            href="/agent/dashboard"
            className="flex items-center gap-3 rounded-md bg-muted px-3 py-2 text-sm font-medium"
          >
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        </nav>
        <div className="border-t px-5 py-4">
          <p className="truncate text-sm font-medium">{profile.display_name}</p>
          <p className="text-xs text-muted-foreground">Agent</p>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  );
}
