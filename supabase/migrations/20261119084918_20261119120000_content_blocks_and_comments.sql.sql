/*
# Article blocks and content comments

## 1. Plain-English explanation
- Articles can now be structured as a list of ordered blocks (subheadings, paragraphs and inline photos) stored as JSON in a new `blocks` column on `content_items`. Existing articles keep working: they have no blocks and the site falls back to the plain text body.
- Articles can also attach a downloadable document (URL in a new `document_url` column).
- Signed-in users can comment on any content item. Comments are stored in a new `content_comments` table.

## 2. New Tables
- `content_comments`: comments on a content item.
  - `id` (uuid, primary key)
  - `content_id` (uuid, not null, references `content_items` on delete cascade)
  - `user_id` (uuid, not null, defaults to the authenticated user, references `auth.users` on delete cascade)
  - `body` (text, not null, max 2000 chars enforced by the app)
  - `created_at` (timestamp)

## 3. Modified Tables
- `content_items`:
  - `blocks` (jsonb, nullable): ordered list of article blocks `{ type, text?, url?, caption? }` with types `subtitle`, `paragraph`, `image`.
  - `document_url` (text, nullable): downloadable document attached to an article.

## 4. Security
- RLS enabled on `content_comments`.
- SELECT granted to `anon` and `authenticated` (any visitor can read comments).
- INSERT, UPDATE, DELETE granted to `authenticated` only, with policies scoping writes to the comment owner (`auth.uid() = user_id`).
- `content_items` keeps its existing read-only policies; the new columns need no grants beyond the existing table SELECT.

## 5. Important notes
- The `user_id` column defaults to `auth.uid()` so inserts from the frontend can omit it.
- New indexes on `content_comments(content_id, created_at)` for listing comments per article.
*/

ALTER TABLE content_items
  ADD COLUMN IF NOT EXISTS blocks jsonb,
  ADD COLUMN IF NOT EXISTS document_url text;

CREATE TABLE IF NOT EXISTS content_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON content_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON content_comments TO authenticated;

DROP POLICY IF EXISTS "comments_public_read" ON content_comments;
CREATE POLICY "comments_public_read" ON content_comments
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON content_comments;
CREATE POLICY "comments_insert_own" ON content_comments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_update_own" ON content_comments;
CREATE POLICY "comments_update_own" ON content_comments
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete_own" ON content_comments;
CREATE POLICY "comments_delete_own" ON content_comments
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS content_comments_content_created_idx
  ON content_comments (content_id, created_at);
