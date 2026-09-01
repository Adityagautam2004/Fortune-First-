-- Collapses payouts from "one row per investment per month" to "one row
-- per CLIENT per month" — a client's multiple investments are one aggregate
-- position for payout purposes (still individually recorded in the
-- `investments` table for history/counting; only the payout ledger
-- changes). Proration for the aggregate payout uses the client's EARLIEST
-- active investment's week_of_month, computed at processing time — not
-- persisted here, since it can shift as investments are added/exited.
--
-- Guarded so this only runs once: `npm run migrate` re-applies every file
-- on every run (no applied-migrations tracking table), so without this
-- guard the TRUNCATE below would wipe real payout data on every deploy,
-- and the bare ADD COLUMNs would fail with a duplicate-column error the
-- second time. monthly_returns had zero real rows when this was first
-- written, so the one-time TRUNCATE was safe then and is now a no-op.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_returns' AND column_name = 'investment_id'
  ) THEN
    TRUNCATE TABLE monthly_returns;
    ALTER TABLE monthly_returns DROP CONSTRAINT IF EXISTS unique_investment_monthly_payout;
    ALTER TABLE monthly_returns DROP COLUMN investment_id;
    ALTER TABLE monthly_returns ADD COLUMN customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE;
    -- Snapshot of the aggregate active-investment total this payout was
    -- calculated against — stored directly (not re-derived via a join) so
    -- the historical record stays accurate even if investments change later.
    ALTER TABLE monthly_returns ADD COLUMN invested_amount NUMERIC(15,2) NOT NULL;
    ALTER TABLE monthly_returns ADD CONSTRAINT unique_customer_monthly_payout UNIQUE (customer_id, month, year);
  END IF;
END $$;
