-- FR-ADMIN-21 requires audit_logs to capture old_value and the actor's IP
-- address alongside new_value — both were missing from the original table.
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_value JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip VARCHAR(45);
