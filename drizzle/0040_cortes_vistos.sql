CREATE TABLE "cortes_vistos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"visto_en" timestamp with time zone NOT NULL,
	"me_gusta" integer NOT NULL,
	"comentarios" integer NOT NULL,
	CONSTRAINT "cortes_vistos_post_id_unique" UNIQUE("post_id")
);
--> statement-breakpoint
ALTER TABLE "cortes_vistos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cortes_vistos" ADD CONSTRAINT "cortes_vistos_post_id_scheduled_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."scheduled_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cortes_vistos" ADD CONSTRAINT "cortes_vistos_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cortes_vistos_owner_idx" ON "cortes_vistos" USING btree ("owner_id");