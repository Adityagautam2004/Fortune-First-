-- Adds the client's city to testimonials, needed by the public landing-page
-- dashboard section (FR-PUBLIC-17/18, FR-ADMIN-18).
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS city VARCHAR(100);
