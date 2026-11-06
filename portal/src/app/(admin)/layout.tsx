import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/helpers";
import { AdminMobileSidebar } from "./mobile-sidebar";
import {
  Settings,
  Users,
  FileStack,
  Plug,
} from "lucide-react";

const navItems = [
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/templates", label: "Templates", icon: FileStack },
  { href: "/admin/integrations", label: "Integrations", icon: Plug },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile;
  try {
    profile = await requireRole(["admin"]);
  } catch {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
        <div className="flex h-14 items-center border-b px-5">
          <Link href="/admin/settings" className="text-lg font-semibold tracking-tight">
            Hestia <span className="text-xs font-normal text-muted-foreground">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t px-5 py-4">
          <p className="truncate text-sm font-medium">{profile.display_name}</p>
          <p className="truncate text-xs text-muted-foreground capitalize">{profile.role}</p>
        </div>
      </aside>

      {/* Mobile */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b px-4 md:hidden">
          <AdminMobileSidebar
            navItems={navItems.map(({ href, label }) => ({ href, label }))}
            profile={profile}
          />
          <span className="text-lg font-semibold tracking-tight">
            Hestia <span className="text-xs font-normal text-muted-foreground">Admin</span>
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
