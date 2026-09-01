-- Firm-wide "Monthly Report" section (FR-REPORTS-01): a hand-curated
-- monthly summary — headline numbers, a per-investment-head breakdown, the
-- board's own investment stake pattern, partner/client/employee payouts,
-- and freeform withdrawal/investment line items — plus the original manual
-- PDF and a beautifully formatted web-generated equivalent. Visible to
-- every non-client role; only super_admin can create/edit/delete.

CREATE TABLE IF NOT EXISTS monthly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),

    total_aum_next_month NUMERIC(14,2) NOT NULL DEFAULT 0,
    nav_previous NUMERIC(10,4) NOT NULL DEFAULT 0,
    nav_updated NUMERIC(10,4) NOT NULL DEFAULT 0,

    overall_profit_percentage NUMERIC(6,3) NOT NULL DEFAULT 0,
    overall_profit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,

    client_payout_percentage NUMERIC(6,3) NOT NULL DEFAULT 0,
    client_total_money NUMERIC(14,2) NOT NULL DEFAULT 0,
    client_payout_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    client_payout_status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (client_payout_status IN ('paid', 'pending')),

    -- Signed: positive = company profit after client payout, negative = loss.
    company_result_amount NUMERIC(14,2) NOT NULL DEFAULT 0,

    profit_saving_percentage NUMERIC(6,3) NOT NULL DEFAULT 0,
    profit_saving_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    profit_saving_left_amount NUMERIC(14,2) NOT NULL DEFAULT 0,

    employees_payout_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    operating_capital_total NUMERIC(14,2) NOT NULL DEFAULT 0,

    -- Per-investment-head breakdown: [{ name, personalAum, profitLossAmount,
    -- rdCost, investmentReceived, withdrawalAmount, clientMoney,
    -- payoutPercentage, payoutAmount }]. Free-text names, not user FKs —
    -- real-world report subjects (e.g. silent partners) don't all have
    -- platform accounts.
    members JSONB NOT NULL DEFAULT '[]',

    -- The board's own capital stake in the firm: [{ name, amount }].
    -- Prefilled from the previous month's report when adding a new one.
    investment_pattern JSONB NOT NULL DEFAULT '[]',

    -- Non-client payouts (partners/employees getting a % of their stake):
    -- [{ name, percentage, amount, status }].
    partner_payouts JSONB NOT NULL DEFAULT '[]',

    -- Freeform narrative line items: [{ description, amount }].
    withdrawals JSONB NOT NULL DEFAULT '[]',
    investments JSONB NOT NULL DEFAULT '[]',

    notes TEXT,

    pdf_url TEXT,           -- the original manually-authored PDF (Cloudinary)
    generated_pdf_url TEXT, -- the web-generated equivalent (Cloudinary), regenerated on every save

    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (month, year)
);

CREATE INDEX IF NOT EXISTS idx_monthly_reports_year_month ON monthly_reports(year DESC, month DESC);
