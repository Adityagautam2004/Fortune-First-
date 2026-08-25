-- Investments now go through admin approval before becoming active (FR-INV-APPROVAL).
-- Each ALTER TYPE ADD VALUE is its own statement — a value can't be used in the
-- same transaction block it was added in, so nothing here may reference these
-- new values (that happens in later app code / migration files only).
ALTER TYPE investment_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE investment_status ADD VALUE IF NOT EXISTS 'rejected';

ALTER TABLE investments ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
