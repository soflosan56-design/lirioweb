/*
# Ajustes del sitio, perfiles con biografía y armarios

1. Nuevas tablas
- `site_settings`: una única fila (key = 'site') con toda la estética y los textos editables desde el panel de administración (colores, tipografías, fotos de portada y destinos, textos de suscripciones y contacto).
- `wardrobe_items`: prendas del armario de cada usuario (foto, nombre, marca, talla, estado, material y descripción).

2. Tablas modificadas
- `profiles`: nuevas columnas `bio` (biografía corta) y `avatar_url` (foto de perfil).

3. Seguridad
- RLS activado en las tres tablas.
- Lectura pública (anon + authenticated) de los ajustes, los armarios y los perfiles, porque son contenido visible para cualquier visitante.
- Escritura de los ajustes solo para usuarios presentes en `admin_users`.
- Las prendas solo las puede crear, editar y borrar su propietario (owner_id se rellena desde la sesión).
- Los nuevos campos de perfil solo son editables por su propietario.

4. Notas importantes
- Esta migración no borra ni cambia columnas existentes.
- La fila de ajustes se crea desde la aplicación la primera vez que el administrador guarda cambios.
*/

CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY DEFAULT 'site' CHECK (key = 'site'),
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON site_settings TO authenticated;

DROP POLICY IF EXISTS "public_select_site_settings" ON site_settings;
CREATE POLICY "public_select_site_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_site_settings" ON site_settings;
CREATE POLICY "admin_insert_site_settings" ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "admin_update_site_settings" ON site_settings;
CREATE POLICY "admin_update_site_settings" ON site_settings FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_bio_length') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 400);
  END IF;
END $$;

GRANT SELECT (bio, avatar_url) ON profiles TO anon, authenticated;
GRANT UPDATE (bio, avatar_url) ON profiles TO authenticated;

CREATE TABLE IF NOT EXISTS wardrobe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  image_url text NOT NULL,
  brand text CHECK (brand IS NULL OR char_length(brand) <= 60),
  size text CHECK (size IS NULL OR char_length(size) <= 10),
  condition text CHECK (condition IS NULL OR char_length(condition) <= 60),
  material text CHECK (material IS NULL OR char_length(material) <= 60),
  description text CHECK (description IS NULL OR char_length(description) <= 600),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wardrobe_items_owner_idx ON wardrobe_items (owner_id);

ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON wardrobe_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON wardrobe_items TO authenticated;

DROP POLICY IF EXISTS "public_select_wardrobe_items" ON wardrobe_items;
CREATE POLICY "public_select_wardrobe_items" ON wardrobe_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owner_insert_wardrobe_items" ON wardrobe_items;
CREATE POLICY "owner_insert_wardrobe_items" ON wardrobe_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "owner_update_wardrobe_items" ON wardrobe_items;
CREATE POLICY "owner_update_wardrobe_items" ON wardrobe_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "owner_delete_wardrobe_items" ON wardrobe_items;
CREATE POLICY "owner_delete_wardrobe_items" ON wardrobe_items FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);
