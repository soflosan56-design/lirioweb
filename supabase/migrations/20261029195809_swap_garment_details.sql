/*
# Swap: garment details and multiple photos for listings and bids

Plain-English summary: garments published for swap and the offers placed on them now carry the full set of details (photos, description, material, brand, condition and size). Listings can have up to three photos, matching bids.

## 1. Modified tables
- `swap_listings`
  - `description` (text): free-text description of the garment.
  - `material` (text): fabric or material.
  - `image_urls` (text array, up to three links): all photos of the garment. Existing single photos are copied into this list.
- `swap_bids`
  - `brand`, `size`, `condition`, `material`, `description` (text): details of the offered garment.

## 2. Security
- No new tables and no permission changes. Existing row level security policies and grants already cover new columns on these tables.

## 3. Important notes
1. No data is removed. The old `image_url` column on listings is kept untouched.
2. The photo limit is enforced at the database level for both listings and bids.
3. Safe to re-run: columns, constraints and the copy of photos only apply when missing.
*/

ALTER TABLE swap_listings ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE swap_listings ADD COLUMN IF NOT EXISTS material text;
ALTER TABLE swap_listings ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'swap_listings_image_urls_max'
  ) THEN
    ALTER TABLE swap_listings ADD CONSTRAINT swap_listings_image_urls_max CHECK (cardinality(image_urls) <= 3);
  END IF;
END $$;

UPDATE swap_listings
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND cardinality(image_urls) = 0;

ALTER TABLE swap_bids ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE swap_bids ADD COLUMN IF NOT EXISTS size text;
ALTER TABLE swap_bids ADD COLUMN IF NOT EXISTS condition text;
ALTER TABLE swap_bids ADD COLUMN IF NOT EXISTS material text;
ALTER TABLE swap_bids ADD COLUMN IF NOT EXISTS description text;
