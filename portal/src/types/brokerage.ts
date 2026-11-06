/**
 * Brokerage-specific types (real estate brokerages).
 * Used when NEXT_PUBLIC_PORTAL_MODE=brokerage.
 */

export interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  license_number: string | null;
  license_expiry: string | null;
  team_id: string | null;
  status: string;
  eo_policy_expiry: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  address: string;
  list_price: number | null;
  status: string;
  type: string | null;
  listing_agent_id: string | null;
  buyer_agent_id: string | null;
  closing_date: string | null;
  contingency_date: string | null;
  inspection_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  agent_id: string;
  transaction_id: string | null;
  split_percent: number | null;
  cap_amount: number | null;
  cap_progress: number | null;
  amount: number | null;
  status: string;
  disbursement_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  source: string | null;
  email: string;
  name: string | null;
  phone: string | null;
  agent_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}
