-- Firm-wide stock portfolio (FR-PORTFOLIO-01): a single shared book of
-- positions that business_head manages (buy/sell/add-more) and
-- admin/investment_head/business_head all view. Supersedes the old
-- per-owner `portfolio_positions` table (left in place, unused, in case
-- anyone wants its data — nothing in the app references it anymore).

DO $$ BEGIN
    CREATE TYPE stock_transaction_type AS ENUM ('buy', 'sell');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS stock_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    average_price NUMERIC(14,4) NOT NULL CHECK (average_price >= 0),
    added_by UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The buy/sell log ("Funds Transactions"). Symbol/company_name are
-- denormalized from the position at the time of the trade so the log stays
-- accurate even if a position is later fully closed.
CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES stock_positions(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    transaction_type stock_transaction_type NOT NULL,
    quantity NUMERIC(14,4) NOT NULL CHECK (quantity > 0),
    price NUMERIC(14,4) NOT NULL CHECK (price >= 0),
    profit_loss NUMERIC(14,2),
    business_head_id UUID NOT NULL REFERENCES users(id),
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_positions_added_by ON stock_positions(added_by);
CREATE INDEX IF NOT EXISTS idx_stock_positions_is_active ON stock_positions(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_business_head ON stock_transactions(business_head_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_type ON stock_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON stock_transactions(transaction_date);
