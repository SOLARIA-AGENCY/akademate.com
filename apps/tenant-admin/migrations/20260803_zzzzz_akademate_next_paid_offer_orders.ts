import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

import {
  assertAkademateNextRuntime,
  resolveNextDatabaseAppRole,
} from '../src/runtime/select-runtime-migrations'

const createSignature = '(varchar, varchar, uuid, varchar, varchar, varchar, varchar, boolean, boolean, varchar, varchar, varchar, varchar, varchar)'
const attachSignature = '(uuid, varchar, varchar)'
const failSignature = '(uuid, varchar)'
const reconcileSignature = '(varchar, varchar, varchar, varchar, integer, varchar, varchar)'
const paypalReturnSignature = '(uuid, varchar)'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    ALTER TABLE "course_runs"
      ADD COLUMN "current_checkout_holds" integer DEFAULT 0 NOT NULL,
      ADD CONSTRAINT "course_runs_checkout_holds_nonnegative_check"
        CHECK ("current_checkout_holds" >= 0);

    CREATE TABLE "paid_offer_orders" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" integer NOT NULL,
      "course_run_id" integer NOT NULL,
      "idempotency_key" uuid NOT NULL,
      "payload_fingerprint" varchar NOT NULL,
      "contact_fingerprint" varchar NOT NULL,
      "first_name" varchar NOT NULL,
      "last_name" varchar NOT NULL,
      "email" varchar NOT NULL,
      "phone" varchar,
      "privacy_accepted" boolean NOT NULL,
      "privacy_notice_version" varchar NOT NULL,
      "marketing_consent" boolean DEFAULT false NOT NULL,
      "source_host" varchar NOT NULL,
      "source_slug" varchar NOT NULL,
      "provider" varchar NOT NULL,
      "payment_method" varchar NOT NULL,
      "payment_plan" varchar NOT NULL,
      "offer_title" varchar(240) NOT NULL,
      "offer_total_cents" integer NOT NULL,
      "amount_cents" integer NOT NULL,
      "currency" varchar(3) DEFAULT 'EUR' NOT NULL,
      "status" varchar DEFAULT 'created' NOT NULL,
      "hold_active" boolean DEFAULT false NOT NULL,
      "provider_order_id" varchar,
      "provider_checkout_url" varchar,
      "failure_code" varchar,
      "enrollment_id" integer,
      "expires_at" timestamptz NOT NULL,
      "paid_at" timestamptz,
      "created_at" timestamptz DEFAULT now() NOT NULL,
      "updated_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "paid_offer_orders_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
      CONSTRAINT "paid_offer_orders_run_fk"
        FOREIGN KEY ("tenant_id", "course_run_id")
        REFERENCES "course_runs"("tenant_id", "id") ON DELETE RESTRICT,
      CONSTRAINT "paid_offer_orders_enrollment_fk"
        FOREIGN KEY ("tenant_id", "enrollment_id")
        REFERENCES "enrollments"("tenant_id", "id") ON DELETE RESTRICT,
      CONSTRAINT "paid_offer_orders_tenant_idempotency_unique"
        UNIQUE ("tenant_id", "course_run_id", "idempotency_key"),
      CONSTRAINT "paid_offer_orders_tenant_id_id_unique"
        UNIQUE ("tenant_id", "id"),
      CONSTRAINT "paid_offer_orders_provider_order_unique"
        UNIQUE ("provider", "provider_order_id"),
      CONSTRAINT "paid_offer_orders_provider_check"
        CHECK ("provider" IN ('stripe', 'paypal')),
      CONSTRAINT "paid_offer_orders_method_check"
        CHECK (
          ("provider" = 'stripe' AND "payment_method" IN ('card_or_wallet', 'sepa_debit'))
          OR ("provider" = 'paypal' AND "payment_method" = 'paypal')
        ),
      CONSTRAINT "paid_offer_orders_plan_check"
        CHECK ("payment_plan" IN ('full_amount', 'deposit')),
      CONSTRAINT "paid_offer_orders_status_check"
        CHECK ("status" IN (
          'created', 'provider_pending', 'awaiting_payment', 'processing', 'succeeded',
          'failed', 'cancelled', 'expired', 'requires_review'
        )),
      CONSTRAINT "paid_offer_orders_money_check"
        CHECK (
          "offer_total_cents" > 0 AND "amount_cents" > 0
          AND "amount_cents" <= "offer_total_cents" AND "currency" = 'EUR'
          AND (("payment_plan" = 'full_amount' AND "amount_cents" = "offer_total_cents")
            OR ("payment_plan" = 'deposit' AND "amount_cents" < "offer_total_cents"))
        ),
      CONSTRAINT "paid_offer_orders_identity_check" CHECK (
        char_length("first_name") BETWEEN 1 AND 80
        AND char_length("last_name") BETWEEN 1 AND 120
        AND char_length("email") BETWEEN 3 AND 254
        AND "email" = lower("email")
        AND ("phone" IS NULL OR char_length("phone") BETWEEN 4 AND 32)
        AND "privacy_accepted" = true
      ),
      CONSTRAINT "paid_offer_orders_title_check"
        CHECK (char_length(btrim("offer_title")) BETWEEN 1 AND 240),
      CONSTRAINT "paid_offer_orders_fingerprint_check" CHECK (
        "payload_fingerprint" ~ '^[0-9a-f]{64}$'
        AND "contact_fingerprint" ~ '^[0-9a-f]{64}$'
      ),
      CONSTRAINT "paid_offer_orders_provider_fields_check" CHECK (
        ("provider_order_id" IS NULL AND "provider_checkout_url" IS NULL)
        OR ("provider_order_id" IS NOT NULL AND "provider_checkout_url" IS NOT NULL)
      )
    );

    CREATE UNIQUE INDEX "paid_offer_orders_active_contact_unique"
      ON "paid_offer_orders" ("tenant_id", "course_run_id", "contact_fingerprint")
      WHERE "status" IN (
        'created', 'provider_pending', 'awaiting_payment', 'processing', 'succeeded', 'requires_review'
      );
    CREATE INDEX "paid_offer_orders_expiry_idx"
      ON "paid_offer_orders" ("course_run_id", "expires_at")
      WHERE "hold_active" = true;
    CREATE INDEX "paid_offer_orders_tenant_created_idx"
      ON "paid_offer_orders" ("tenant_id", "created_at" DESC);

    CREATE TABLE "paid_offer_payment_events" (
      "id" bigserial PRIMARY KEY,
      "tenant_id" integer NOT NULL,
      "order_id" uuid NOT NULL,
      "provider" varchar NOT NULL,
      "provider_event_id" varchar NOT NULL,
      "provider_order_id" varchar NOT NULL,
      "normalized_status" varchar NOT NULL,
      "amount_cents" integer NOT NULL,
      "currency" varchar(3) NOT NULL,
      "payment_method_type" varchar,
      "requires_manual_review" boolean DEFAULT false NOT NULL,
      "created_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "paid_offer_payment_events_order_fk"
        FOREIGN KEY ("tenant_id", "order_id")
        REFERENCES "paid_offer_orders"("tenant_id", "id") ON DELETE RESTRICT,
      CONSTRAINT "paid_offer_payment_events_provider_check"
        CHECK ("provider" IN ('stripe', 'paypal')),
      CONSTRAINT "paid_offer_payment_events_status_check"
        CHECK ("normalized_status" IN ('processing', 'succeeded', 'failed', 'cancelled')),
      CONSTRAINT "paid_offer_payment_events_money_check"
        CHECK ("amount_cents" >= 0 AND "currency" ~ '^[A-Z]{3}$'),
      CONSTRAINT "paid_offer_payment_events_provider_event_unique"
        UNIQUE ("provider", "provider_event_id")
    );
    CREATE INDEX "paid_offer_payment_events_order_created_idx"
      ON "paid_offer_payment_events" ("order_id", "created_at" DESC);

    ALTER TABLE "paid_offer_orders" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "paid_offer_orders" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "paid_offer_payment_events" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "paid_offer_payment_events" FORCE ROW LEVEL SECURITY;

    CREATE POLICY "paid_offer_orders_tenant_isolation" ON "paid_offer_orders"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "paid_offer_orders_reviewer_read" ON "paid_offer_orders"
      FOR SELECT USING (akademate_next_can_review_offer_submissions());
    CREATE POLICY "paid_offer_payment_events_tenant_isolation" ON "paid_offer_payment_events"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "paid_offer_payment_events_reviewer_read" ON "paid_offer_payment_events"
      FOR SELECT USING (akademate_next_can_review_offer_submissions());

    CREATE FUNCTION "akademate_next_create_paid_offer_order"(
      request_host varchar,
      request_slug varchar,
      request_idempotency_key uuid,
      request_first_name varchar,
      request_last_name varchar,
      request_email varchar,
      request_phone varchar,
      privacy_accepted boolean,
      marketing_consent boolean,
      request_provider varchar,
      request_payment_method varchar,
      privacy_notice_version varchar,
      request_payload_fingerprint varchar,
      request_contact_fingerprint varchar
    ) RETURNS TABLE (
      order_id uuid,
      order_status varchar,
      provider varchar,
      payment_method varchar,
      amount_cents integer,
      offer_title varchar,
      currency varchar,
      expires_at timestamptz,
      provider_order_id varchar,
      provider_checkout_url varchar,
      replayed boolean
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
    AS $$
    DECLARE
      current_run public.course_runs%ROWTYPE;
      existing_order public.paid_offer_orders%ROWTYPE;
      created_order public.paid_offer_orders%ROWTYPE;
      resolved_tenant_id integer;
      resolved_offer_title varchar;
      resolved_payment_plan varchar;
      resolved_offer_total_cents integer;
      resolved_amount_cents integer;
      expired_holds integer := 0;
      requires_hold boolean;
      event_timestamp timestamptz := clock_timestamp();
    BEGIN
      IF privacy_accepted IS DISTINCT FROM true
        OR request_provider NOT IN ('stripe', 'paypal')
        OR NOT (
          (request_provider = 'stripe' AND request_payment_method IN ('card_or_wallet', 'sepa_debit'))
          OR (request_provider = 'paypal' AND request_payment_method = 'paypal')
        )
      THEN
        RAISE EXCEPTION 'paid_offer_not_available';
      END IF;

      SELECT cr.*
      INTO current_run
      FROM public."tenants" t
      JOIN public."course_runs" cr ON cr."tenant_id" = t."id"
      JOIN public."courses" c ON c."id" = cr."course_id" AND c."tenant_id" = t."id"
      WHERE t."active" = true
        AND c."active" = true
        AND (
          lower(t."domain") = lower(request_host)
          OR lower(request_host) = lower(t."slug") || '.akademate.com'
          OR lower(request_host) = lower(t."slug") || '.akademate.io'
          OR lower(request_host) = lower(t."slug") || '.localhost'
        )
        AND cr."share_slug" = request_slug
        AND cr."publication_access" IN ('public', 'unlisted')
        AND cr."status"::text IN ('published', 'enrollment_open')
        AND cr."conversion_mode"::text = 'paid_registration'
        AND (cr."enrollment_deadline" IS NULL OR cr."enrollment_deadline" >= now())
      FOR UPDATE OF cr
      LIMIT 1;

      IF current_run."id" IS NULL THEN
        RAISE EXCEPTION 'paid_offer_not_available';
      END IF;
      resolved_tenant_id := current_run."tenant_id";
      SELECT "name" INTO resolved_offer_title
      FROM public."courses"
      WHERE "tenant_id" = resolved_tenant_id AND "id" = current_run."course_id";
      IF resolved_offer_title IS NULL THEN RAISE EXCEPTION 'paid_offer_not_available'; END IF;

      SELECT * INTO existing_order
      FROM public."paid_offer_orders" existing
      WHERE existing."tenant_id" = resolved_tenant_id
        AND existing."course_run_id" = current_run."id"
        AND existing."idempotency_key" = request_idempotency_key
      FOR UPDATE;

      IF existing_order."id" IS NOT NULL THEN
        IF existing_order."payload_fingerprint" <> request_payload_fingerprint THEN
          RAISE EXCEPTION 'paid_offer_idempotency_conflict';
        END IF;
        RETURN QUERY SELECT existing_order."id", existing_order."status",
          existing_order."provider", existing_order."payment_method", existing_order."amount_cents",
          existing_order."offer_title", existing_order."currency", existing_order."expires_at", existing_order."provider_order_id",
          existing_order."provider_checkout_url", true;
        RETURN;
      END IF;

      WITH released AS (
        UPDATE public."paid_offer_orders" expired
        SET "status" = 'expired', "hold_active" = false, "updated_at" = event_timestamp
        WHERE expired."tenant_id" = resolved_tenant_id
          AND expired."course_run_id" = current_run."id"
          AND expired."hold_active" = true
          AND expired."expires_at" <= event_timestamp
        RETURNING 1
      ) SELECT count(*)::integer INTO expired_holds FROM released;

      IF expired_holds > 0 THEN
        UPDATE public."course_runs"
        SET "current_checkout_holds" = "current_checkout_holds" - expired_holds,
            "updated_at" = event_timestamp
        WHERE "tenant_id" = resolved_tenant_id AND "id" = current_run."id"
          AND "current_checkout_holds" >= expired_holds
        RETURNING * INTO current_run;
        IF current_run."id" IS NULL THEN
          RAISE EXCEPTION 'paid_offer_capacity_inconsistent';
        END IF;
      END IF;

      IF EXISTS (
        SELECT 1 FROM public."paid_offer_orders" duplicate
        WHERE duplicate."tenant_id" = resolved_tenant_id
          AND duplicate."course_run_id" = current_run."id"
          AND duplicate."contact_fingerprint" = request_contact_fingerprint
          AND duplicate."status" IN (
            'created', 'provider_pending', 'awaiting_payment', 'processing', 'succeeded', 'requires_review'
          )
      ) THEN
        RAISE EXCEPTION 'paid_offer_duplicate_contact';
      END IF;

      IF (
        SELECT count(*) FROM public."paid_offer_orders" recent
        WHERE recent."tenant_id" = resolved_tenant_id
          AND recent."course_run_id" = current_run."id"
          AND recent."contact_fingerprint" = request_contact_fingerprint
          AND recent."created_at" >= now() - interval '1 hour'
      ) >= 5 THEN
        RAISE EXCEPTION 'paid_offer_rate_limited';
      END IF;

      resolved_payment_plan := current_run."payment_plan";
      resolved_offer_total_cents := round(current_run."offer_price_amount" * 100)::integer;
      resolved_amount_cents := round((CASE
        WHEN current_run."payment_plan" = 'deposit' THEN current_run."deposit_amount"
        ELSE current_run."offer_price_amount"
      END) * 100)::integer;
      IF resolved_payment_plan NOT IN ('full_amount', 'deposit')
        OR resolved_offer_total_cents <= 0 OR resolved_amount_cents <= 0
      THEN
        RAISE EXCEPTION 'paid_offer_not_available';
      END IF;

      requires_hold := current_run."capacity_policy"::text <> 'unlimited';
      IF requires_hold
        AND current_run."current_enrollments" + current_run."current_checkout_holds"
          >= current_run."max_students"
      THEN
        RAISE EXCEPTION 'paid_offer_sold_out';
      END IF;

      IF requires_hold THEN
        UPDATE public."course_runs"
        SET "current_checkout_holds" = "current_checkout_holds" + 1,
            "updated_at" = event_timestamp
        WHERE "tenant_id" = resolved_tenant_id AND "id" = current_run."id";
      END IF;

      INSERT INTO public."paid_offer_orders" (
        "tenant_id", "course_run_id", "idempotency_key", "payload_fingerprint",
        "contact_fingerprint", "first_name", "last_name", "email", "phone",
        "privacy_accepted", "privacy_notice_version", "marketing_consent",
        "source_host", "source_slug", "provider", "payment_method", "payment_plan",
        "offer_title", "offer_total_cents", "amount_cents", "currency", "status", "hold_active",
        "expires_at", "created_at", "updated_at"
      ) VALUES (
        resolved_tenant_id, current_run."id", request_idempotency_key,
        request_payload_fingerprint, request_contact_fingerprint, request_first_name,
        request_last_name, request_email, request_phone, privacy_accepted,
        privacy_notice_version, marketing_consent, request_host, request_slug,
        request_provider, request_payment_method, resolved_payment_plan,
        resolved_offer_title,
        resolved_offer_total_cents, resolved_amount_cents, 'EUR', 'created', requires_hold,
        event_timestamp + interval '30 minutes', event_timestamp, event_timestamp
      ) RETURNING * INTO created_order;

      RETURN QUERY SELECT created_order."id", created_order."status", created_order."provider",
        created_order."payment_method", created_order."amount_cents", created_order."offer_title",
        created_order."currency",
        created_order."expires_at", created_order."provider_order_id",
        created_order."provider_checkout_url", false;
    END
    $$;

    CREATE FUNCTION "akademate_next_attach_paid_offer_checkout"(
      requested_order_id uuid,
      requested_provider_order_id varchar,
      requested_checkout_url varchar
    ) RETURNS TABLE (
      order_id uuid,
      order_status varchar,
      provider_order_id varchar,
      provider_checkout_url varchar,
      replayed boolean
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
    AS $$
    DECLARE
      current_order public.paid_offer_orders%ROWTYPE;
      event_timestamp timestamptz := clock_timestamp();
    BEGIN
      SELECT * INTO current_order FROM public."paid_offer_orders"
      WHERE "id" = requested_order_id FOR UPDATE;
      IF current_order."id" IS NULL THEN RAISE EXCEPTION 'paid_offer_order_not_found'; END IF;
      IF current_order."provider_order_id" IS NOT NULL THEN
        IF current_order."provider_order_id" <> requested_provider_order_id
          OR current_order."provider_checkout_url" <> requested_checkout_url
        THEN RAISE EXCEPTION 'paid_offer_provider_conflict'; END IF;
        RETURN QUERY SELECT current_order."id", current_order."status",
          current_order."provider_order_id", current_order."provider_checkout_url", true;
        RETURN;
      END IF;
      IF current_order."status" NOT IN ('created', 'provider_pending')
        OR current_order."expires_at" <= event_timestamp
      THEN RAISE EXCEPTION 'paid_offer_checkout_not_available'; END IF;
      IF char_length(requested_provider_order_id) NOT BETWEEN 3 AND 255
        OR char_length(requested_checkout_url) NOT BETWEEN 10 AND 2000
        OR requested_checkout_url !~ '^https://'
      THEN RAISE EXCEPTION 'paid_offer_provider_invalid'; END IF;
      IF current_order."provider" = 'stripe'
        AND (requested_provider_order_id !~ '^cs_[A-Za-z0-9_]+'
          OR requested_checkout_url !~ '^https://checkout[.]stripe[.]com/')
      THEN RAISE EXCEPTION 'paid_offer_provider_invalid'; END IF;
      IF current_order."provider" = 'paypal'
        AND (requested_provider_order_id !~ '^[A-Z0-9]+$'
          OR requested_checkout_url !~ '^https://(www[.])?(sandbox[.])?paypal[.]com/')
      THEN RAISE EXCEPTION 'paid_offer_provider_invalid'; END IF;

      UPDATE public."paid_offer_orders"
      SET "provider_order_id" = requested_provider_order_id,
          "provider_checkout_url" = requested_checkout_url,
          "status" = 'awaiting_payment', "updated_at" = event_timestamp
      WHERE "id" = current_order."id" RETURNING * INTO current_order;
      RETURN QUERY SELECT current_order."id", current_order."status",
        current_order."provider_order_id", current_order."provider_checkout_url", false;
    END
    $$;

    CREATE FUNCTION "akademate_next_fail_paid_offer_checkout"(
      requested_order_id uuid,
      requested_failure_code varchar
    ) RETURNS TABLE (order_id uuid, order_status varchar, hold_released boolean)
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
    AS $$
    DECLARE
      current_order public.paid_offer_orders%ROWTYPE;
      released boolean := false;
      event_timestamp timestamptz := clock_timestamp();
    BEGIN
      SELECT * INTO current_order FROM public."paid_offer_orders"
      WHERE "id" = requested_order_id FOR UPDATE;
      IF current_order."id" IS NULL THEN RAISE EXCEPTION 'paid_offer_order_not_found'; END IF;
      IF current_order."status" IN ('failed', 'cancelled', 'expired') THEN
        RETURN QUERY SELECT current_order."id", current_order."status", false;
        RETURN;
      END IF;
      IF current_order."status" NOT IN ('created', 'provider_pending')
        OR char_length(requested_failure_code) NOT BETWEEN 3 AND 80
      THEN RAISE EXCEPTION 'paid_offer_failure_not_available'; END IF;
      IF current_order."hold_active" THEN
        UPDATE public."course_runs"
        SET "current_checkout_holds" = "current_checkout_holds" - 1,
            "updated_at" = event_timestamp
        WHERE "tenant_id" = current_order."tenant_id" AND "id" = current_order."course_run_id"
          AND "current_checkout_holds" > 0;
        IF NOT FOUND THEN RAISE EXCEPTION 'paid_offer_capacity_inconsistent'; END IF;
        released := true;
      END IF;
      UPDATE public."paid_offer_orders"
      SET "status" = 'failed', "failure_code" = requested_failure_code,
          "hold_active" = false, "updated_at" = event_timestamp
      WHERE "id" = current_order."id" RETURNING * INTO current_order;
      RETURN QUERY SELECT current_order."id", current_order."status", released;
    END
    $$;

    CREATE FUNCTION "akademate_next_reconcile_paid_offer_event"(
      requested_provider varchar,
      requested_provider_event_id varchar,
      requested_provider_order_id varchar,
      normalized_status varchar,
      paid_amount_cents integer,
      paid_currency varchar,
      resolved_payment_method_type varchar
    ) RETURNS TABLE (
      order_id uuid,
      order_status varchar,
      enrollment_id integer,
      event_replayed boolean,
      requires_manual_review boolean
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
    AS $$
    DECLARE
      current_order public.paid_offer_orders%ROWTYPE;
      existing_event public.paid_offer_payment_events%ROWTYPE;
      created_learner public.leads%ROWTYPE;
      created_enrollment public.enrollments%ROWTYPE;
      manual_review boolean := false;
      event_timestamp timestamptz := clock_timestamp();
    BEGIN
      IF requested_provider NOT IN ('stripe', 'paypal')
        OR normalized_status NOT IN ('processing', 'succeeded', 'failed', 'cancelled')
        OR char_length(requested_provider_event_id) NOT BETWEEN 3 AND 255
        OR char_length(requested_provider_order_id) NOT BETWEEN 3 AND 255
        OR paid_amount_cents < 0 OR paid_currency !~ '^[A-Z]{3}$'
      THEN RAISE EXCEPTION 'paid_offer_event_invalid'; END IF;

      SELECT * INTO existing_event FROM public."paid_offer_payment_events"
      WHERE "provider" = requested_provider AND "provider_event_id" = requested_provider_event_id;
      IF existing_event."id" IS NOT NULL THEN
        IF existing_event."provider_order_id" <> requested_provider_order_id
          OR existing_event."normalized_status" <> normalized_status
          OR existing_event."amount_cents" <> paid_amount_cents
          OR existing_event."currency" <> paid_currency
        THEN RAISE EXCEPTION 'paid_offer_event_conflict'; END IF;
        SELECT * INTO current_order FROM public."paid_offer_orders" WHERE "id" = existing_event."order_id";
        RETURN QUERY SELECT current_order."id", current_order."status", current_order."enrollment_id",
          true, existing_event."requires_manual_review";
        RETURN;
      END IF;

      SELECT * INTO current_order FROM public."paid_offer_orders"
      WHERE "provider" = requested_provider AND "provider_order_id" = requested_provider_order_id
      FOR UPDATE;
      IF current_order."id" IS NULL THEN RAISE EXCEPTION 'paid_offer_event_order_not_found'; END IF;

      IF current_order."expires_at" <= event_timestamp
        AND current_order."status" IN ('created', 'provider_pending', 'awaiting_payment', 'processing')
      THEN
        IF current_order."hold_active" THEN
          UPDATE public."course_runs"
          SET "current_checkout_holds" = "current_checkout_holds" - 1,
              "updated_at" = event_timestamp
          WHERE "tenant_id" = current_order."tenant_id" AND "id" = current_order."course_run_id"
            AND "current_checkout_holds" > 0;
          IF NOT FOUND THEN RAISE EXCEPTION 'paid_offer_capacity_inconsistent'; END IF;
        END IF;
        UPDATE public."paid_offer_orders"
        SET "status" = 'expired', "hold_active" = false, "updated_at" = event_timestamp
        WHERE "id" = current_order."id" RETURNING * INTO current_order;
      END IF;

      IF normalized_status = 'processing' THEN
        IF current_order."status" IN ('awaiting_payment', 'processing') THEN
          UPDATE public."paid_offer_orders" SET "status" = 'processing', "updated_at" = event_timestamp
          WHERE "id" = current_order."id" RETURNING * INTO current_order;
        ELSIF current_order."status" <> 'succeeded' THEN
          manual_review := true;
        END IF;
      ELSIF normalized_status = 'succeeded' THEN
        IF current_order."status" = 'succeeded' THEN
          NULL;
        ELSIF current_order."status" NOT IN ('awaiting_payment', 'processing')
          OR current_order."amount_cents" <> paid_amount_cents
          OR current_order."currency" <> paid_currency
          OR (current_order."hold_active" = false
            AND (SELECT "capacity_policy"::text FROM public."course_runs"
              WHERE "id" = current_order."course_run_id") <> 'unlimited')
            THEN
              manual_review := true;
              IF current_order."hold_active" THEN
                UPDATE public."course_runs"
                SET "current_checkout_holds" = "current_checkout_holds" - 1,
                    "updated_at" = event_timestamp
                WHERE "tenant_id" = current_order."tenant_id" AND "id" = current_order."course_run_id"
                  AND "current_checkout_holds" > 0;
                IF NOT FOUND THEN RAISE EXCEPTION 'paid_offer_capacity_inconsistent'; END IF;
              END IF;
              UPDATE public."paid_offer_orders"
              SET "status" = 'requires_review', "hold_active" = false,
                  "updated_at" = event_timestamp
              WHERE "id" = current_order."id" RETURNING * INTO current_order;
        ELSE
          INSERT INTO public."leads" (
            "first_name", "last_name", "email", "phone", "course_id",
            "gdpr_consent", "privacy_policy_accepted", "marketing_consent",
            "consent_timestamp", "status", "priority", "tenant_id", "updated_at", "created_at"
          ) SELECT current_order."first_name", current_order."last_name", current_order."email",
            COALESCE(current_order."phone", ''), run."course_id", true, true,
            current_order."marketing_consent", current_order."created_at", 'converted', 'medium',
            current_order."tenant_id", event_timestamp, event_timestamp
          FROM public."course_runs" run
          WHERE run."tenant_id" = current_order."tenant_id" AND run."id" = current_order."course_run_id"
          RETURNING * INTO created_learner;

          INSERT INTO public."enrollments" (
            "tenant_id", "student_id", "course_run_id", "status", "payment_status",
            "total_amount", "amount_paid", "enrolled_at", "confirmed_at", "updated_at", "created_at"
          ) VALUES (
            current_order."tenant_id", created_learner."id", current_order."course_run_id", 'confirmed',
            CASE WHEN current_order."amount_cents" < current_order."offer_total_cents"
              THEN 'partial' ELSE 'paid' END::public.enum_enrollments_payment_status,
            current_order."offer_total_cents" / 100.0, current_order."amount_cents" / 100.0,
            event_timestamp, event_timestamp, event_timestamp, event_timestamp
          ) RETURNING * INTO created_enrollment;

          UPDATE public."course_runs"
          SET "current_checkout_holds" = "current_checkout_holds" - CASE
                WHEN current_order."hold_active" THEN 1 ELSE 0 END,
              "current_enrollments" = "current_enrollments" + 1,
              "updated_at" = event_timestamp
          WHERE "tenant_id" = current_order."tenant_id" AND "id" = current_order."course_run_id"
            AND (NOT current_order."hold_active" OR "current_checkout_holds" > 0);
          IF NOT FOUND THEN RAISE EXCEPTION 'paid_offer_capacity_inconsistent'; END IF;

          UPDATE public."paid_offer_orders"
          SET "status" = 'succeeded', "hold_active" = false,
              "enrollment_id" = created_enrollment."id", "paid_at" = event_timestamp,
              "updated_at" = event_timestamp
          WHERE "id" = current_order."id" RETURNING * INTO current_order;
        END IF;
      ELSE
        IF current_order."status" = 'succeeded' THEN
          manual_review := true;
            ELSIF current_order."status" = 'requires_review' THEN
              manual_review := true;
            ELSIF current_order."status" IN ('created', 'provider_pending', 'awaiting_payment', 'processing') THEN
          IF current_order."hold_active" THEN
            UPDATE public."course_runs"
            SET "current_checkout_holds" = "current_checkout_holds" - 1,
                "updated_at" = event_timestamp
            WHERE "tenant_id" = current_order."tenant_id" AND "id" = current_order."course_run_id"
              AND "current_checkout_holds" > 0;
            IF NOT FOUND THEN RAISE EXCEPTION 'paid_offer_capacity_inconsistent'; END IF;
          END IF;
          UPDATE public."paid_offer_orders"
          SET "status" = normalized_status, "hold_active" = false, "updated_at" = event_timestamp
          WHERE "id" = current_order."id" RETURNING * INTO current_order;
        END IF;
      END IF;

      INSERT INTO public."paid_offer_payment_events" (
        "tenant_id", "order_id", "provider", "provider_event_id", "provider_order_id",
        "normalized_status", "amount_cents", "currency", "payment_method_type",
        "requires_manual_review", "created_at"
      ) VALUES (
        current_order."tenant_id", current_order."id", requested_provider,
        requested_provider_event_id, requested_provider_order_id, normalized_status,
        paid_amount_cents, paid_currency, resolved_payment_method_type, manual_review, event_timestamp
      );

      RETURN QUERY SELECT current_order."id", current_order."status", current_order."enrollment_id",
        false, manual_review;
    END
    $$;

    CREATE FUNCTION "akademate_next_get_paypal_return"(
      requested_order_id uuid,
      requested_provider_order_id varchar
    ) RETURNS TABLE (source_host varchar, source_slug varchar, order_status varchar)
    LANGUAGE sql
    SECURITY DEFINER
    STABLE
    SET search_path = pg_catalog, public
    AS $$
      SELECT "source_host", "source_slug", "status"
      FROM public."paid_offer_orders"
      WHERE "id" = requested_order_id
        AND "provider" = 'paypal'
        AND "provider_order_id" = requested_provider_order_id
        AND "status" IN ('awaiting_payment', 'processing', 'succeeded')
      LIMIT 1
    $$;

    REVOKE ALL ON "paid_offer_orders" FROM PUBLIC;
    REVOKE ALL ON "paid_offer_orders" FROM ${applicationRoleIdentifier};
    REVOKE ALL ON "paid_offer_payment_events" FROM PUBLIC;
    REVOKE ALL ON "paid_offer_payment_events" FROM ${applicationRoleIdentifier};
    REVOKE ALL ON SEQUENCE "paid_offer_payment_events_id_seq" FROM ${applicationRoleIdentifier};
    GRANT SELECT ON "paid_offer_orders" TO ${applicationRoleIdentifier};
    GRANT SELECT ON "paid_offer_payment_events" TO ${applicationRoleIdentifier};
    GRANT EXECUTE ON FUNCTION "akademate_next_create_paid_offer_order"${sql.raw(createSignature)}
      TO ${applicationRoleIdentifier};
    GRANT EXECUTE ON FUNCTION "akademate_next_attach_paid_offer_checkout"${sql.raw(attachSignature)}
      TO ${applicationRoleIdentifier};
    GRANT EXECUTE ON FUNCTION "akademate_next_fail_paid_offer_checkout"${sql.raw(failSignature)}
      TO ${applicationRoleIdentifier};
    GRANT EXECUTE ON FUNCTION "akademate_next_reconcile_paid_offer_event"${sql.raw(reconcileSignature)}
      TO ${applicationRoleIdentifier};
    GRANT EXECUTE ON FUNCTION "akademate_next_get_paypal_return"${sql.raw(paypalReturnSignature)}
      TO ${applicationRoleIdentifier};
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM "paid_offer_orders")
        OR EXISTS (SELECT 1 FROM "paid_offer_payment_events")
      THEN
        RAISE EXCEPTION 'Cannot roll back paid offer orders while payment evidence exists';
      END IF;
    END
    $$;

    REVOKE ALL ON FUNCTION "akademate_next_reconcile_paid_offer_event"${sql.raw(reconcileSignature)}
      FROM ${applicationRoleIdentifier};
    REVOKE ALL ON FUNCTION "akademate_next_get_paypal_return"${sql.raw(paypalReturnSignature)}
      FROM ${applicationRoleIdentifier};
    DROP FUNCTION "akademate_next_get_paypal_return"${sql.raw(paypalReturnSignature)};
    REVOKE ALL ON FUNCTION "akademate_next_fail_paid_offer_checkout"${sql.raw(failSignature)}
      FROM ${applicationRoleIdentifier};
    REVOKE ALL ON FUNCTION "akademate_next_attach_paid_offer_checkout"${sql.raw(attachSignature)}
      FROM ${applicationRoleIdentifier};
    REVOKE ALL ON FUNCTION "akademate_next_create_paid_offer_order"${sql.raw(createSignature)}
      FROM ${applicationRoleIdentifier};
    DROP FUNCTION "akademate_next_reconcile_paid_offer_event"${sql.raw(reconcileSignature)};
    DROP FUNCTION "akademate_next_fail_paid_offer_checkout"${sql.raw(failSignature)};
    DROP FUNCTION "akademate_next_attach_paid_offer_checkout"${sql.raw(attachSignature)};
    DROP FUNCTION "akademate_next_create_paid_offer_order"${sql.raw(createSignature)};
    DROP POLICY "paid_offer_payment_events_reviewer_read" ON "paid_offer_payment_events";
    DROP POLICY "paid_offer_payment_events_tenant_isolation" ON "paid_offer_payment_events";
    DROP POLICY "paid_offer_orders_reviewer_read" ON "paid_offer_orders";
    DROP POLICY "paid_offer_orders_tenant_isolation" ON "paid_offer_orders";
    DROP TABLE "paid_offer_payment_events";
    DROP TABLE "paid_offer_orders";
    ALTER TABLE "course_runs"
      DROP CONSTRAINT "course_runs_checkout_holds_nonnegative_check",
      DROP COLUMN "current_checkout_holds";
  `)
}
