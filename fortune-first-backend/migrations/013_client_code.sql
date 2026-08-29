-- Human-readable client IDs (FR-ADMIN-22): "FF" + creation month/year (MMYY)
-- + a 4-digit sequential count, e.g. FF06240007. Customer-role users only —
-- staff accounts (investment_head/business_head/super_admin) never get one.
--
-- A dedicated sequence (not COUNT(*)+1) makes the number assignment
-- race-safe under concurrent admin requests, and it's called from directly
-- inside the INSERT in createUser (admin.controller.js) via a CASE
-- expression, which Postgres only evaluates for rows that actually match
-- role = 'customer' — non-customer inserts never touch the sequence.
CREATE SEQUENCE IF NOT EXISTS client_code_seq START 1;

ALTER TABLE users ADD COLUMN IF NOT EXISTS client_code VARCHAR(12) UNIQUE;

-- Backfill any customers created before this feature existed, oldest first,
-- so the sequence stays continuous with whatever gets created going forward.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, created_at FROM users WHERE role = 'customer' AND client_code IS NULL ORDER BY created_at ASC
    LOOP
        UPDATE users
        SET client_code = 'FF' || to_char(r.created_at, 'MMYY') || LPAD(nextval('client_code_seq')::text, 4, '0')
        WHERE id = r.id;
    END LOOP;
END $$;
