CREATE TABLE "hitos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"umbral" integer NOT NULL,
	"alcanzado_en" timestamp with time zone,
	"celebrado_en" timestamp with time zone,
	CONSTRAINT "hitos_post_umbral_key" UNIQUE("post_id","umbral")
);
--> statement-breakpoint
ALTER TABLE "hitos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hitos" ADD CONSTRAINT "hitos_post_id_scheduled_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."scheduled_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hitos" ADD CONSTRAINT "hitos_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hitos_owner_idx" ON "hitos" USING btree ("owner_id");--> statement-breakpoint
-- El estreno: los cortes que ya pasaron un umbral lo ganan sin fecha y ya celebrado, para que la
-- app celebre solo los que se alcancen desde hoy. Las vistas, como `detectarHitos`
-- (`src/lib/hitos.ts`): la última lectura de cada publicación, sumada en las redes del corte,
-- sin YouTube (`politica-youtube.ts`).
INSERT INTO "hitos" ("post_id", "owner_id", "umbral", "celebrado_en")
SELECT v."post_id", v."owner_id", u."umbral", now()
FROM (
  SELECT t."post_id", p."owner_id", sum(coalesce(m."views", 0)) AS "vistas"
  FROM "scheduled_post_targets" t
  JOIN "scheduled_posts" p ON p."id" = t."post_id"
  JOIN "social_posts" s ON s."account_id" = t."account_id" AND s."external_id" = t."external_id" AND s."owner_id" = p."owner_id"
  JOIN LATERAL (
    SELECT pm."views" FROM "post_metrics" pm WHERE pm."post_id" = s."id" ORDER BY pm."day" DESC LIMIT 1
  ) m ON true
  WHERE t."status" = 'published' AND t."external_id" IS NOT NULL AND t."network" <> 'youtube'
  GROUP BY t."post_id", p."owner_id"
) v
JOIN unnest(ARRAY[100, 1000, 10000, 100000, 1000000]) AS u("umbral") ON v."vistas" >= u."umbral"
ON CONFLICT ("post_id", "umbral") DO NOTHING;
