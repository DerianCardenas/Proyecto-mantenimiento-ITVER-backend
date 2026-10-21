-- Keep technician setup additive so existing records and tickets are preserved.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
