-- Persist whether a stock position was bought Regular or on MTF (margin).
-- DEFAULT 'regular' keeps every existing row valid with no backfill step.
ALTER TABLE stock_positions
  ADD COLUMN IF NOT EXISTS order_type VARCHAR(10) NOT NULL DEFAULT 'regular'
  CHECK (order_type IN ('regular', 'mtf'));

-- Same column on the per-trade log (stock_transactions / "Funds
-- Transactions") so it can be shown per buy/sell entry too, not just per
-- position. Carried through on every insert (initial buy, "Add More", and
-- sell) from whichever position the trade belongs to — order type is fixed
-- at position creation, not chosen again per trade.
ALTER TABLE stock_transactions
  ADD COLUMN IF NOT EXISTS order_type VARCHAR(10) NOT NULL DEFAULT 'regular'
  CHECK (order_type IN ('regular', 'mtf'));
