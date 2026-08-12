-- Captures tables that were created directly against the live database
-- (outside any prior migration file) so a fresh setup reproduces them.

-- 1. Enum used by chat_messages.message_type
DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Join Requests — public "request to invest" submissions reviewed by admins
CREATE TABLE IF NOT EXISTS join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    amount VARCHAR(50),
    message TEXT,
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chat Messages — support/board messaging threads
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id),
    conversation_id VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    message_type message_type DEFAULT 'text',
    read_by UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Portfolio Positions — per-customer holdings tracked separately from investments
CREATE TABLE IF NOT EXISTS portfolio_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    buy_price NUMERIC(10,2) NOT NULL,
    buy_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
