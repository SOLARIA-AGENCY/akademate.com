import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "meta_campaign_id" varchar(64);
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "ad_id" varchar(64);
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "adset_id" varchar(64);
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "fbclid" varchar(255);
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "fbc" varchar(255);
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "fbp" varchar(255);
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "is_test" boolean DEFAULT false;
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "source_details" jsonb;

    UPDATE "leads" SET "is_test" = false WHERE "is_test" IS NULL;
    ALTER TABLE "leads" ALTER COLUMN "is_test" SET NOT NULL;
    ALTER TABLE "leads" ALTER COLUMN "is_test" SET DEFAULT false;

    CREATE INDEX IF NOT EXISTS "idx_leads_meta_campaign_id" ON "leads" USING btree ("meta_campaign_id");
    CREATE INDEX IF NOT EXISTS "idx_leads_ad_id" ON "leads" USING btree ("ad_id");
    CREATE INDEX IF NOT EXISTS "idx_leads_adset_id" ON "leads" USING btree ("adset_id");
    CREATE INDEX IF NOT EXISTS "idx_leads_fbclid" ON "leads" USING btree ("fbclid");
    CREATE INDEX IF NOT EXISTS "idx_leads_is_test" ON "leads" USING btree ("is_test");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "idx_leads_is_test";
    DROP INDEX IF EXISTS "idx_leads_fbclid";
    DROP INDEX IF EXISTS "idx_leads_adset_id";
    DROP INDEX IF EXISTS "idx_leads_ad_id";
    DROP INDEX IF EXISTS "idx_leads_meta_campaign_id";

    ALTER TABLE "leads" DROP COLUMN IF EXISTS "source_details";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "is_test";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "fbp";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "fbc";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "fbclid";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "adset_id";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "ad_id";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "meta_campaign_id";
  `)
}
