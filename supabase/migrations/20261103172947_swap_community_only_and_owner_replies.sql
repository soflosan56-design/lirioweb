/*
# Swap: community-only garments and owner replies to anyone who wrote

Plain-English summary: garments published by the demo accounts are marked so Swap shows only garments uploaded by community members. Garment owners can now reply to anyone who has written to them about a garment, not only to people who have placed a bid. No messages or garments are deleted.

## 1. Changed tables
- `swap_listings.is_demo`: true for garments published by the demo accounts. The site hides these garments from Swap. Their existing messages are kept.

## 2. Security
- Message rule change: a garment owner can write to a member who has placed a bid on the garment or who has already written to the owner about it. All other message rules stay the same.

## 3. Important notes
1. No messages or garments are deleted.
2. Garments added later by community members default to is_demo = false and appear in Swap.
*/

ALTER TABLE swap_listings ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

UPDATE swap_listings
SET is_demo = true
WHERE owner_id IN ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002')
  AND is_demo = false;

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
          AND (
            EXISTS (
              SELECT 1 FROM swap_bids b
              WHERE b.listing_id = l.id AND b.bidder_id = swap_messages.recipient_id
            )
            OR EXISTS (
              SELECT 1 FROM swap_messages m
              WHERE m.listing_id = l.id
                AND m.sender_id = swap_messages.recipient_id
                AND m.recipient_id = auth.uid()
            )
          )
        )
      )
  )
);
