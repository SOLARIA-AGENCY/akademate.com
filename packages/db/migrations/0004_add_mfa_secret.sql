ALTER TABLE "users" ADD COLUMN "mfa_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mfa_verified_at" timestamp with time zone;--> statement-breakpoint
