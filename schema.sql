-- Cool I Guess Crew — shared voting (Cloudflare D1)
-- Run once against the bound D1 database (see setup steps).

CREATE TABLE IF NOT EXISTS tally (
  id    TEXT PRIMARY KEY,          -- work number, "1".."2000"
  count INTEGER NOT NULL DEFAULT 0 -- total votes
);

-- per-IP rate-limit buckets (auto-expire via the `exp` epoch seconds)
CREATE TABLE IF NOT EXISTS rate (
  k   TEXT PRIMARY KEY,
  n   INTEGER NOT NULL,
  exp INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tally_count ON tally (count DESC);
