import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

import { assertAkademateNextRuntime } from '../src/runtime/select-runtime-migrations'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)

  await db.execute(sql`
    ALTER TABLE "course_runs"
      ADD COLUMN "publication_access" varchar DEFAULT 'private' NOT NULL,
      ADD COLUMN "conversion_mode" varchar DEFAULT 'information_only' NOT NULL,
      ADD COLUMN "share_slug" varchar(160),
      ADD COLUMN "form_template_key" varchar(128),
      ADD COLUMN "external_action_url" varchar(2048),
      ADD COLUMN "payment_plan" varchar,
      ADD COLUMN "deposit_amount" numeric(12, 2),
      ADD COLUMN "cta_label" varchar(80),
      ADD COLUMN "capacity_policy" varchar DEFAULT 'limited' NOT NULL;

    ALTER TABLE "course_runs"
      ADD CONSTRAINT "course_runs_publication_access_check"
        CHECK ("publication_access" IN ('private', 'public', 'unlisted')),
      ADD CONSTRAINT "course_runs_conversion_mode_check"
        CHECK ("conversion_mode" IN (
          'information_only',
          'interest_form',
          'free_registration',
          'approval_required',
          'paid_registration',
          'external_link'
        )),
      ADD CONSTRAINT "course_runs_share_slug_check"
        CHECK (
          "share_slug" IS NULL
          OR (
            length("share_slug") BETWEEN 3 AND 160
            AND "share_slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
          )
        ),
      ADD CONSTRAINT "course_runs_public_share_slug_check"
        CHECK ("publication_access" = 'private' OR "share_slug" IS NOT NULL),
      ADD CONSTRAINT "course_runs_form_template_key_check"
        CHECK (
          "form_template_key" IS NULL
          OR "form_template_key" ~ '^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$'
        ),
      ADD CONSTRAINT "course_runs_form_mode_check"
        CHECK (
          ("conversion_mode" IN ('interest_form', 'approval_required') AND "form_template_key" IS NOT NULL)
          OR ("conversion_mode" IN ('free_registration', 'paid_registration'))
          OR ("conversion_mode" IN ('information_only', 'external_link') AND "form_template_key" IS NULL)
        ),
      ADD CONSTRAINT "course_runs_external_action_check"
        CHECK (
          (
            "conversion_mode" = 'external_link'
            AND "external_action_url" IS NOT NULL
            AND "external_action_url" ~ '^https://'
          )
          OR ("conversion_mode" <> 'external_link' AND "external_action_url" IS NULL)
        ),
      ADD CONSTRAINT "course_runs_payment_mode_check"
        CHECK (
          (
            "conversion_mode" = 'paid_registration'
            AND "payment_plan" IS NOT NULL
            AND "payment_plan" IN ('full_amount', 'deposit')
            AND "price_snapshot" IS NOT NULL
            AND "price_snapshot" > 0
            AND (
              ("payment_plan" = 'full_amount' AND "deposit_amount" IS NULL)
              OR (
                "payment_plan" = 'deposit'
                AND "deposit_amount" IS NOT NULL
                AND "deposit_amount" > 0
                AND "deposit_amount" < "price_snapshot"
              )
            )
          )
          OR (
            "conversion_mode" <> 'paid_registration'
            AND "payment_plan" IS NULL
            AND "deposit_amount" IS NULL
          )
        ),
      ADD CONSTRAINT "course_runs_cta_label_check"
        CHECK ("cta_label" IS NULL OR length(btrim("cta_label")) BETWEEN 1 AND 80),
      ADD CONSTRAINT "course_runs_capacity_policy_check"
        CHECK ("capacity_policy" IN ('limited', 'waitlist', 'unlimited'));

    CREATE UNIQUE INDEX "course_runs_tenant_share_slug_unique"
      ON "course_runs" ("tenant_id", "share_slug")
      WHERE "share_slug" IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM "course_runs"
        WHERE "publication_access" <> 'private'
          OR "conversion_mode" <> 'information_only'
          OR "share_slug" IS NOT NULL
          OR "form_template_key" IS NOT NULL
          OR "external_action_url" IS NOT NULL
          OR "payment_plan" IS NOT NULL
          OR "deposit_amount" IS NOT NULL
          OR "cta_label" IS NOT NULL
          OR "capacity_policy" <> 'limited'
      ) THEN
        RAISE EXCEPTION
          'Cannot roll back offer conversion modes while configured course offers exist';
      END IF;
    END
    $$;

    DROP INDEX "course_runs_tenant_share_slug_unique";
    ALTER TABLE "course_runs"
      DROP CONSTRAINT "course_runs_capacity_policy_check",
      DROP CONSTRAINT "course_runs_cta_label_check",
      DROP CONSTRAINT "course_runs_payment_mode_check",
      DROP CONSTRAINT "course_runs_external_action_check",
      DROP CONSTRAINT "course_runs_form_mode_check",
      DROP CONSTRAINT "course_runs_form_template_key_check",
      DROP CONSTRAINT "course_runs_public_share_slug_check",
      DROP CONSTRAINT "course_runs_share_slug_check",
      DROP CONSTRAINT "course_runs_conversion_mode_check",
      DROP CONSTRAINT "course_runs_publication_access_check",
      DROP COLUMN "capacity_policy",
      DROP COLUMN "cta_label",
      DROP COLUMN "deposit_amount",
      DROP COLUMN "payment_plan",
      DROP COLUMN "external_action_url",
      DROP COLUMN "form_template_key",
      DROP COLUMN "share_slug",
      DROP COLUMN "conversion_mode",
      DROP COLUMN "publication_access";
  `)
}
