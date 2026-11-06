/**
 * Portal deployment mode. Set NEXT_PUBLIC_PORTAL_MODE in env.
 * - "brokerage" = Real estate brokerage (agents, transactions, commissions)
 * - "hestia" (default) = Hestia infrastructure (clients, projects)
 */
export type PortalMode = "brokerage" | "hestia";

export function getPortalMode(): PortalMode {
  const mode = process.env.NEXT_PUBLIC_PORTAL_MODE?.toLowerCase();
  if (mode === "brokerage") return "brokerage";
  return "hestia";
}

export const isBrokerageMode = () => getPortalMode() === "brokerage";
