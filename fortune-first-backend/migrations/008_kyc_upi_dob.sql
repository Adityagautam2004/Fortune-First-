-- Adds UPI ID and date of birth as additional required KYC fields
-- (customer-requested onboarding fields, not tied to a specific FR).
ALTER TABLE kyc_details ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100);
ALTER TABLE kyc_details ADD COLUMN IF NOT EXISTS date_of_birth DATE;
