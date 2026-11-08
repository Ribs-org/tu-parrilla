CREATE TABLE "planes" (
	"clave" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"precio_clp" integer DEFAULT 0 NOT NULL,
	"dias_de_prueba" integer DEFAULT 0 NOT NULL,
	"cuentas_max" integer,
	"en_la_parrilla_max" integer,
	"bodega_bytes" bigint NOT NULL,
	"tokens_mes" integer,
	"prioridad" integer DEFAULT 0 NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "planes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Los dos planes nacen acá, antes de la llave de `users.plan`, que exige la fila `gratis`. El admin
-- los edita después en Los Maestros (docs/superpowers/specs/2026-11-08-planes-design.md).
INSERT INTO "planes" ("clave", "nombre", "precio_clp", "dias_de_prueba", "cuentas_max", "en_la_parrilla_max", "bodega_bytes", "tokens_mes", "prioridad") VALUES
	('gratis', 'Gratis', 0, 0, 3, 10, 21474836480, 100000, 0),
	('pagado', 'Asador', 34990, 7, 15, NULL, 107374182400, 2000000, 1);--> statement-breakpoint
CREATE TABLE "uso_ia" (
	"owner_id" uuid NOT NULL,
	"mes" text NOT NULL,
	"tokens" bigint DEFAULT 0 NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "uso_ia" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan" text DEFAULT 'gratis' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan_hasta" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan_origen" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "prueba_usada_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "uso_ia" ADD CONSTRAINT "uso_ia_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uso_ia_owner_mes_key" ON "uso_ia" USING btree ("owner_id","mes");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_plan_planes_clave_fk" FOREIGN KEY ("plan") REFERENCES "public"."planes"("clave") ON DELETE no action ON UPDATE no action;