/*
# Swap: number of people who bid on each garment

Plain-English summary: every garment in Swap can now show how many different people have bid on it. The database counts them and shares only the total, so bidder identities are not exposed beyond what is already visible on each bid.

## 1. New view
- `swap_listing_bidder_counts`: one row per garment that has at least one bid.
  - `listing_id`: the garment.
  - `bidder_count`: number of different people who bid on it. The garment owner is never counted.

## 2. Security
- The view runs with the permissions of the person reading it, so it follows the existing rules for garments and bids.
- Visitors and signed-in members can read it. No table is changed.

## 3. Important notes
1. No existing data is changed.
2. Garments without bids do not appear in the view; the site treats them as zero bidders.
*/

CREATE OR REPLACE VIEW swap_listing_bidder_counts
WITH (security_invoker = true) AS
SELECT b.listing_id, count(DISTINCT b.bidder_id)::int AS bidder_count
FROM swap_bids b
JOIN swap_listings l ON l.id = b.listing_id
WHERE b.bidder_id <> l.owner_id
GROUP BY b.listing_id;

GRANT SELECT ON swap_listing_bidder_counts TO anon, authenticated;
