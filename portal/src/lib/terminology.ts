import { getPortalMode } from "./portal-mode";

export interface Terminology {
  client: string;
  clients: string;
  project: string;
  projects: string;
}

const HESTIA_TERMS: Terminology = {
  client: "Brokerage",
  clients: "Brokerages",
  project: "Engagement",
  projects: "Engagements",
};

const DEFAULT_TERMS: Terminology = {
  client: "Client",
  clients: "Clients",
  project: "Project",
  projects: "Projects",
};

export function getTerminology(): Terminology {
  return getPortalMode() === "hestia" ? HESTIA_TERMS : DEFAULT_TERMS;
}

export function getClientLabel(singular = true): string {
  return getTerminology()[singular ? "client" : "clients"];
}

export function getProjectLabel(singular = true): string {
  return getTerminology()[singular ? "project" : "projects"];
}
