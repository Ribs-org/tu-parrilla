CREATE TABLE "pase_comentarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pase_id" uuid NOT NULL,
	"pieza_id" uuid NOT NULL,
	"autor" text NOT NULL,
	"desde_ms" integer,
	"hasta_ms" integer,
	"zona" jsonb,
	"etiqueta" text DEFAULT 'otro' NOT NULL,
	"texto" text NOT NULL,
	"estado" text DEFAULT 'abierto' NOT NULL,
	"respuesta" text,
	"resuelto_en" uuid,
	"resuelto_at" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pase_comentarios" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pase_piezas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pase_id" uuid NOT NULL,
	"grupo" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"variante" text,
	"titulo" text NOT NULL,
	"tipo" text NOT NULL,
	"url" text NOT NULL,
	"notas" text DEFAULT '' NOT NULL,
	"responde_a" uuid,
	"estado" text DEFAULT 'en_revision' NOT NULL,
	"estado_por" text,
	"estado_en" timestamp with time zone,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pase_piezas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"instrucciones" text DEFAULT '' NOT NULL,
	"codigo_revisor" text NOT NULL,
	"codigo_editor" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"archivado_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "pases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "pase_comentarios" ADD CONSTRAINT "pase_comentarios_pase_id_pases_id_fk" FOREIGN KEY ("pase_id") REFERENCES "public"."pases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pase_comentarios" ADD CONSTRAINT "pase_comentarios_pieza_id_pase_piezas_id_fk" FOREIGN KEY ("pieza_id") REFERENCES "public"."pase_piezas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pase_piezas" ADD CONSTRAINT "pase_piezas_pase_id_pases_id_fk" FOREIGN KEY ("pase_id") REFERENCES "public"."pases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pases" ADD CONSTRAINT "pases_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pase_comentarios_pase_idx" ON "pase_comentarios" USING btree ("pase_id");--> statement-breakpoint
CREATE INDEX "pase_comentarios_pieza_idx" ON "pase_comentarios" USING btree ("pieza_id");--> statement-breakpoint
CREATE INDEX "pase_piezas_pase_idx" ON "pase_piezas" USING btree ("pase_id");--> statement-breakpoint
CREATE INDEX "pase_piezas_grupo_idx" ON "pase_piezas" USING btree ("grupo");--> statement-breakpoint
CREATE UNIQUE INDEX "pases_codigo_revisor_key" ON "pases" USING btree ("codigo_revisor");--> statement-breakpoint
CREATE UNIQUE INDEX "pases_codigo_editor_key" ON "pases" USING btree ("codigo_editor");--> statement-breakpoint
CREATE INDEX "pases_owner_idx" ON "pases" USING btree ("owner_id");