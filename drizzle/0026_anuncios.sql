CREATE TABLE "anuncios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"post_id" uuid,
	"external_id" text NOT NULL,
	"nombre" text,
	"estado" text,
	"cuenta_publicitaria_id" text NOT NULL,
	"cuenta_publicitaria_nombre" text,
	"moneda" text,
	"story_id" text,
	"instagram_media_id" text,
	"gasto" double precision DEFAULT 0 NOT NULL,
	"alcance" integer,
	"impresiones" integer,
	"clics" integer,
	"desde" date,
	"hasta" date,
	"leido_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anuncios_account_external_key" UNIQUE("account_id","external_id")
);
--> statement-breakpoint
ALTER TABLE "anuncios" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_account_id_social_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_post_id_social_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."social_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "anuncios_post_idx" ON "anuncios" USING btree ("post_id");