-- Profile picture, self-uploaded by any role (or set by an admin at creation
-- time for staff accounts) — surfaced by every endpoint that returns user details.
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
