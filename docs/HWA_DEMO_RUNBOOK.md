# HWA Demo Runbook

This is the shortest reliable path for showing Hestia as an operational system for a real estate brokerage. The demo uses the fictional **Summit Realty** dataset and should take four to five minutes.

## One-time setup

1. Create a dedicated Supabase project for the demo.
2. Apply `brokerage/migrations/001_initial_brokerage_schema.sql`, followed by `brokerage/migrations/002_security_hardening.sql`.
3. Disable public user registration in Supabase Auth.
4. Create the demo owner in Supabase Auth. The first account becomes the admin; later accounts default to agent and can be reassigned deliberately in `profiles`.
5. Copy `.env.example` to `.env`, add the demo Supabase URL and service-role key, then run:

   ```bash
   python3 scripts/seed_brokerage_demo.py
   ```

6. Deploy `portal/` with these environment variables:

   ```text
   NEXT_PUBLIC_PORTAL_MODE=brokerage
   NEXT_PUBLIC_SIGNUP_ENABLED=false
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

Never expose the service-role key in a browser, screenshot, recording, or client-side variable.

## The five-minute story

### 1. Start with the problem (20 seconds)

“Brokerage operations are split across spreadsheets, inboxes, CRMs, and transaction tools. Hestia gives the owner one operating layer for people, deals, deadlines, commissions, and AI-executed procedures.”

### 2. Dashboard: prove operational visibility (45 seconds)

Open **Dashboard**. Point out active agents, transactions, open tasks, pending commissions, recent automated activity, and the overdue inspection task. Emphasize that the screen is live data, not a static mockup.

### 3. Transaction: show the connected record (60 seconds)

Open **Transactions**, then **742 Lakeview Avenue**. Show the assigned agent, closing date, closing checklist, and commission. Explain that Hestia ties the work and money to the underlying deal.

### 4. Agent: show the owner and agent perspectives (45 seconds)

Open **Agents**, then **Sofia Martinez**. Show her deal pipeline and license date. Explain that Hestia surfaces compliance risk before it becomes an emergency. If the agent login is configured, briefly switch to it to show the limited personal dashboard.

### 5. Commissions: show financial operations (45 seconds)

Open **Commissions**. Show the pending total, approved item, paid item, and a disputed commission needing attention. This demonstrates an actual queue, not merely a report.

### 6. Execute work live (60 seconds)

Create a transaction or add a task to an existing transaction. Return to the dashboard or transaction detail to show it immediately in context. If the MCP client is connected, ask it to list pending-close transactions and create a follow-up task, then show the activity trail.

### 7. Close on the product wedge (20 seconds)

“Hestia does not ask a brokerage to replace every tool. It connects the records that already matter, turns SOPs into trackable workflows, and gives humans and AI the same controlled operating context.”

## Pre-demo checklist

- Production build and lint checks pass.
- The demo URL opens in an incognito window.
- The owner login works and public signup is unavailable.
- Dashboard counts are populated after running the seed script.
- Add Agent, Add Transaction, task creation, and detail-page links work.
- There are no real client names, addresses, credentials, or personal data in the demo.
- A backup screen recording and two screenshots are available in case venue Wi-Fi fails.
- Browser notifications, password-manager prompts, and developer tools are closed.

## If time is cut to 90 seconds

Show Dashboard, 742 Lakeview Avenue, and Commissions. End with the product-wedge statement above.
