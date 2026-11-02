CREATE TABLE "materiales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"uso" text,
	"url" text NOT NULL,
	"bytes" bigint NOT NULL,
	"tipo_archivo" text NOT NULL,
	"duracion_s" real,
	"derechos_en" timestamp with time zone NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"borrado_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "materiales" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subidas" ALTER COLUMN "tipo" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "insumos" ADD COLUMN "material_id" uuid;--> statement-breakpoint
ALTER TABLE "insumos" ADD COLUMN "uso" text;--> statement-breakpoint
ALTER TABLE "insumos" ADD COLUMN "posicion" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "subidas" ADD COLUMN "uso" text;--> statement-breakpoint
ALTER TABLE "subidas" ADD COLUMN "material_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bodega_bytes" bigint;--> statement-breakpoint
ALTER TABLE "materiales" ADD CONSTRAINT "materiales_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "materiales_owner_idx" ON "materiales" USING btree ("owner_id","creado_en");--> statement-breakpoint
ALTER TABLE "insumos" ADD CONSTRAINT "insumos_material_id_materiales_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materiales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subidas" ADD CONSTRAINT "subidas_material_id_materiales_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materiales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "insumos_material_idx" ON "insumos" USING btree ("material_id");--> statement-breakpoint
-- Lo crudo que sigue en el almacén pasa a la cámara de frío, con su mismo id y su misma URL: un
-- material nuevo por cada insumo sin borrar. El uso se deduce del tipo que tenía.
INSERT INTO "materiales" ("id", "owner_id", "nombre", "uso", "url", "bytes", "tipo_archivo", "duracion_s", "derechos_en", "creado_en")
SELECT "id", "owner_id", "nombre",
  CASE
    WHEN "tipo" IN ('principal', 'camara', 'pantalla') THEN 'crudo'
    WHEN "tipo" = 'imagen' AND "tipo_archivo" LIKE 'video/%' THEN 'broll'
    ELSE NULL
  END,
  "url", "bytes", "tipo_archivo", "duracion_s", "derechos_en", "creado_en"
FROM "insumos"
WHERE "borrado_en" IS NULL;--> statement-breakpoint
-- Cada insumo queda atado a su material, y sin vencimiento: el archivo ahora es de la cámara.
UPDATE "insumos" AS i
SET "material_id" = i."id", "expira_en" = NULL, "uso" = m."uso"
FROM "materiales" AS m
WHERE m."id" = i."id";--> statement-breakpoint
UPDATE "subidas" SET "material_id" = "insumo_id" WHERE "insumo_id" IN (SELECT "id" FROM "materiales");--> statement-breakpoint
-- Lo que se subió y no se pidió deja de ser insumo: vive solo en la cámara.
DELETE FROM "insumos" WHERE "comanda_id" IS NULL;
