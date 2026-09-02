-- Optional payment screenshot as proof of payout, mirroring
-- investments.payment_screenshot_url. Nullable — marking a payout as paid
-- never requires one.
ALTER TABLE monthly_returns ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
