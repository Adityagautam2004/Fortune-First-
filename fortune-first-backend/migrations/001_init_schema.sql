-- Enables the crypto utility extension for automated UUID creation inside Postgres
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create the Custom ENUM Roles needed for our strictly enforced RBAC system
CREATE TYPE user_role AS ENUM ('customer', 'investment_head', 'business_head', 'super_admin');
CREATE TYPE investment_status AS ENUM ('active', 'exited', 'suspended');
CREATE TYPE payout_status AS ENUM ('pending', 'paid', 'skipped');

-- 2. Master Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    phone VARCHAR(15),
    is_active BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT TRUE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- Connects client to their Investment Head
    shareholding_pct NUMERIC(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Investments Table (Enforces minimum constraints directly inside the data engine)
CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount >= 5000), -- Financial check rule
    investment_date DATE NOT NULL,
    week_of_month SMALLINT NOT NULL CHECK (week_of_month BETWEEN 1 AND 4),
    tenure_months SMALLINT DEFAULT 3,
    status investment_status DEFAULT 'active',
    exit_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Monthly Returns / Payouts Table
CREATE TABLE IF NOT EXISTS monthly_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year SMALLINT NOT NULL,
    return_pct NUMERIC(5,2) NOT NULL,
    payout_amount NUMERIC(15,2) NOT NULL,
    payout_status payout_status DEFAULT 'pending',
    payout_date DATE,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_investment_monthly_payout UNIQUE (investment_id, month, year) -- Anti-duplicate transaction shield
);