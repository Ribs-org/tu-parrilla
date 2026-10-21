DROP INDEX "scheduled_posts_owner_idx";--> statement-breakpoint
DROP INDEX "social_posts_campaign_idx";--> statement-breakpoint
DROP INDEX "social_posts_owner_idx";--> statement-breakpoint
CREATE INDEX "scheduled_post_targets_external_idx" ON "scheduled_post_targets" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "scheduled_posts_owner_scheduled_idx" ON "scheduled_posts" USING btree ("owner_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "social_posts_account_published_idx" ON "social_posts" USING btree ("account_id","published_at");--> statement-breakpoint
CREATE INDEX "social_posts_owner_published_idx" ON "social_posts" USING btree ("owner_id","published_at");