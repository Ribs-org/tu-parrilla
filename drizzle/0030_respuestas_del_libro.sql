ALTER TABLE "sugerencias" ADD COLUMN "respuesta" text;--> statement-breakpoint
ALTER TABLE "sugerencias" ADD COLUMN "respondida_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sugerencias" ADD COLUMN "respondida_por" uuid;--> statement-breakpoint
ALTER TABLE "sugerencias" ADD COLUMN "respuesta_leida_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sugerencias" ADD CONSTRAINT "sugerencias_respondida_por_users_id_fk" FOREIGN KEY ("respondida_por") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;