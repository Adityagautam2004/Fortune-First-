-- Trims monthly_reports down to what was actually asked for — several
-- columns were pulled in from the sample PDF rather than the original spec
-- (report-wide client payout aggregate, company result, profit saving,
-- employees payout, freeform withdrawals/investments line items). The
-- per-member client money/payout fields (inside the members JSONB column)
-- are untouched — those were always part of the ask.
ALTER TABLE monthly_reports
  DROP COLUMN IF EXISTS client_payout_percentage,
  DROP COLUMN IF EXISTS client_total_money,
  DROP COLUMN IF EXISTS client_payout_amount,
  DROP COLUMN IF EXISTS client_payout_status,
  DROP COLUMN IF EXISTS company_result_amount,
  DROP COLUMN IF EXISTS profit_saving_percentage,
  DROP COLUMN IF EXISTS profit_saving_amount,
  DROP COLUMN IF EXISTS profit_saving_left_amount,
  DROP COLUMN IF EXISTS employees_payout_amount,
  DROP COLUMN IF EXISTS withdrawals,
  DROP COLUMN IF EXISTS investments;

-- operating_capital_total stays as a column (still handy for the list view
-- to sort/display without recomputing from JSONB) but is no longer a
-- hand-typed form field — it's now always SUM(members[].personalAum),
-- computed server-side on every create/update.
