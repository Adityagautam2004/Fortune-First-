-- Collapses payouts from "one row per investment per month" to "one row
-- per CLIENT per month" — a client's multiple investments are one aggregate
-- position for payout purposes (still individually recorded in the
-- `investments` table for history/counting; only the payout ledger
-- changes). Proration for the aggregate payout uses the client's EARLIEST
-- active investment's week_of_month, computed at processing time — not
-- persisted here, since it can shift as investments are added/exited.
--
-- monthly_returns currently has zero real rows (confirmed before writing
-- this migration) — wiping it is safe and avoids having to backfill/guess
-- a customer_id for old per-investment test rows.
TRUNCATE TABLE monthly_returns;

ALTER TABLE monthly_returns
  DROP CONSTRAINT IF EXISTS unique_investment_monthly_payout,
  DROP COLUMN IF EXISTS investment_id,
  ADD COLUMN customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Snapshot of the aggregate active-investment total this payout was
  -- calculated against — stored directly (not re-derived via a join) so
  -- the historical record stays accurate even if investments change later.
  ADD COLUMN invested_amount NUMERIC(15,2) NOT NULL,
  ADD CONSTRAINT unique_customer_monthly_payout UNIQUE (customer_id, month, year);
