/*
# Multiple photos for brands and products

1. Changes
- `brands.image_urls` (text array): all photos of a brand. Empty by default.
- `products.image_urls` (text array): all photos of a garment in the showroom. Empty by default.
- Existing single photos (`image_url`) are copied into the new arrays so nothing disappears.
- `image_url` stays in place and always holds the first photo, so existing pages keep working.

2. Security
- Column-level grants are added for the new column only, mirroring the existing ones:
  - `anon` and `authenticated` can read it (the showroom is public).
  - `authenticated` (the admin panel) can write it.
- No policies or other columns are changed.

3. Notes
- No data is removed or renamed.
- The migration is idempotent and safe to run again.
*/

ALTER TABLE brands ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

UPDATE brands
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url <> '' AND cardinality(image_urls) = 0;

UPDATE products
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url <> '' AND cardinality(image_urls) = 0;

GRANT SELECT (image_urls) ON brands TO anon, authenticated;
GRANT INSERT (image_urls), UPDATE (image_urls) ON brands TO authenticated;

GRANT SELECT (image_urls) ON products TO anon, authenticated;
GRANT INSERT (image_urls), UPDATE (image_urls) ON products TO authenticated;
