CREATE TABLE comments (id TEXT PRIMARY KEY, parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE, page TEXT NOT NULL, locale TEXT NOT NULL CHECK (locale IN ('cn', 'en')), author TEXT NOT NULL, owner_hash TEXT NOT NULL, body TEXT NOT NULL, target TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'resolved')), deleted INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX comments_page ON comments(page, locale, created_at DESC, id);
CREATE INDEX comments_parent ON comments(parent_id, created_at, id);
CREATE TABLE rate_windows (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE INDEX rate_expiry ON rate_windows(expires);
