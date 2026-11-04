/*
# Swap messages: members of a listing can write to each other

Plain-English summary: anyone can write to the owner of a garment. Bidders can also write to other bidders on the same garment, so people can talk through the listing. No messages are deleted.

## 1. Changed rules
- swap_messages insert policy: a message is allowed when the sender writes to the owner, or when the sender and the recipient both bid on the listing, or when the owner writes to someone who bid or has already written to the owner.

## 2. Security
- Senders must be the signed-in user, and cannot write to themselves.
- Reading rules are unchanged: each person sees only the messages they sent or received.

## 3. Important notes
1. No data is deleted or changed.
*/

DROP POLICY IF EXISTS "allowed_insert_swap_messages" ON swap_messages;
CREATE POLICY "allowed_insert_swap_messages" ON swap_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND recipient_id <> sender_id
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
        OR (
          EXISTS (
            SELECT 1 FROM swap_bids b1
            WHERE b1.listing_id = l.id AND b1.bidder_id = auth.uid()
          )
          AND EXISTS (
            SELECT 1 FROM swap_bids b2
            WHERE b2.listing_id = l.id AND b2.bidder_id = swap_messages.recipient_id
          )
        )
      )
  )
);
