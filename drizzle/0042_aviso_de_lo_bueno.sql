ALTER TABLE "hitos" ADD COLUMN "avisado_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "push_bueno" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "push_bueno_en" timestamp with time zone;