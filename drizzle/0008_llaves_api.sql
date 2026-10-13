CREATE TABLE "llaves_api" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"hash" text NOT NULL,
	"final" text NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"usada_en" timestamp with time zone,
	CONSTRAINT "llaves_api_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
ALTER TABLE "llaves_api" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "llaves_api" ADD CONSTRAINT "llaves_api_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "llaves_api_owner_idx" ON "llaves_api" USING btree ("owner_id");