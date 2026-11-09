/*
# Favoritos de Swap y ajustes del recomendador de moda

## 1. Nuevas tablas
- `swap_favorites`: prendas de Swap guardadas como favoritas por cada usuario. Clave primaria compuesta (user_id, listing_id). Si se borra la prenda, el favorito desaparece.
- `ai_settings`: fila única con las instrucciones, el modelo y el tono que usa el recomendador de moda. Solo el administrador puede modificarla.

## 2. Seguridad
- RLS activado en ambas tablas.
- `swap_favorites`: cada usuario autenticado solo ve, añade y borra sus propios favoritos.
- `ai_settings`: cualquier visitante puede leerla (no contiene secretos); solo las cuentas de `admin_users` pueden actualizarla.
- Los permisos (GRANT) se dan solo a los roles y acciones que usan las políticas.

## 3. Notas importantes
- La clave de OpenAI no se guarda en la base de datos; se configura como secreto de las funciones de Supabase.
- La migración es repetible: usa IF NOT EXISTS, ON CONFLICT y DROP POLICY IF EXISTS.
*/

CREATE TABLE IF NOT EXISTS swap_favorites (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES swap_listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS swap_favorites_listing_idx ON swap_favorites (listing_id);

ALTER TABLE swap_favorites ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON swap_favorites TO authenticated;

DROP POLICY IF EXISTS "select_own_swap_favorites" ON swap_favorites;
CREATE POLICY "select_own_swap_favorites" ON swap_favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_swap_favorites" ON swap_favorites;
CREATE POLICY "insert_own_swap_favorites" ON swap_favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_swap_favorites" ON swap_favorites;
CREATE POLICY "delete_own_swap_favorites" ON swap_favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS ai_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  model text NOT NULL DEFAULT 'gpt-4o-mini',
  instructions text NOT NULL DEFAULT 'Eres el estilista de Proyecto Lirio. Recomienda combinaciones y prendas con un tono cercano y editorial. Usa solo las prendas que se te indiquen, nunca inventes prendas.',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON ai_settings TO anon, authenticated;
GRANT UPDATE ON ai_settings TO authenticated;

DROP POLICY IF EXISTS "public_select_ai_settings" ON ai_settings;
CREATE POLICY "public_select_ai_settings" ON ai_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_ai_settings" ON ai_settings;
CREATE POLICY "admin_update_ai_settings" ON ai_settings FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

INSERT INTO ai_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
