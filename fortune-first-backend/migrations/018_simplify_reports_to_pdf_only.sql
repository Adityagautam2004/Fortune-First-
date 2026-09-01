-- Reports go back to being simple: month/year, three headline numbers, and
-- the uploaded PDF as the actual artifact — no more per-head breakdown,
-- investment pattern, partner payouts, NAV, or a web-generated copy.
-- monthly_reports has zero rows at the time of this migration (confirmed),
-- so this drops/adds columns directly with no backfill needed.

ALTER TABLE monthly_reports
  DROP COLUMN IF EXISTS total_aum_next_month,
  DROP COLUMN IF EXISTS nav_previous,
  DROP COLUMN IF EXISTS nav_updated,
  DROP COLUMN IF EXISTS overall_profit_percentage,
  DROP COLUMN IF EXISTS overall_profit_amount,
  DROP COLUMN IF EXISTS members,
  DROP COLUMN IF EXISTS investment_pattern,
  DROP COLUMN IF EXISTS partner_payouts,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS generated_pdf_url,
  ADD COLUMN IF NOT EXISTS total_payout NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_profit NUMERIC(15,2) NOT NULL DEFAULT 0,
  ALTER COLUMN pdf_url SET NOT NULL;
