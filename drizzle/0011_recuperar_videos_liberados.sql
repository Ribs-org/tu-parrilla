-- Les devuelve la forma a los posts que salieron con video antes de que existiera
-- `videos_liberados` (ver su comentario en `src/db/schema.ts`): el video se borró del
-- almacén con su fila, y el corte de esas entrañas se dibuja como chori.
--
-- La fila ya no está, así que se reconstruye con lo que quedó. Solo se miran los posts que
-- salieron en todas sus redes —el único momento en que se borra un video— y que no
-- conservan ninguno. Cuenta como video que se fue:
--   - cada hueco en las posiciones de lo que quedó: se numeran desde 0 sin saltos al crear y
--     al editar, y la limpieza borra sin renumerar;
--   - y al menos uno si hay otra prueba: una portada (solo se acepta con video), ningún
--     archivo en un post que fue a Instagram, TikTok o YouTube (que exigen uno, y las fotos
--     nunca se borran), o lo que la red dijo al sincronizar (video, reel, short).
-- Lo que no se puede saber: un video al final de un carrusel, sin otra prueba, deja la tira
-- con un hueso menos; un video que fue solo a Threads o X, sin portada, queda como chori.
WITH calculo AS (
  SELECT
    p.id,
    GREATEST(
      COALESCE((SELECT max(m.position) + 1 - count(*) FROM scheduled_post_media m WHERE m.post_id = p.id), 0),
      CASE
        WHEN p.cover_url IS NOT NULL
          OR (
            NOT EXISTS (SELECT 1 FROM scheduled_post_media m WHERE m.post_id = p.id)
            AND EXISTS (
              SELECT 1 FROM scheduled_post_targets t
              WHERE t.post_id = p.id AND t.network IN ('instagram', 'tiktok', 'youtube')
            )
          )
          OR EXISTS (
            SELECT 1 FROM scheduled_post_targets t
            JOIN social_posts s ON s.account_id = t.account_id AND s.external_id = t.external_id
            WHERE t.post_id = p.id AND s.media_type IN ('video', 'reel', 'short')
          )
        THEN 1
        ELSE 0
      END
    ) AS videos
  FROM scheduled_posts p
  WHERE p.videos_liberados = 0
    AND EXISTS (SELECT 1 FROM scheduled_post_targets t WHERE t.post_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM scheduled_post_targets t WHERE t.post_id = p.id AND t.status <> 'published')
    AND NOT EXISTS (SELECT 1 FROM scheduled_post_media m WHERE m.post_id = p.id AND m.media_type = 'video')
)
UPDATE scheduled_posts
SET videos_liberados = calculo.videos
FROM calculo
WHERE scheduled_posts.id = calculo.id AND calculo.videos > 0;
