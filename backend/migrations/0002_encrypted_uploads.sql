-- Adds optional client-side encryption metadata for uploads.
-- Run against existing D1 databases before deploying encrypted upload support.

ALTER TABLE images ADD COLUMN encrypted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE images ADD COLUMN encryption_algorithm TEXT;
ALTER TABLE images ADD COLUMN encryption_kdf TEXT;
ALTER TABLE images ADD COLUMN encryption_iterations INTEGER;
ALTER TABLE images ADD COLUMN encryption_salt TEXT;
ALTER TABLE images ADD COLUMN encryption_iv TEXT;
ALTER TABLE images ADD COLUMN encryption_metadata_iv TEXT;
ALTER TABLE images ADD COLUMN encrypted_metadata TEXT;

ALTER TABLE files ADD COLUMN encrypted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE files ADD COLUMN encryption_algorithm TEXT;
ALTER TABLE files ADD COLUMN encryption_iv TEXT;
ALTER TABLE files ADD COLUMN encryption_metadata_iv TEXT;
ALTER TABLE files ADD COLUMN encrypted_metadata TEXT;