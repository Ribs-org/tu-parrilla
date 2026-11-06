CREATE TABLE "promociones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"cuenta_publicitaria_id" text NOT NULL,
	"moneda" text NOT NULL,
	"campana_id" text NOT NULL,
	"conjunto_id" text NOT NULL,
	"creativo_id" text NOT NULL,
	"anuncio_id" text NOT NULL,
	"objetivo" text NOT NULL,
	"tipo_presupuesto" text NOT NULL,
	"presupuesto" bigint NOT NULL,
	"gasto_maximo" bigint NOT NULL,
	"desde" timestamp with time zone NOT NULL,
	"hasta" timestamp with time zone NOT NULL,
	"paises" jsonb NOT NULL,
	"edad_min" integer NOT NULL,
	"edad_max" integer,
	"advantage" boolean DEFAULT false NOT NULL,
	"estado" text NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizada_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "promociones" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "promociones" ADD CONSTRAINT "promociones_account_id_social_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promociones" ADD CONSTRAINT "promociones_post_id_social_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."social_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "promociones_post_idx" ON "promociones" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "promociones_account_idx" ON "promociones" USING btree ("account_id");