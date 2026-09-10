/*
# Create messages table for Polyglot chat app

1. New Tables
- `message` — stores chat messages with translation support
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user, references auth.users)
  - `sender_name` (text, not null) — name of the person who sent the message
  - `sender_handle` (text, not null) — handle/identifier of sender
  - `recipient_name` (text, not null) — name of the recipient
  - `recipient_email` (text, not null) — email of the recipient
  - `direction` (text, not null) — 'inbound' or 'outbound'
  - `source_language` (text, not null) — language of the original message
  - `body` (text, not null) — the original message text
  - `translated_body` (text, nullable) — the translated message text
  - `created_at` (timestamptz, defaults to now)

2. Security
- Enable RLS on `message`.
- Owner-scoped CRUD: each authenticated user can only access their own messages (where user_id matches auth.uid()).
*/

CREATE TABLE IF NOT EXISTS message (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  sender_handle text NOT NULL,
  recipient_name text NOT NULL,
  recipient_email text NOT NULL,
  direction text NOT NULL,
  source_language text NOT NULL,
  body text NOT NULL,
  translated_body text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE message ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON message;
CREATE POLICY "select_own_messages" ON message FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_messages" ON message;
CREATE POLICY "insert_own_messages" ON message FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_messages" ON message;
CREATE POLICY "update_own_messages" ON message FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_messages" ON message;
CREATE POLICY "delete_own_messages" ON message FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_message_user_id_created ON message (user_id, created_at DESC);
