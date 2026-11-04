/*
# Swap: direct messages between members

Plain-English summary: members can message each other about a garment they want to swap. Anyone signed in can write to the owner of a garment. The owner can reply to people who have bid on that garment. Only the two people in a conversation can read it.

## 1. New table
- `swap_messages`: one message about one garment.
  - `listing_id`: the garment the conversation is about.
  - `sender_id`: the person writing (filled automatically with the signed-in account).
  - `recipient_id`: the person receiving the message.
  - `body`: the message text (1 to 1000 characters).
  - `created_at`: when it was sent.

## 2. Security
- Row level security is enabled.
- Signed-in members can read only messages where they are the sender or the recipient.
- Signed-in members can send a message only as themselves, and only when:
  - the recipient is the garment owner, or
  - the sender is the garment owner and the recipient has placed a bid on that garment.
- Messages cannot be edited or deleted from the site. Anonymous visitors have no access.

## 3. Important notes
1. No existing data is changed.
2. Deleting a garment removes its messages.
*/

CREATE TABLE IF NOT EXISTS swap_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES swap_listings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS swap_messages_listing_id_idx ON swap_messages(listing_id);
CREATE INDEX IF NOT EXISTS swap_messages_sender_id_idx ON swap_messages(sender_id);
CREATE INDEX IF NOT EXISTS swap_messages_recipient_id_idx ON swap_messages(recipient_id);

ALTER TABLE swap_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON swap_messages TO authenticated;

DROP POLICY IF EXISTS "participants_select_swap_messages" ON swap_messages;
CREATE POLICY "participants_select_swap_messages" ON swap_messages FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "allowed_insert_swap_messages" ON swap_messages;
CREATE POLICY "allowed_insert_swap_messages" ON swap_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM swap_listings l
    WHERE l.id = swap_messages.listing_id
      AND (
        l.owner_id = swap_messages.recipient_id
        OR (
          l.owner_id = auth.uid()
          AND EXISTS (
            SELECT 1 FROM swap_bids b
            WHERE b.listing_id = l.id AND b.bidder_id = swap_messages.recipient_id
          )
        )
      )
  )
);
