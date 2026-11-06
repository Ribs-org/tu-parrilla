ALTER TABLE "social_accounts" ADD COLUMN "login" text;--> statement-breakpoint
-- Toda cuenta de Instagram conectada hasta hoy salió del login de Facebook: el de Instagram llega
-- con esta misma migración.
UPDATE "social_accounts" SET "login" = 'facebook' WHERE "network" = 'instagram';
