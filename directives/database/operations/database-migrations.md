---
title: Database Migrations
category: operations
trigger: manual
description: >
  Rules for changing the Supabase database schema. Migrations are immutable
  once applied — add new ones, never edit existing.
inputs:
  - schema change (new table, column, RLS policy, etc.)
outputs:
  - New migration file in supabase/migrations/
  - Applied schema on next db push
tools:
  - npx supabase db push
  - supabase/migrations/*.sql
verification:
  - Migration applies without error
  - Existing data preserved (unless migration explicitly alters/drops)
---

# Database Migrations SOP

## Purpose

Define how to change the database schema safely. Supabase tracks migrations by filename — once applied, they are never re-run.

---

## Critical Rule: Never Edit Applied Migrations

**Do not modify migration files that have already been applied** (locally or remotely).

- Supabase records which migrations ran in `schema_migrations`
- Applied migrations are skipped on `db push` — your edits will not run
- Editing 001–004 after they ran means the DB keeps the old schema; only new migrations (e.g. 005) apply
- **Fix:** Add a new migration (006, 007, …) for schema changes

---

## Workflow for Schema Changes

1. **Create a new migration file** in `supabase/migrations/`:
   - Name: `NNN_description.sql` (e.g. `006_add_client_notes.sql`)
   - Use the next sequential number.

2. **Write the migration** — `ALTER TABLE`, `CREATE TABLE`, etc. Migrations are additive; avoid dropping data unless you intend to.

3. **Apply:**
   ```bash
   npx supabase db push
   ```

4. **Commit** the migration file with your code changes.

---

## When a Reset Is Needed

`npx supabase db reset` wipes the database and re-runs all migrations from scratch. Use only when:

- Local development
- No data to preserve
- You intentionally rewrote old migrations (rare; prefer adding new ones)

---

## Learnings

- **Rewriting migrations:** If you rewrote 001–004 after they were applied, the new schema never ran. Only `db reset` (or a new migration that converts the schema) fixes it. Going forward: add new migrations, never edit applied ones.
