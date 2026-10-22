CREATE TABLE "comanda_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comanda_id" uuid NOT NULL,
	"estado" text NOT NULL,
	"mensaje" text,
	"eta" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comanda_eventos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "comandas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"marca_id" uuid,
	"ref" text NOT NULL,
	"tipo" text DEFAULT 'tanda' NOT NULL,
	"origen_id" uuid,
	"estado" text DEFAULT 'recibida' NOT NULL,
	"pedido" jsonb NOT NULL,
	"receta" jsonb NOT NULL,
	"minutos" integer DEFAULT 0 NOT NULL,
	"eta" timestamp with time zone,
	"mensaje" text,
	"motivo" text,
	"tandas_servidas" integer DEFAULT 0 NOT NULL,
	"tandas_total" integer,
	"tomada_por" text,
	"tomada_en" timestamp with time zone,
	"lista_en" timestamp with time zone,
	"servida_en" timestamp with time zone,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizada_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comandas_owner_ref_key" UNIQUE("owner_id","ref")
);
--> statement-breakpoint
ALTER TABLE "comandas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "creativo_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creativo_id" uuid NOT NULL,
	"url" text NOT NULL,
	"media_type" text NOT NULL,
	"rol" text DEFAULT 'media' NOT NULL,
	"nombre" text NOT NULL,
	"tipo_archivo" text NOT NULL,
	"bytes" bigint NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "creativo_media" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "creativos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"comanda_id" uuid NOT NULL,
	"marca_id" uuid,
	"ref" text NOT NULL,
	"pieza" text,
	"tanda" text,
	"tipo" text NOT NULL,
	"portada_url" text,
	"texto" text DEFAULT '' NOT NULL,
	"titulo_youtube" text,
	"estilo" text,
	"atributos" jsonb,
	"duracion_s" real,
	"estado" text DEFAULT 'subiendo' NOT NULL,
	"descarte_motivo" text,
	"descarte_nota" text,
	"post_id" uuid,
	"expira_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creativos_comanda_ref_key" UNIQUE("comanda_id","ref")
);
--> statement-breakpoint
ALTER TABLE "creativos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "insumos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"comanda_id" uuid,
	"tipo" text NOT NULL,
	"subtipo" text,
	"nombre" text NOT NULL,
	"url" text NOT NULL,
	"bytes" bigint NOT NULL,
	"duracion_s" real,
	"tipo_archivo" text NOT NULL,
	"derechos_en" timestamp with time zone NOT NULL,
	"expira_en" timestamp with time zone,
	"borrado_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "insumos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "latidos" (
	"trabajador" text PRIMARY KEY NOT NULL,
	"en" timestamp with time zone NOT NULL,
	"datos" jsonb
);
--> statement-breakpoint
ALTER TABLE "latidos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "marcas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"handle" text,
	"acento" text,
	"cta_texto" text,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizada_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marcas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cocina_desde" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "comanda_eventos" ADD CONSTRAINT "comanda_eventos_comanda_id_comandas_id_fk" FOREIGN KEY ("comanda_id") REFERENCES "public"."comandas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comandas" ADD CONSTRAINT "comandas_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comandas" ADD CONSTRAINT "comandas_marca_id_marcas_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comandas" ADD CONSTRAINT "comandas_origen_id_comandas_id_fk" FOREIGN KEY ("origen_id") REFERENCES "public"."comandas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creativo_media" ADD CONSTRAINT "creativo_media_creativo_id_creativos_id_fk" FOREIGN KEY ("creativo_id") REFERENCES "public"."creativos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creativos" ADD CONSTRAINT "creativos_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creativos" ADD CONSTRAINT "creativos_comanda_id_comandas_id_fk" FOREIGN KEY ("comanda_id") REFERENCES "public"."comandas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creativos" ADD CONSTRAINT "creativos_marca_id_marcas_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creativos" ADD CONSTRAINT "creativos_post_id_scheduled_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."scheduled_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insumos" ADD CONSTRAINT "insumos_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insumos" ADD CONSTRAINT "insumos_comanda_id_comandas_id_fk" FOREIGN KEY ("comanda_id") REFERENCES "public"."comandas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marcas" ADD CONSTRAINT "marcas_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comanda_eventos_comanda_idx" ON "comanda_eventos" USING btree ("comanda_id","creado_en");--> statement-breakpoint
CREATE INDEX "comandas_owner_idx" ON "comandas" USING btree ("owner_id","creada_en");--> statement-breakpoint
CREATE INDEX "comandas_estado_idx" ON "comandas" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "creativo_media_creativo_idx" ON "creativo_media" USING btree ("creativo_id");--> statement-breakpoint
CREATE INDEX "creativos_owner_idx" ON "creativos" USING btree ("owner_id","estado");--> statement-breakpoint
CREATE INDEX "insumos_owner_idx" ON "insumos" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "insumos_comanda_idx" ON "insumos" USING btree ("comanda_id");--> statement-breakpoint
CREATE INDEX "marcas_owner_idx" ON "marcas" USING btree ("owner_id");