-- New withdrawal request/approval flow (FR-WD-01..05): investment_head files a
-- request for a client, admin settles it (completed, with an optional payment
-- screenshot as proof) or rejects it. Mirrors the investments table shape so
-- the unified transactions UNION query can normalize the two consistently.
DO $$ BEGIN
    CREATE TYPE withdrawal_status AS ENUM ('pending', 'completed', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount >= 5000),
    withdrawal_date DATE NOT NULL,
    week_of_month SMALLINT CHECK (week_of_month BETWEEN 1 AND 4),
    notes TEXT,
    status withdrawal_status DEFAULT 'pending',
    payment_screenshot_url TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
