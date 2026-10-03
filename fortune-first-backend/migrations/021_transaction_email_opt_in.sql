-- Per-request "Send email confirmation" opt-in chosen by the investment head
-- when recording an investment or withdrawal. Stored on the row because the
-- second email (approved / completed / rejected) is sent later, when the
-- admin decides the request. Existing rows default to no email.
ALTER TABLE investments ADD COLUMN IF NOT EXISTS send_email_confirmation BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS send_email_confirmation BOOLEAN NOT NULL DEFAULT FALSE;
