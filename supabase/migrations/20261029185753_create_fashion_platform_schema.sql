/*
# Create fashion platform schema

Plain-English summary: adds the tables that power the Swap marketplace, the Showroom catalog, the Contents magazine, the shopping cart and user profiles.

## 1. New tables
- `profiles`: a lightweight profile for each visitor (display name, city, style). Created automatically the first time someone opens the site.
- `swap_listings`: clothing items published by users for trade (title, brand, size, condition, photo, wanted item, estimated value).
- `swap_bids`: trade bids placed on a listing (offered item, offered value, message).
- `brands`: independent brands and designers shown in the Showroom.
- `products`: items sold or rented by a brand (price, optional rental price, photo).
- `cart_items`: products a visitor added to their cart, either to buy or to rent.
- `content_items`: magazine content, either a video podcast ("podcast") or an editorial article ("article").

## 2. Security
- Row level security is enabled on every new table.
- The site has no sign-in, so access is granted to the `anon` and `authenticated` roles, as documented per policy below.
- Public catalog and magazine tables (`brands`, `products`, `content_items`) are read-only from the site.
- Visitor-owned tables (`profiles`, `cart_items`, `swap_listings`, `swap_bids`) allow the actions the site needs and no more (for example, bids cannot be edited or deleted).

## 3. Important notes
1. Ownership is tracked by a visitor identifier stored in the browser, not by an account.
2. Every table that references another table uses a foreign key with cascading deletes where a child row has no meaning on its own.
3. Indexes are added on foreign key columns used for lookups.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL DEFAULT 'Invitado',
  city text,
  style text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS swap_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  brand text,
  size text,
  condition text,
  image_url text,
  wanted text,
  estimated_value integer NOT NULL CHECK (estimated_value > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swap_listings_owner_id_idx ON swap_listings(owner_id);

CREATE TABLE IF NOT EXISTS swap_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES swap_listings(id) ON DELETE CASCADE,
  bidder_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offer_title text NOT NULL,
  offer_value integer NOT NULL CHECK (offer_value > 0),
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swap_bids_listing_id_idx ON swap_bids(listing_id);
CREATE INDEX IF NOT EXISTS swap_bids_bidder_id_idx ON swap_bids(bidder_id);

CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  city text,
  tagline text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  size text,
  price_cents integer NOT NULL CHECK (price_cents > 0),
  rent_cents integer CHECK (rent_cents IS NULL OR rent_cents > 0),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_brand_id_idx ON products(brand_id);

CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('buy', 'rent')),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, product_id, mode)
);
CREATE INDEX IF NOT EXISTS cart_items_owner_id_idx ON cart_items(owner_id);

CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('podcast', 'article')),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  excerpt text,
  body text,
  category text,
  image_url text,
  video_url text,
  duration_label text,
  episode_number integer,
  featured boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON profiles TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON swap_listings TO anon, authenticated;
GRANT SELECT, INSERT ON swap_bids TO anon, authenticated;
GRANT SELECT ON brands TO anon, authenticated;
GRANT SELECT ON products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO anon, authenticated;
GRANT SELECT ON content_items TO anon, authenticated;

-- Public read-only catalog and magazine content
DROP POLICY IF EXISTS "public_select_brands" ON brands;
CREATE POLICY "public_select_brands" ON brands FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_products" ON products;
CREATE POLICY "public_select_products" ON products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_content_items" ON content_items;
CREATE POLICY "public_select_content_items" ON content_items FOR SELECT TO anon, authenticated USING (true);

-- Visitor profiles (no sign-in; identity is a browser-stored id)
DROP POLICY IF EXISTS "visitor_select_profiles" ON profiles;
CREATE POLICY "visitor_select_profiles" ON profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "visitor_insert_profiles" ON profiles;
CREATE POLICY "visitor_insert_profiles" ON profiles FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "visitor_update_profiles" ON profiles;
CREATE POLICY "visitor_update_profiles" ON profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Swap listings and bids are public so everyone can browse and bid
DROP POLICY IF EXISTS "public_select_swap_listings" ON swap_listings;
CREATE POLICY "public_select_swap_listings" ON swap_listings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_swap_listings" ON swap_listings;
CREATE POLICY "public_insert_swap_listings" ON swap_listings FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_swap_listings" ON swap_listings;
CREATE POLICY "public_delete_swap_listings" ON swap_listings FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_swap_bids" ON swap_bids;
CREATE POLICY "public_select_swap_bids" ON swap_bids FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_swap_bids" ON swap_bids;
CREATE POLICY "public_insert_swap_bids" ON swap_bids FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Cart items belong to a visitor id
DROP POLICY IF EXISTS "visitor_select_cart_items" ON cart_items;
CREATE POLICY "visitor_select_cart_items" ON cart_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "visitor_insert_cart_items" ON cart_items;
CREATE POLICY "visitor_insert_cart_items" ON cart_items FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "visitor_update_cart_items" ON cart_items;
CREATE POLICY "visitor_update_cart_items" ON cart_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "visitor_delete_cart_items" ON cart_items;
CREATE POLICY "visitor_delete_cart_items" ON cart_items FOR DELETE TO anon, authenticated USING (true);
