-- ============================================================
-- Fichus2026 — Supabase Schema
-- Run this in the Supabase SQL Editor before using the app
-- ============================================================

-- Collection table
CREATE TABLE IF NOT EXISTS collection (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sticker_code  TEXT NOT NULL,
  count         INTEGER DEFAULT 0 NOT NULL,
  history_taps  INTEGER DEFAULT 0 NOT NULL,
  max_dups      INTEGER DEFAULT 0 NOT NULL,
  is_favorite   BOOLEAN DEFAULT false NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT collection_user_sticker_unique UNIQUE (user_id, sticker_code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS collection_user_id_idx ON collection(user_id);
CREATE INDEX IF NOT EXISTS collection_sticker_code_idx ON collection(sticker_code);

-- RLS
ALTER TABLE collection ENABLE ROW LEVEL SECURITY;

-- Users can fully manage their own rows
CREATE POLICY "Users manage own collection"
  ON collection FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone can read any collection (needed for /cambio/[userId] public page)
CREATE POLICY "Public read collection"
  ON collection FOR SELECT
  USING (true);

-- Enable Realtime on this table (run in Supabase dashboard or here)
ALTER PUBLICATION supabase_realtime ADD TABLE collection;
