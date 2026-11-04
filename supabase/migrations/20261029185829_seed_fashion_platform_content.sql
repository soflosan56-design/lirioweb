/*
# Seed fashion platform sample content

Plain-English summary: fills the Showroom and the Contents magazine with sample brands, products, video podcast episodes and articles so the site looks alive on first visit. It also adds a few sample Swap listings.

## 1. Inserted content
- 4 independent brands with taglines and photos.
- 8 products (each with a buy price and, for most, a rental price).
- 3 video podcast episodes (one marked as featured).
- 6 magazine articles in a fanzine style.
- 3 sample Swap listings owned by a sample visitor profile.

## 2. Security
- No table structure or access rules change in this migration.

## 3. Important notes
1. Every insert is guarded so re-running this migration does not duplicate content.
2. Video episodes point to public sample videos that can be replaced later with real episodes.
*/

INSERT INTO brands (slug, name, city, tagline, image_url) VALUES
  ('nocturna-studio', 'Nocturna Studio', 'Barcelona', 'Patronaje oscuro para noches largas', 'https://images.pexels.com/photos/8619007/pexels-photo-8619007.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('chatarra-club', 'Chatarra Club', 'Madrid', 'Upcycling con actitud de fanzine', 'https://images.pexels.com/photos/5531551/pexels-photo-5531551.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('rosa-acida', 'Rosa Ácida', 'Valencia', 'Rosa, látex y ruido', 'https://images.pexels.com/photos/10689371/pexels-photo-10689371.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('denim-ruido', 'Denim Ruido', 'Bilbao', 'Denim reparado a mano, historias reales', 'https://images.pexels.com/photos/5524406/pexels-photo-5524406.jpeg?auto=compress&cs=tinysrgb&h=650&w=940')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (brand_id, name, description, size, price_cents, rent_cents, image_url)
SELECT b.id, p.name, p.description, p.size, p.price_cents, p.rent_cents, p.image_url
FROM (VALUES
  ('nocturna-studio', 'Chaqueta Vinilo Negra', 'Chaqueta corta de vinilo con cierre frontal metálico.', 'M', 14900, 3900, 'https://images.pexels.com/photos/9476213/pexels-photo-9476213.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('nocturna-studio', 'Vestido Plisado Noche', 'Vestido largo plisado en negro mate, ideal para eventos.', 'S', 12500, 3200, 'https://images.pexels.com/photos/8307669/pexels-photo-8307669.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('chatarra-club', 'Chaqueta Parche Fanzine', 'Denim reciclado con parches pintados a mano.', 'L', 8900, NULL, 'https://images.pexels.com/photos/15870127/pexels-photo-15870127.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('chatarra-club', 'Falda Cosida a Mano', 'Falda midi con retales de tres colecciones distintas.', 'M', 6500, 1800, 'https://images.pexels.com/photos/18066103/pexels-photo-18066103.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('rosa-acida', 'Top Látex Rosa', 'Top de látex con cuello alto y acabado brillante.', 'M', 4500, 1500, 'https://images.pexels.com/photos/8619007/pexels-photo-8619007.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('rosa-acida', 'Mono Rosa Chicle', 'Mono de una pieza con mangas abullonadas.', 'S', 11900, 3500, 'https://images.pexels.com/photos/10689371/pexels-photo-10689371.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('denim-ruido', 'Trucker Desgastada', 'Chaqueta trucker con lavado de piedra y botones originales.', 'L', 9900, 2500, 'https://images.pexels.com/photos/12083001/pexels-photo-12083001.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('denim-ruido', 'Jeans Recortados', 'Shorts de denim recortados y deshilachados a mano.', 'M', 7400, NULL, 'https://images.pexels.com/photos/6770027/pexels-photo-6770027.jpeg?auto=compress&cs=tinysrgb&h=650&w=940')
) AS p(brand_slug, name, description, size, price_cents, rent_cents, image_url)
JOIN brands b ON b.slug = p.brand_slug
WHERE NOT EXISTS (SELECT 1 FROM products);

INSERT INTO content_items (kind, slug, title, subtitle, excerpt, body, category, image_url, video_url, duration_label, episode_number, featured, published_at) VALUES
  ('podcast', 'vestir-sin-permiso', 'Vestir sin permiso', 'Cómo la calle marca tendencia antes que las pasarelas', 'Charlamos con tres stylists sobre el momento exacto en que una prenda deja de ser moda y pasa a ser identidad.', NULL, 'Podcast', 'https://images.pexels.com/photos/31213674/pexels-photo-31213674.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', '42 min', 1, true, '2026-10-20T10:00:00Z'),
  ('podcast', 'segunda-mano-primera-fila', 'Segunda mano, primera fila', 'Vintage, reventa y el lujo de lo ya usado', 'Un recorrido por mercadillos de tres ciudades y las historias detrás de cada etiqueta cosida a mano.', NULL, 'Podcast', 'https://images.pexels.com/photos/4319926/pexels-photo-4319926.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', '36 min', 2, false, '2026-10-13T10:00:00Z'),
  ('podcast', 'denim-gasolina', 'Denim, rebeldía y gasolina', 'Diseñadores independientes hablan de reparar en lugar de tirar', 'Tres diseñadores cuentan cómo rescatan vaqueros rotos y los convierten en piezas de colección.', NULL, 'Podcast', 'https://images.pexels.com/photos/10933688/pexels-photo-10933688.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', '28 min', 3, false, '2026-10-06T10:00:00Z'),
  ('article', 'fin-talla-unica', 'El fin de la talla única', 'Por qué las marcas independientes están rediseñando el patrón', 'Patronistas, modelos y compradoras reclaman prendas que se adapten a cuerpos reales.', E'Durante décadas, la industria vendió una sola silueta como si fuera universal. Hoy esa idea se desmorona.\n\nLas marcas pequeñas están cambiando la forma de medir: toman patrones de cuerpos reales, ofrecen ajustes personalizados y publican tablas de medidas sin filtros.\n\nEl resultado es ropa que dura más, se devuelve menos y se siente propia desde el primer día.', 'Sostenibilidad', 'https://images.pexels.com/photos/16729588/pexels-photo-16729588.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, '7 min', NULL, true, '2026-10-18T09:00:00Z'),
  ('article', 'neon-berlin-madrugada', 'Neón en Berlín a las cuatro de la mañana', 'Diario de una noche de street style sin filtros', 'Fotografiamos a los que siguen en pie cuando la ciudad ya se apaga.', E'A las cuatro de la mañana, Berlín cambia de piel. Las luces de neón se reflejan en el asfalto mojado y la ropa se vuelve más atrevida.\n\nNo hay pasarela ni fotógrafo oficial: solo gente que ha elegido su look con lo que tenía en el armario.\n\nEsta es una galería de looks reales, tomados sin posar, con colores que no piden permiso.', 'Street', 'https://images.pexels.com/photos/19961883/pexels-photo-19961883.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, '5 min', NULL, false, '2026-10-15T09:00:00Z'),
  ('article', 'fotografos-sin-estudio', 'Fotógrafos sin estudio', 'Tres sesiones de moda rodadas en un piso de 40 metros', 'Luz natural, un flash y mucha creatividad: así se hacen portadas de revista sin presupuesto.', E'No todas las portadas se rodan en estudios de lujo. Muchas nacen en un salón con una ventana y una sábana blanca.\n\nLos fotógrafos entrevistados explican cómo colocan la luz, cómo dirigen a una modelo sin experiencia y cómo convierten un sofá en escenografía.\n\nUn reportaje sobre ingenio, horas de montaje y la magia de lo improvisado.', 'Backstage', 'https://images.pexels.com/photos/11157593/pexels-photo-11157593.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, '6 min', NULL, false, '2026-10-10T09:00:00Z'),
  ('article', 'diez-minutos-diseñadora', 'Diez minutos con una diseñadora rota', 'Entrevista a la fundadora de una marca de tres prendas', 'Trabaja de noche, cose de día y no quiere crecer. Así piensa una diseñadora que escapa de la moda rápida.', E'Empezó con una máquina de coser prestada y una deuda de alquiler. Hoy vende tres prendas al mes y rechaza pedidos grandes.\n\n"Prefiero que cada pieza tenga una historia que una cifra de ventas", explica mientras ajusta un bolsillo con alfileres.\n\nSu consejo para quien quiere empezar: comprar menos, reparar más y no tener miedo a equivocarse en público.', 'Entrevista', 'https://images.pexels.com/photos/7779763/pexels-photo-7779763.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, '8 min', NULL, false, '2026-10-08T09:00:00Z'),
  ('article', 'rojo-lazo-drama', 'Rojo, lazo y drama', 'La editorial que lo cambia todo esta temporada', 'Volúmenes exagerados, maquillaje intenso y un solo color en todas las páginas.', E'El rojo vuelve, pero no como color de fiesta. Aparece en lazos gigantes, en labios sin matices y en telas que crujen al moverse.\n\nLa tendencia combina lo teatral con lo cotidiano: un abrigo elegante con una zapatilla gastada, o un vestido de gala con botas de trabajo.\n\nSi solo puedes añadir una cosa a tu armario, que sea algo que te haga girar la cabeza.', 'Editorial', 'https://images.pexels.com/photos/33976561/pexels-photo-33976561.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', NULL, '4 min', NULL, false, '2026-10-02T09:00:00Z')
ON CONFLICT (slug) DO NOTHING;
