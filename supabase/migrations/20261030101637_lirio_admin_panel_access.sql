/*
# Panel de administración: acceso restringido a una cuenta

1. Nueva tabla
- `admin_users`: lista de cuentas con permisos de administración. Cada fila es el id de una cuenta de Supabase Auth.

2. Cuenta administradora
- La cuenta con el correo soflosan56@gmail.com se registra como administradora automáticamente, tanto si ya existe como si se crea después (disparador sobre el alta de cuentas).
- Ninguna otra cuenta puede añadirse a la lista: no hay políticas de escritura sobre `admin_users` para los usuarios.

3. Tablas modificadas
- `brands`, `products` y `content_items`: solo la cuenta administradora puede insertar, modificar o borrar filas. El público sigue pudiendo leerlas.
- Se retiran los permisos de escritura al rol `anon` en esas tablas (no los necesitaba y no tenían política).

4. Seguridad
- RLS activado en `admin_users`. Cada usuario solo puede leer su propia fila, lo que le permite saber si es administrador.
- Las políticas de escritura comprueban la pertenencia a `admin_users` con `auth.uid()`.
- La función del disparador es SECURITY DEFINER con search_path fijado y sin permiso de ejecución para clientes.

5. Notas
- La contraseña no se guarda en el código ni en la base de datos; la cuenta debe crearse con ella mediante el registro normal.
- Esta migración es idempotente y puede repetirse sin efectos adicionales.
*/

CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON admin_users TO authenticated;

DROP POLICY IF EXISTS "select_own_admin_row" ON admin_users;
CREATE POLICY "select_own_admin_row" ON admin_users FOR SELECT
TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION grant_admin_to_owner_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'soflosan56@gmail.com' THEN
    INSERT INTO admin_users (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION grant_admin_to_owner_account() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS grant_admin_on_owner_signup ON auth.users;
CREATE TRIGGER grant_admin_on_owner_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION grant_admin_to_owner_account();

INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE lower(email) = 'soflosan56@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

REVOKE INSERT, UPDATE, DELETE ON brands, products, content_items FROM anon;

DROP POLICY IF EXISTS "admin_insert_brands" ON brands;
CREATE POLICY "admin_insert_brands" ON brands FOR INSERT
TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "admin_update_brands" ON brands;
CREATE POLICY "admin_update_brands" ON brands FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "admin_delete_brands" ON brands;
CREATE POLICY "admin_delete_brands" ON brands FOR DELETE
TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products" ON products FOR INSERT
TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products" ON products FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products" ON products FOR DELETE
TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "admin_insert_content_items" ON content_items;
CREATE POLICY "admin_insert_content_items" ON content_items FOR INSERT
TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "admin_update_content_items" ON content_items;
CREATE POLICY "admin_update_content_items" ON content_items FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "admin_delete_content_items" ON content_items;
CREATE POLICY "admin_delete_content_items" ON content_items FOR DELETE
TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));
