import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { getPortalMode } from "@/lib/portal-mode";
import { getNavItems } from "@/lib/nav-config";
import { MobileSidebar } from "./mobile-sidebar";

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const portalMode = getPortalMode();
  const navItems = getNavItems(portalMode);
  const brandName = portalMode === "brokerage" ? "Brokerage Portal" : "Hestia";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
        <div className="flex h-14 items-center border-b px-5">
          <Link href="/team/dashboard" className="text-lg font-semibold tracking-tight">
            {brandName}
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

      {/* Mobile header + sheet sidebar */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b px-4 md:hidden">
          <MobileSidebar navItems={navItems.map(({ href, label }) => ({ href, label }))} profile={profile} />
          <span className="text-lg font-semibold tracking-tight">{brandName}</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
