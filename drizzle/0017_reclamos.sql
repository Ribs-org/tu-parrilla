ALTER TABLE "post_comments" ADD COLUMN "enviando_hasta" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "scheduled_post_targets" ADD COLUMN "reclamado_hasta" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "scheduled_post_targets" ADD COLUMN "publicando_desde" timestamp with time zone;