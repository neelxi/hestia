import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { ClientMobileSidebar } from "./mobile-sidebar";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  FileText,
  CalendarDays,
} from "lucide-react";

const navItems = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/accounts", label: "Accounts", icon: Building2 },
  { href: "/client/projects", label: "Projects", icon: FolderKanban },
  { href: "/client/documents", label: "Documents", icon: FileText },
  { href: "/client/meetings", label: "Meetings", icon: CalendarDays },
];

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
        <div className="flex h-14 items-center border-b px-5">
          <Link href="/client/dashboard" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
              H
            </div>
            <span className="text-lg font-semibold tracking-tight">Hestia</span>
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
          <p className="truncate text-xs text-muted-foreground">Client</p>
        </div>
      </aside>

      {/* Mobile header + sheet */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b px-4 md:hidden">
          <ClientMobileSidebar
            navItems={navItems.map(({ href, label }) => ({ href, label }))}
            profile={profile}
          />
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              H
            </div>
            <span className="text-lg font-semibold tracking-tight">Hestia</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
