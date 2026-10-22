CREATE TABLE "subidas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"id_en_almacen" text NOT NULL,
	"clave" text NOT NULL,
	"nombre" text NOT NULL,
	"tipo_archivo" text NOT NULL,
	"bytes" bigint NOT NULL,
	"tamano_parte" integer NOT NULL,
	"tipo" text NOT NULL,
	"subtipo" text,
	"duracion_s" real,
	"derechos_en" timestamp with time zone NOT NULL,
	"insumo_id" uuid,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"cerrada_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "subidas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subidas" ADD CONSTRAINT "subidas_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subidas" ADD CONSTRAINT "subidas_insumo_id_insumos_id_fk" FOREIGN KEY ("insumo_id") REFERENCES "public"."insumos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subidas_owner_idx" ON "subidas" USING btree ("owner_id");