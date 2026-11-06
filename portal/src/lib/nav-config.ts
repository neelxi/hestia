import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  BookOpen,
  Activity,
  BarChart3,
  FileText,
  UserPlus,
  DollarSign,
  Building2,
  FileStack,
  Mail,
} from "lucide-react";
import type { PortalMode } from "./portal-mode";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  brokerageOnly?: boolean;
  hestiaOnly?: boolean;
}

export function getNavItems(mode: PortalMode): NavItem[] {
  const base: NavItem[] = [
    { href: "/team/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/team/applications", label: "Applications", icon: FileText },
    { href: "/team/leads", label: "Leads", icon: UserPlus },
    { href: "/team/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/team/directives", label: "Directives", icon: BookOpen },
    { href: "/team/activity", label: "Activity", icon: Activity },
    { href: "/team/metrics", label: "Metrics", icon: BarChart3 },
  ];

  if (mode === "brokerage") {
    return [
      { href: "/team/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/team/agents", label: "Agents", icon: Users, brokerageOnly: true },
      { href: "/team/transactions", label: "Transactions", icon: FolderKanban, brokerageOnly: true },
      { href: "/team/commissions", label: "Commissions", icon: DollarSign, brokerageOnly: true },
      { href: "/team/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/team/activity", label: "Activity", icon: Activity },
      { href: "/team/metrics", label: "Metrics", icon: BarChart3 },
    ];
  }

  // Hestia mode
  return [
    ...base.slice(0, 3),
    { href: "/team/clients", label: "Clients", icon: Users, hestiaOnly: true },
    { href: "/team/projects", label: "Projects", icon: FolderKanban, hestiaOnly: true },
    { href: "/team/campaigns", label: "Campaigns", icon: Mail, hestiaOnly: true },
    ...base.slice(3),
    { href: "/team/docs", label: "Docs", icon: FileStack, hestiaOnly: true },
    { href: "/team/capacity", label: "Capacity", icon: Building2 },
    { href: "/team/financial", label: "Financial", icon: DollarSign, hestiaOnly: true },
  ];
}
