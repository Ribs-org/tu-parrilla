CREATE TABLE "puentes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"hash" text NOT NULL,
	"expira_en" timestamp with time zone NOT NULL,
	"usado_en" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "puentes_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
ALTER TABLE "puentes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "puentes" ADD CONSTRAINT "puentes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "puentes_user_idx" ON "puentes" USING btree ("user_id");