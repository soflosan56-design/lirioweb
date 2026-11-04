/*
# Community garments can be bid on and chatted about through a Swap listing

Plain-English summary: every garment in a community wardrobe gets one Swap listing, created the first time someone wants to bid on it or message its owner. The listing belongs to the wardrobe owner, so bids, bid counts and the chat behave exactly like other Swap listings.

## 1. Changed tables
- `swap_listings.source_wardrobe_item_id`: the wardrobe garment a listing was created from. Unique, so each garment has at most one listing. If the wardrobe garment is deleted, the listing stays and keeps its bids and messages.
- `swap_listings.estimated_value`: no longer required, because wardrobe garments have no price. Listings created by the owner still store a value.

## 2. New function
- `get_or_create_listing_for_wardrobe_item(item_id)`: returns the Swap listing for a wardrobe garment, creating it if needed. Only signed-in users can call it, and not for their own garments.

## 3. Security
- The function runs with elevated rights but only creates listings owned by the garment's owner, copied from the wardrobe garment.
- Execute permission is limited to signed-in users.

## 4. Important notes
1. No existing data is deleted or changed.
2. Existing Swap listings keep working as before.
*/

ALTER TABLE swap_listings ADD COLUMN IF NOT EXISTS source_wardrobe_item_id uuid REFERENCES wardrobe_items(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS swap_listings_source_wardrobe_item_key ON swap_listings (source_wardrobe_item_id);

ALTER TABLE swap_listings ALTER COLUMN estimated_value DROP NOT NULL;

CREATE OR REPLACE FUNCTION get_or_create_listing_for_wardrobe_item(item_id uuid)
RETURNS swap_listings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item wardrobe_items%ROWTYPE;
  listing swap_listings%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Tienes que iniciar sesión.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO item FROM wardrobe_items WHERE id = item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Esta prenda ya no existe.' USING ERRCODE = 'P0002';
  END IF;
  IF item.owner_id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes pujar por tu propia prenda.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO listing FROM swap_listings WHERE source_wardrobe_item_id = item.id;
  IF FOUND THEN
    RETURN listing;
  END IF;

  INSERT INTO swap_listings (owner_id, title, brand, size, condition, material, description, image_urls, source_wardrobe_item_id)
  VALUES (
    item.owner_id,
    item.name,
    item.brand,
    item.size,
    item.condition,
    item.material,
    item.description,
    ARRAY[item.image_url],
    item.id
  )
  RETURNING * INTO listing;

  RETURN listing;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_or_create_listing_for_wardrobe_item(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_or_create_listing_for_wardrobe_item(uuid) TO authenticated;
