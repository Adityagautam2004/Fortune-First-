-- Emails are compared lowercase at login, but accounts used to be stored
-- exactly as typed ("John@X.com"), which locked those users out. New writes
-- are normalised in the app; this lowercases the existing rows.
-- Idempotent (only touches rows that aren't already lowercase), and skips any
-- row whose lowercase form would collide with another account — those need a
-- manual decision about which account to keep.
UPDATE users u
SET email = LOWER(TRIM(u.email)), updated_at = NOW()
WHERE u.email <> LOWER(TRIM(u.email))
  AND NOT EXISTS (
    SELECT 1 FROM users o
    WHERE o.id <> u.id AND LOWER(TRIM(o.email)) = LOWER(TRIM(u.email))
  );
