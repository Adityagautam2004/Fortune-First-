-- Schema needed by: board.controller.js voidPayout, addInvestment, processPayout
-- (audit_logs); monthly_returns.payout_status 'voided' state; auth.controller.js
-- forgotPassword/resetPassword (users.reset_token / reset_token_expiry).

-- 1. Audit Logs — generic action log used across board actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add the 'voided' state to the existing payout_status enum
ALTER TYPE payout_status ADD VALUE IF NOT EXISTS 'voided';

-- 3. Password reset token support on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ;
