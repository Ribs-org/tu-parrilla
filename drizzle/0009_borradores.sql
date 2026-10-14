CREATE TABLE "borrador_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"borrador_id" uuid NOT NULL,
	"blob_url" text NOT NULL,
	"media_type" text NOT NULL,
	"nombre" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "borrador_media" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "borradores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"campos" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"fecha" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "borradores" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "borrador_media" ADD CONSTRAINT "borrador_media_borrador_id_borradores_id_fk" FOREIGN KEY ("borrador_id") REFERENCES "public"."borradores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borradores" ADD CONSTRAINT "borradores_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "borrador_media_borrador_idx" ON "borrador_media" USING btree ("borrador_id");--> statement-breakpoint
CREATE INDEX "borradores_owner_idx" ON "borradores" USING btree ("owner_id");