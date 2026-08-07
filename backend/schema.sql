CREATE TABLE IF NOT EXISTS pastes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'plain_text',
  created_at TEXT NOT NULL,
  expires_at TEXT,
  views INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS links (
  slug TEXT PRIMARY KEY,
  original_url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  clicks INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  r2_key TEXT NOT NULL,
  encrypted INTEGER NOT NULL DEFAULT 0,
  encryption_algorithm TEXT,
  encryption_kdf TEXT,
  encryption_iterations INTEGER,
  encryption_salt TEXT,
  encryption_iv TEXT,
  encryption_metadata_iv TEXT,
  encrypted_metadata TEXT
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  downloads INTEGER NOT NULL DEFAULT 0,
  r2_key TEXT NOT NULL,
  encrypted INTEGER NOT NULL DEFAULT 0,
  encryption_algorithm TEXT,
  encryption_iv TEXT,
  encryption_metadata_iv TEXT,
  encrypted_metadata TEXT
);