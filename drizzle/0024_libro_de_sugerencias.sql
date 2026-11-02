CREATE TABLE "sugerencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"texto" text NOT NULL,
	"contexto" jsonb NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"intentos" integer DEFAULT 0 NOT NULL,
	"intentada_en" timestamp with time zone,
	"ultimo_error" text,
	"issue_numero" integer,
	"issue_url" text,
	"enviada_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sugerencias" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sugerencias" ADD CONSTRAINT "sugerencias_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sugerencias_owner_idx" ON "sugerencias" USING btree ("owner_id","creada_en");