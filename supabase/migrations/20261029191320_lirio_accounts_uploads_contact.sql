/*
# Lirio: accounts, ownership, image uploads and contact messages

Plain-English summary: visitors now create an account to publish garments, bid, and use the cart. Each person can only change their own profile, listings, bids and cart. Anyone can still browse. Bids can include up to three photos of the offered items, and garments and bid photos are uploaded to a public image store. A contact form stores messages for the team.

## 1. New tables and columns
- `contact_messages`: messages sent from the contact page (name, email, subject, message, created date).
- `swap_bids.offer_image_urls`: list of up to three photo links for the offered items.

## 2. Automatic profile creation
- When someone signs up, a profile row is created automatically with the display name they typed.

## 3. Security changes
- Profiles, listings, bids and cart items are now tied to the signed-in account (the account id is the owner).
- Anonymous visitors can only read public content (profiles, listings, bids, catalog, magazine) and send contact messages.
- Listing and cart changes, bid creation and profile edits are limited to the owner.
- A public image bucket stores uploads. Each file is saved inside a folder named after its owner, and only that owner can upload into it.

## 4. Important notes
1. Existing sample listings belong to sample profiles and stay visible. They can't be edited by anyone.
2. No existing user data is removed.
*/

ALTER TABLE swap_bids ADD COLUMN IF NOT EXISTS offer_image_urls text[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'swap_bids_offer_image_urls_max'
  ) THEN
    ALTER TABLE swap_bids ADD CONSTRAINT swap_bids_offer_image_urls_max CHECK (cardinality(offer_image_urls) <= 3);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 200),
  subject text NOT NULL,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON contact_messages TO anon, authenticated;
DROP POLICY IF EXISTS "public_insert_contact_messages" ON contact_messages;
CREATE POLICY "public_insert_contact_messages" ON contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Profiles: public read, owner-only write
REVOKE INSERT, UPDATE ON profiles FROM anon;
DROP POLICY IF EXISTS "visitor_select_profiles" ON profiles;
DROP POLICY IF EXISTS "visitor_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "visitor_update_profiles" ON profiles;
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT auth.uid();
GRANT SELECT ON profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;
DROP POLICY IF EXISTS "public_select_profiles" ON profiles;
CREATE POLICY "public_select_profiles" ON profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "owner_insert_profiles" ON profiles;
CREATE POLICY "owner_insert_profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "owner_update_profiles" ON profiles;
CREATE POLICY "owner_update_profiles" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Swap listings: public read, owner-only publish and withdraw
REVOKE INSERT, DELETE ON swap_listings FROM anon;
ALTER TABLE swap_listings ALTER COLUMN owner_id SET DEFAULT auth.uid();
GRANT INSERT, DELETE ON swap_listings TO authenticated;
DROP POLICY IF EXISTS "public_insert_swap_listings" ON swap_listings;
DROP POLICY IF EXISTS "public_delete_swap_listings" ON swap_listings;
DROP POLICY IF EXISTS "owner_insert_swap_listings" ON swap_listings;
CREATE POLICY "owner_insert_swap_listings" ON swap_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "owner_delete_swap_listings" ON swap_listings;
CREATE POLICY "owner_delete_swap_listings" ON swap_listings FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Swap bids: public read, bidder-only create
REVOKE INSERT ON swap_bids FROM anon;
ALTER TABLE swap_bids ALTER COLUMN bidder_id SET DEFAULT auth.uid();
GRANT INSERT ON swap_bids TO authenticated;
DROP POLICY IF EXISTS "public_insert_swap_bids" ON swap_bids;
DROP POLICY IF EXISTS "owner_insert_swap_bids" ON swap_bids;
CREATE POLICY "owner_insert_swap_bids" ON swap_bids FOR INSERT TO authenticated WITH CHECK (auth.uid() = bidder_id);

-- Cart: signed-in owner only
REVOKE SELECT, INSERT, UPDATE, DELETE ON cart_items FROM anon;
ALTER TABLE cart_items ALTER COLUMN owner_id SET DEFAULT auth.uid();
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO authenticated;
DROP POLICY IF EXISTS "visitor_select_cart_items" ON cart_items;
DROP POLICY IF EXISTS "visitor_insert_cart_items" ON cart_items;
DROP POLICY IF EXISTS "visitor_update_cart_items" ON cart_items;
DROP POLICY IF EXISTS "visitor_delete_cart_items" ON cart_items;
DROP POLICY IF EXISTS "owner_select_cart_items" ON cart_items;
CREATE POLICY "owner_select_cart_items" ON cart_items FOR SELECT TO authenticated USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "owner_insert_cart_items" ON cart_items;
CREATE POLICY "owner_insert_cart_items" ON cart_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "owner_update_cart_items" ON cart_items;
CREATE POLICY "owner_update_cart_items" ON cart_items FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "owner_delete_cart_items" ON cart_items;
CREATE POLICY "owner_delete_cart_items" ON cart_items FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Automatic profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), 'Nuevo miembro'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_account() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_account_created ON auth.users;
CREATE TRIGGER on_auth_account_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_account();

-- Public image store for listings and bid photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('lirio-uploads', 'lirio-uploads', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_lirio_uploads" ON storage.objects;
CREATE POLICY "public_read_lirio_uploads" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'lirio-uploads');

DROP POLICY IF EXISTS "owner_upload_lirio_uploads" ON storage.objects;
CREATE POLICY "owner_upload_lirio_uploads" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lirio-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
