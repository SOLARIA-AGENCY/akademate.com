import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

import {
  assertAkademateNextRuntime,
  resolveNextDatabaseAppRole,
} from '../src/runtime/select-runtime-migrations'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    ALTER TABLE "users"
      ADD CONSTRAINT "users_tenant_id_id_unique" UNIQUE ("tenant_id", "id");
    ALTER TABLE "course_runs"
      ADD CONSTRAINT "course_runs_tenant_id_id_unique" UNIQUE ("tenant_id", "id");

    ALTER TABLE "students" ADD COLUMN "user_account_id" integer;
    ALTER TABLE "students" ALTER COLUMN "tenant_id" SET NOT NULL;
    ALTER TABLE "students"
      ADD CONSTRAINT "students_tenant_id_id_user_unique"
      UNIQUE ("tenant_id", "id", "user_account_id");
    ALTER TABLE "students"
      ADD CONSTRAINT "students_tenant_user_account_fk"
      FOREIGN KEY ("tenant_id", "user_account_id") REFERENCES "users"("tenant_id", "id")
      ON DELETE set null ON UPDATE no action;
    CREATE UNIQUE INDEX "students_user_account_unique"
      ON "students" ("tenant_id", "user_account_id")
      WHERE "user_account_id" IS NOT NULL;

    ALTER TABLE "staff" ADD COLUMN "tenant_id" integer NOT NULL;
    ALTER TABLE "staff" ADD COLUMN "user_account_id" integer;
    ALTER TABLE "staff"
      ADD CONSTRAINT "staff_tenant_fk"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "staff"
      ADD CONSTRAINT "staff_tenant_id_id_user_unique"
      UNIQUE ("tenant_id", "id", "user_account_id");
    ALTER TABLE "staff"
      ADD CONSTRAINT "staff_tenant_user_account_fk"
      FOREIGN KEY ("tenant_id", "user_account_id") REFERENCES "users"("tenant_id", "id")
      ON DELETE set null ON UPDATE no action;
    CREATE UNIQUE INDEX "staff_user_account_unique"
      ON "staff" ("tenant_id", "user_account_id")
      WHERE "user_account_id" IS NOT NULL;
    CREATE INDEX "staff_tenant_idx" ON "staff" ("tenant_id");

    CREATE TABLE "learning_memberships" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "course_run_id" integer NOT NULL,
      "user_id" integer NOT NULL,
      "staff_profile_id" integer,
      "student_profile_id" integer,
      "role" varchar NOT NULL,
      "status" varchar DEFAULT 'active' NOT NULL,
      "valid_from" timestamp(3) with time zone,
      "valid_until" timestamp(3) with time zone,
      "revoked_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "learning_memberships_role_check"
        CHECK ("role" IN ('instructor', 'student')),
      CONSTRAINT "learning_memberships_status_check"
        CHECK ("status" IN ('active', 'suspended', 'revoked', 'completed')),
      CONSTRAINT "learning_memberships_profile_check"
        CHECK (
          ("role" = 'instructor' AND "staff_profile_id" IS NOT NULL AND "student_profile_id" IS NULL)
          OR
          ("role" = 'student' AND "student_profile_id" IS NOT NULL AND "staff_profile_id" IS NULL)
        ),
      CONSTRAINT "learning_memberships_window_check"
        CHECK ("valid_until" IS NULL OR "valid_from" IS NULL OR "valid_until" > "valid_from"),
      CONSTRAINT "learning_memberships_revoked_at_check"
        CHECK (("status" = 'revoked') = ("revoked_at" IS NOT NULL)),
      CONSTRAINT "learning_memberships_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade,
      CONSTRAINT "learning_memberships_course_run_fk"
        FOREIGN KEY ("tenant_id", "course_run_id")
        REFERENCES "course_runs"("tenant_id", "id") ON DELETE cascade,
      CONSTRAINT "learning_memberships_user_fk"
        FOREIGN KEY ("tenant_id", "user_id")
        REFERENCES "users"("tenant_id", "id") ON DELETE cascade,
      CONSTRAINT "learning_memberships_staff_profile_fk"
        FOREIGN KEY ("tenant_id", "staff_profile_id", "user_id")
        REFERENCES "staff"("tenant_id", "id", "user_account_id") ON DELETE cascade,
      CONSTRAINT "learning_memberships_student_profile_fk"
        FOREIGN KEY ("tenant_id", "student_profile_id", "user_id")
        REFERENCES "students"("tenant_id", "id", "user_account_id") ON DELETE cascade,
      CONSTRAINT "learning_memberships_tenant_course_user_unique"
        UNIQUE ("tenant_id", "course_run_id", "user_id"),
      CONSTRAINT "learning_memberships_scope_unique"
        UNIQUE ("tenant_id", "id", "course_run_id", "user_id")
    );

    CREATE TABLE "learning_conversations" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "course_run_id" integer NOT NULL,
      "created_by_user_id" integer NOT NULL,
      "title" varchar NOT NULL,
      "mode" varchar DEFAULT 'discussion' NOT NULL,
      "status" varchar DEFAULT 'active' NOT NULL,
      "archived_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "learning_conversations_title_check"
        CHECK (length(btrim("title")) BETWEEN 1 AND 200),
      CONSTRAINT "learning_conversations_mode_check"
        CHECK ("mode" IN ('announcement', 'discussion', 'support')),
      CONSTRAINT "learning_conversations_status_check"
        CHECK ("status" IN ('active', 'archived')),
      CONSTRAINT "learning_conversations_archived_at_check"
        CHECK (("status" = 'archived') = ("archived_at" IS NOT NULL)),
      CONSTRAINT "learning_conversations_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade,
      CONSTRAINT "learning_conversations_course_run_fk"
        FOREIGN KEY ("tenant_id", "course_run_id")
        REFERENCES "course_runs"("tenant_id", "id") ON DELETE cascade,
      CONSTRAINT "learning_conversations_creator_fk"
        FOREIGN KEY ("tenant_id", "created_by_user_id")
        REFERENCES "users"("tenant_id", "id") ON DELETE restrict,
      CONSTRAINT "learning_conversations_scope_unique"
        UNIQUE ("tenant_id", "id", "course_run_id")
    );

    CREATE TABLE "learning_conversation_participants" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "course_run_id" integer NOT NULL,
      "conversation_id" integer NOT NULL,
      "membership_id" integer NOT NULL,
      "user_id" integer NOT NULL,
      "role" varchar DEFAULT 'member' NOT NULL,
      "status" varchar DEFAULT 'active' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "learning_conversation_participants_role_check"
        CHECK ("role" IN ('member', 'moderator')),
      CONSTRAINT "learning_conversation_participants_status_check"
        CHECK ("status" IN ('active', 'muted', 'removed')),
      CONSTRAINT "learning_conversation_participants_conversation_fk"
        FOREIGN KEY ("tenant_id", "conversation_id", "course_run_id")
        REFERENCES "learning_conversations"("tenant_id", "id", "course_run_id") ON DELETE cascade,
      CONSTRAINT "learning_conversation_participants_membership_fk"
        FOREIGN KEY ("tenant_id", "membership_id", "course_run_id", "user_id")
        REFERENCES "learning_memberships"("tenant_id", "id", "course_run_id", "user_id") ON DELETE cascade,
      CONSTRAINT "learning_conversation_participants_unique"
        UNIQUE ("tenant_id", "conversation_id", "user_id")
    );

    CREATE TABLE "learning_messages" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "course_run_id" integer NOT NULL,
      "conversation_id" integer NOT NULL,
      "sender_user_id" integer NOT NULL,
      "client_message_id" varchar NOT NULL,
      "body" text DEFAULT '' NOT NULL,
      "attachment_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "status" varchar DEFAULT 'sent' NOT NULL,
      "edited_at" timestamp(3) with time zone,
      "deleted_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "learning_messages_client_id_check"
        CHECK ("client_message_id" ~ '^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$'),
      CONSTRAINT "learning_messages_body_check" CHECK (length("body") <= 10000),
      CONSTRAINT "learning_messages_attachments_type_check"
        CHECK (jsonb_typeof("attachment_ids") = 'array'),
      CONSTRAINT "learning_messages_content_check"
        CHECK (
          length(btrim("body")) > 0
          OR CASE WHEN jsonb_typeof("attachment_ids") = 'array'
            THEN jsonb_array_length("attachment_ids") > 0 ELSE false END
        ),
      CONSTRAINT "learning_messages_attachments_count_check"
        CHECK (jsonb_array_length("attachment_ids") <= 10),
      CONSTRAINT "learning_messages_status_check" CHECK ("status" = 'sent'),
      CONSTRAINT "learning_messages_conversation_fk"
        FOREIGN KEY ("tenant_id", "conversation_id", "course_run_id")
        REFERENCES "learning_conversations"("tenant_id", "id", "course_run_id") ON DELETE cascade,
      CONSTRAINT "learning_messages_sender_participant_fk"
        FOREIGN KEY ("tenant_id", "conversation_id", "sender_user_id")
        REFERENCES "learning_conversation_participants"("tenant_id", "conversation_id", "user_id") ON DELETE restrict,
      CONSTRAINT "learning_messages_client_unique"
        UNIQUE ("tenant_id", "conversation_id", "client_message_id")
    );

    CREATE TABLE "learning_assignments" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "course_run_id" integer NOT NULL,
      "created_by_user_id" integer NOT NULL,
      "title" varchar NOT NULL,
      "instructions" text NOT NULL,
      "due_at" timestamp(3) with time zone,
      "max_score" numeric(7, 2) NOT NULL,
      "allow_late" boolean DEFAULT false NOT NULL,
      "status" varchar DEFAULT 'draft' NOT NULL,
      "published_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "learning_assignments_title_check"
        CHECK (length(btrim("title")) BETWEEN 1 AND 200),
      CONSTRAINT "learning_assignments_instructions_check"
        CHECK (length(btrim("instructions")) BETWEEN 1 AND 20000),
      CONSTRAINT "learning_assignments_max_score_check"
        CHECK ("max_score" > 0 AND "max_score" <= 1000),
      CONSTRAINT "learning_assignments_status_check"
        CHECK ("status" IN ('draft', 'published', 'closed')),
      CONSTRAINT "learning_assignments_published_at_check"
        CHECK (("status" = 'draft' AND "published_at" IS NULL) OR ("status" <> 'draft' AND "published_at" IS NOT NULL)),
      CONSTRAINT "learning_assignments_course_run_fk"
        FOREIGN KEY ("tenant_id", "course_run_id")
        REFERENCES "course_runs"("tenant_id", "id") ON DELETE cascade,
      CONSTRAINT "learning_assignments_creator_fk"
        FOREIGN KEY ("tenant_id", "created_by_user_id")
        REFERENCES "users"("tenant_id", "id") ON DELETE restrict,
      CONSTRAINT "learning_assignments_scope_unique"
        UNIQUE ("tenant_id", "id", "course_run_id")
    );

    CREATE TABLE "learning_submissions" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "course_run_id" integer NOT NULL,
      "assignment_id" integer NOT NULL,
      "student_user_id" integer NOT NULL,
      "client_submission_id" varchar NOT NULL,
      "body" text DEFAULT '' NOT NULL,
      "attachment_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "status" varchar DEFAULT 'submitted' NOT NULL,
      "submitted_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "attempt_number" integer DEFAULT 1 NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "learning_submissions_client_id_check"
        CHECK ("client_submission_id" ~ '^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$'),
      CONSTRAINT "learning_submissions_body_check" CHECK (length("body") <= 50000),
      CONSTRAINT "learning_submissions_attachments_type_check"
        CHECK (jsonb_typeof("attachment_ids") = 'array'),
      CONSTRAINT "learning_submissions_content_check"
        CHECK (
          length(btrim("body")) > 0
          OR CASE WHEN jsonb_typeof("attachment_ids") = 'array'
            THEN jsonb_array_length("attachment_ids") > 0 ELSE false END
        ),
      CONSTRAINT "learning_submissions_attachments_count_check"
        CHECK (jsonb_array_length("attachment_ids") <= 20),
      CONSTRAINT "learning_submissions_status_check"
        CHECK ("status" IN ('submitted', 'returned', 'graded')),
      CONSTRAINT "learning_submissions_attempt_check" CHECK ("attempt_number" >= 1),
      CONSTRAINT "learning_submissions_assignment_fk"
        FOREIGN KEY ("tenant_id", "assignment_id", "course_run_id")
        REFERENCES "learning_assignments"("tenant_id", "id", "course_run_id") ON DELETE cascade,
      CONSTRAINT "learning_submissions_student_membership_fk"
        FOREIGN KEY ("tenant_id", "course_run_id", "student_user_id")
        REFERENCES "learning_memberships"("tenant_id", "course_run_id", "user_id") ON DELETE restrict,
      CONSTRAINT "learning_submissions_client_unique"
        UNIQUE ("tenant_id", "assignment_id", "student_user_id", "client_submission_id"),
      CONSTRAINT "learning_submissions_attempt_unique"
        UNIQUE ("tenant_id", "assignment_id", "student_user_id", "attempt_number"),
      CONSTRAINT "learning_submissions_scope_unique"
        UNIQUE ("tenant_id", "id", "course_run_id", "assignment_id", "student_user_id")
    );

    CREATE TABLE "learning_grades" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "course_run_id" integer NOT NULL,
      "assignment_id" integer NOT NULL,
      "submission_id" integer NOT NULL,
      "student_user_id" integer NOT NULL,
      "grader_user_id" integer NOT NULL,
      "score" numeric(7, 2) NOT NULL,
      "max_score" numeric(7, 2) NOT NULL,
      "feedback" text DEFAULT '' NOT NULL,
      "status" varchar DEFAULT 'draft' NOT NULL,
      "graded_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "published_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "learning_grades_score_check"
        CHECK ("score" >= 0 AND "max_score" > 0 AND "max_score" <= 1000 AND "score" <= "max_score"),
      CONSTRAINT "learning_grades_feedback_check" CHECK (length("feedback") <= 20000),
      CONSTRAINT "learning_grades_status_check" CHECK ("status" IN ('draft', 'published')),
      CONSTRAINT "learning_grades_published_at_check"
        CHECK (("status" = 'draft' AND "published_at" IS NULL) OR ("status" = 'published' AND "published_at" IS NOT NULL)),
      CONSTRAINT "learning_grades_submission_fk"
        FOREIGN KEY ("tenant_id", "submission_id", "course_run_id", "assignment_id", "student_user_id")
        REFERENCES "learning_submissions"("tenant_id", "id", "course_run_id", "assignment_id", "student_user_id") ON DELETE cascade,
      CONSTRAINT "learning_grades_grader_membership_fk"
        FOREIGN KEY ("tenant_id", "course_run_id", "grader_user_id")
        REFERENCES "learning_memberships"("tenant_id", "course_run_id", "user_id") ON DELETE restrict,
      CONSTRAINT "learning_grades_submission_unique"
        UNIQUE ("tenant_id", "submission_id")
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "learning_memberships_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "learning_conversations_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "learning_conversation_participants_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "learning_messages_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "learning_assignments_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "learning_submissions_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "learning_grades_id" integer;

    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_learning_memberships_fk"
      FOREIGN KEY ("learning_memberships_id") REFERENCES "learning_memberships"("id") ON DELETE cascade;
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_learning_conversations_fk"
      FOREIGN KEY ("learning_conversations_id") REFERENCES "learning_conversations"("id") ON DELETE cascade;
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "pld_rels_learning_conversation_participants_fk"
      FOREIGN KEY ("learning_conversation_participants_id") REFERENCES "learning_conversation_participants"("id") ON DELETE cascade;
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_learning_messages_fk"
      FOREIGN KEY ("learning_messages_id") REFERENCES "learning_messages"("id") ON DELETE cascade;
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_learning_assignments_fk"
      FOREIGN KEY ("learning_assignments_id") REFERENCES "learning_assignments"("id") ON DELETE cascade;
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_learning_submissions_fk"
      FOREIGN KEY ("learning_submissions_id") REFERENCES "learning_submissions"("id") ON DELETE cascade;
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_learning_grades_fk"
      FOREIGN KEY ("learning_grades_id") REFERENCES "learning_grades"("id") ON DELETE cascade;

    CREATE INDEX "payload_locked_documents_rels_learning_memberships_idx"
      ON "payload_locked_documents_rels" ("learning_memberships_id");
    CREATE INDEX "payload_locked_documents_rels_learning_conversations_idx"
      ON "payload_locked_documents_rels" ("learning_conversations_id");
    CREATE INDEX "pld_rels_learning_conversation_participants_idx"
      ON "payload_locked_documents_rels" ("learning_conversation_participants_id");
    CREATE INDEX "payload_locked_documents_rels_learning_messages_idx"
      ON "payload_locked_documents_rels" ("learning_messages_id");
    CREATE INDEX "payload_locked_documents_rels_learning_assignments_idx"
      ON "payload_locked_documents_rels" ("learning_assignments_id");
    CREATE INDEX "payload_locked_documents_rels_learning_submissions_idx"
      ON "payload_locked_documents_rels" ("learning_submissions_id");
    CREATE INDEX "payload_locked_documents_rels_learning_grades_idx"
      ON "payload_locked_documents_rels" ("learning_grades_id");

    CREATE INDEX "learning_memberships_user_course_idx"
      ON "learning_memberships" ("tenant_id", "user_id", "course_run_id");
    CREATE INDEX "learning_memberships_course_status_idx"
      ON "learning_memberships" ("tenant_id", "course_run_id", "status");
    CREATE INDEX "learning_conversations_course_status_idx"
      ON "learning_conversations" ("tenant_id", "course_run_id", "status", "created_at" DESC);
    CREATE INDEX "learning_participants_user_idx"
      ON "learning_conversation_participants" ("tenant_id", "user_id", "status");
    CREATE INDEX "learning_messages_conversation_created_idx"
      ON "learning_messages" ("tenant_id", "conversation_id", "created_at", "id");
    CREATE INDEX "learning_assignments_course_status_due_idx"
      ON "learning_assignments" ("tenant_id", "course_run_id", "status", "due_at");
    CREATE INDEX "learning_submissions_assignment_status_idx"
      ON "learning_submissions" ("tenant_id", "assignment_id", "status", "submitted_at");
    CREATE INDEX "learning_grades_student_status_idx"
      ON "learning_grades" ("tenant_id", "student_user_id", "status", "published_at" DESC);

    CREATE FUNCTION "akademate_next_current_tenant_id"() RETURNS integer
      LANGUAGE sql STABLE
      AS $$
        SELECT CASE
          WHEN pg_input_is_valid(current_setting('app.tenant_id', true), 'integer')
          THEN CASE
            WHEN CAST(current_setting('app.tenant_id', true) AS integer) > 0
            THEN CAST(current_setting('app.tenant_id', true) AS integer)
            ELSE NULL
          END
          ELSE NULL
        END
      $$;

    CREATE FUNCTION "akademate_next_current_user_id"() RETURNS integer
      LANGUAGE sql STABLE
      AS $$
        SELECT CASE
          WHEN pg_input_is_valid(current_setting('app.user_id', true), 'integer')
          THEN CASE
            WHEN CAST(current_setting('app.user_id', true) AS integer) > 0
            THEN CAST(current_setting('app.user_id', true) AS integer)
            ELSE NULL
          END
          ELSE NULL
        END
      $$;

    CREATE FUNCTION "akademate_next_can_manage_memberships"() RETURNS boolean
      LANGUAGE sql STABLE
      AS $$
        SELECT COALESCE(current_setting('app.role', true), '') IN ('admin', 'gestor')
      $$;

    CREATE FUNCTION "akademate_next_has_learning_role"(requested_course_run_id integer, requested_role varchar)
      RETURNS boolean
      LANGUAGE sql STABLE SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $$
        SELECT EXISTS (
          SELECT 1
          FROM learning_memberships membership
          WHERE membership.tenant_id = akademate_next_current_tenant_id()
            AND membership.user_id = akademate_next_current_user_id()
            AND membership.course_run_id = requested_course_run_id
            AND membership.role = requested_role
            AND membership.status = 'active'
            AND (membership.valid_from IS NULL OR membership.valid_from <= now())
            AND (membership.valid_until IS NULL OR membership.valid_until >= now())
        )
      $$;

    CREATE FUNCTION "akademate_next_is_conversation_participant"(
      requested_conversation_id integer,
      allowed_statuses varchar[]
    ) RETURNS boolean
      LANGUAGE sql STABLE SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $$
        SELECT EXISTS (
          SELECT 1
          FROM learning_conversation_participants participant
          JOIN learning_memberships membership ON
            membership.tenant_id = participant.tenant_id
            AND membership.id = participant.membership_id
            AND membership.course_run_id = participant.course_run_id
            AND membership.user_id = participant.user_id
          WHERE participant.tenant_id = akademate_next_current_tenant_id()
            AND participant.user_id = akademate_next_current_user_id()
            AND participant.conversation_id = requested_conversation_id
            AND participant.status = ANY(allowed_statuses)
            AND membership.status = 'active'
            AND (membership.valid_from IS NULL OR membership.valid_from <= now())
            AND (membership.valid_until IS NULL OR membership.valid_until >= now())
        )
      $$;

    CREATE FUNCTION "akademate_next_is_conversation_moderator"(requested_conversation_id integer)
      RETURNS boolean
      LANGUAGE sql STABLE SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $$
        SELECT EXISTS (
          SELECT 1
          FROM learning_conversation_participants participant
          JOIN learning_memberships membership ON
            membership.tenant_id = participant.tenant_id
            AND membership.id = participant.membership_id
            AND membership.course_run_id = participant.course_run_id
            AND membership.user_id = participant.user_id
          WHERE participant.tenant_id = akademate_next_current_tenant_id()
            AND participant.user_id = akademate_next_current_user_id()
            AND participant.conversation_id = requested_conversation_id
            AND participant.status = 'active'
            AND participant.role = 'moderator'
            AND membership.status = 'active'
            AND (membership.valid_from IS NULL OR membership.valid_from <= now())
            AND (membership.valid_until IS NULL OR membership.valid_until >= now())
        )
      $$;

    REVOKE ALL ON FUNCTION "akademate_next_has_learning_role"(integer, varchar) FROM PUBLIC;
    REVOKE ALL ON FUNCTION "akademate_next_is_conversation_participant"(integer, varchar[]) FROM PUBLIC;
    REVOKE ALL ON FUNCTION "akademate_next_is_conversation_moderator"(integer) FROM PUBLIC;
    REVOKE ALL ON FUNCTION "akademate_next_can_manage_memberships"() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION "akademate_next_has_learning_role"(integer, varchar) TO ${applicationRoleIdentifier};
    GRANT EXECUTE ON FUNCTION "akademate_next_is_conversation_participant"(integer, varchar[]) TO ${applicationRoleIdentifier};
    GRANT EXECUTE ON FUNCTION "akademate_next_is_conversation_moderator"(integer) TO ${applicationRoleIdentifier};
    GRANT EXECUTE ON FUNCTION "akademate_next_can_manage_memberships"() TO ${applicationRoleIdentifier};

    ALTER TABLE "learning_memberships" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "learning_memberships" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "learning_conversations" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "learning_conversations" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "learning_conversation_participants" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "learning_conversation_participants" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "learning_messages" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "learning_messages" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "learning_assignments" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "learning_assignments" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "learning_submissions" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "learning_submissions" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "learning_grades" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "learning_grades" FORCE ROW LEVEL SECURITY;

    CREATE POLICY "learning_memberships_tenant_isolation" ON "learning_memberships"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = akademate_next_current_tenant_id())
      WITH CHECK ("tenant_id" = akademate_next_current_tenant_id());
    CREATE POLICY "learning_memberships_read" ON "learning_memberships"
      FOR SELECT USING (
        "user_id" = akademate_next_current_user_id()
        OR akademate_next_has_learning_role("course_run_id", 'instructor')
      );
    CREATE POLICY "learning_memberships_manage" ON "learning_memberships"
      FOR ALL
      USING (akademate_next_can_manage_memberships())
      WITH CHECK (akademate_next_can_manage_memberships());

    CREATE POLICY "learning_conversations_tenant_isolation" ON "learning_conversations"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = akademate_next_current_tenant_id())
      WITH CHECK ("tenant_id" = akademate_next_current_tenant_id());
    CREATE POLICY "learning_conversations_read" ON "learning_conversations"
      FOR SELECT USING (
        akademate_next_is_conversation_participant("id", ARRAY['active', 'muted']::varchar[])
      );
    CREATE POLICY "learning_conversations_create" ON "learning_conversations"
      FOR INSERT WITH CHECK (
        "created_by_user_id" = akademate_next_current_user_id()
        AND akademate_next_has_learning_role("course_run_id", 'instructor')
      );
    CREATE POLICY "learning_conversations_update" ON "learning_conversations"
      FOR UPDATE USING (
        akademate_next_is_conversation_moderator("id")
      );

    CREATE POLICY "learning_conversation_participants_tenant_isolation" ON "learning_conversation_participants"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = akademate_next_current_tenant_id())
      WITH CHECK ("tenant_id" = akademate_next_current_tenant_id());
    CREATE POLICY "learning_conversation_participants_read" ON "learning_conversation_participants"
      FOR SELECT USING (
        "user_id" = akademate_next_current_user_id()
        OR akademate_next_is_conversation_participant("conversation_id", ARRAY['active']::varchar[])
      );
    CREATE POLICY "learning_conversation_participants_create" ON "learning_conversation_participants"
      FOR INSERT WITH CHECK (
        akademate_next_has_learning_role("course_run_id", 'instructor')
        AND EXISTS (
          SELECT 1 FROM learning_conversations conversation
          WHERE conversation.tenant_id = "learning_conversation_participants"."tenant_id"
            AND conversation.id = "learning_conversation_participants"."conversation_id"
            AND (
              conversation.created_by_user_id = akademate_next_current_user_id()
              OR akademate_next_is_conversation_moderator(conversation.id)
            )
        )
      );
    CREATE POLICY "learning_conversation_participants_update" ON "learning_conversation_participants"
      FOR UPDATE USING (
        akademate_next_is_conversation_moderator("conversation_id")
      ) WITH CHECK (
        akademate_next_has_learning_role("course_run_id", 'instructor')
      );
    CREATE POLICY "learning_conversation_participants_delete" ON "learning_conversation_participants"
      FOR DELETE USING (
        akademate_next_is_conversation_moderator("conversation_id")
      );

    CREATE POLICY "learning_messages_tenant_isolation" ON "learning_messages"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = akademate_next_current_tenant_id())
      WITH CHECK ("tenant_id" = akademate_next_current_tenant_id());
    CREATE POLICY "learning_messages_read" ON "learning_messages"
      FOR SELECT USING (
        akademate_next_is_conversation_participant("conversation_id", ARRAY['active', 'muted']::varchar[])
      );
    CREATE POLICY "learning_messages_create" ON "learning_messages"
      FOR INSERT WITH CHECK (
        "sender_user_id" = akademate_next_current_user_id()
        AND akademate_next_is_conversation_participant("conversation_id", ARRAY['active']::varchar[])
        AND EXISTS (
          SELECT 1 FROM learning_conversations conversation
          JOIN learning_conversation_participants participant ON
            participant.tenant_id = conversation.tenant_id
            AND participant.conversation_id = conversation.id
            AND participant.user_id = akademate_next_current_user_id()
          WHERE conversation.tenant_id = "learning_messages"."tenant_id"
            AND conversation.id = "learning_messages"."conversation_id"
            AND conversation.status = 'active'
            AND (conversation.mode <> 'announcement' OR participant.role = 'moderator')
        )
      );

    CREATE POLICY "learning_assignments_tenant_isolation" ON "learning_assignments"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = akademate_next_current_tenant_id())
      WITH CHECK ("tenant_id" = akademate_next_current_tenant_id());
    CREATE POLICY "learning_assignments_read" ON "learning_assignments"
      FOR SELECT USING (
        akademate_next_has_learning_role("course_run_id", 'student')
        OR akademate_next_has_learning_role("course_run_id", 'instructor')
      );
    CREATE POLICY "learning_assignments_manage" ON "learning_assignments"
      FOR ALL USING (
        akademate_next_has_learning_role("course_run_id", 'instructor')
      ) WITH CHECK (
        "created_by_user_id" = akademate_next_current_user_id()
        AND akademate_next_has_learning_role("course_run_id", 'instructor')
      );

    CREATE POLICY "learning_submissions_tenant_isolation" ON "learning_submissions"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = akademate_next_current_tenant_id())
      WITH CHECK ("tenant_id" = akademate_next_current_tenant_id());
    CREATE POLICY "learning_submissions_read" ON "learning_submissions"
      FOR SELECT USING (
        "student_user_id" = akademate_next_current_user_id()
        OR akademate_next_has_learning_role("course_run_id", 'instructor')
      );
    CREATE POLICY "learning_submissions_create" ON "learning_submissions"
      FOR INSERT WITH CHECK (
        "student_user_id" = akademate_next_current_user_id()
        AND akademate_next_has_learning_role("course_run_id", 'student')
      );
    CREATE POLICY "learning_submissions_review" ON "learning_submissions"
      FOR UPDATE USING (akademate_next_has_learning_role("course_run_id", 'instructor'))
      WITH CHECK (akademate_next_has_learning_role("course_run_id", 'instructor'));

    CREATE POLICY "learning_grades_tenant_isolation" ON "learning_grades"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = akademate_next_current_tenant_id())
      WITH CHECK ("tenant_id" = akademate_next_current_tenant_id());
    CREATE POLICY "learning_grades_read" ON "learning_grades"
      FOR SELECT USING (
        akademate_next_has_learning_role("course_run_id", 'instructor')
        OR (
          "student_user_id" = akademate_next_current_user_id()
          AND "status" = 'published'
          AND akademate_next_has_learning_role("course_run_id", 'student')
        )
      );
    CREATE POLICY "learning_grades_manage" ON "learning_grades"
      FOR ALL USING (akademate_next_has_learning_role("course_run_id", 'instructor'))
      WITH CHECK (
        "grader_user_id" = akademate_next_current_user_id()
        AND akademate_next_has_learning_role("course_run_id", 'instructor')
      );

    REVOKE ALL ON "learning_memberships" FROM PUBLIC;
    REVOKE ALL ON "learning_conversations" FROM PUBLIC;
    REVOKE ALL ON "learning_conversation_participants" FROM PUBLIC;
    REVOKE ALL ON "learning_messages" FROM PUBLIC;
    REVOKE ALL ON "learning_assignments" FROM PUBLIC;
    REVOKE ALL ON "learning_submissions" FROM PUBLIC;
    REVOKE ALL ON "learning_grades" FROM PUBLIC;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "learning_grades_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "learning_submissions_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "learning_assignments_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "learning_messages_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "learning_conversation_participants_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "learning_conversations_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "learning_memberships_id";

    DROP TABLE "learning_grades";
    DROP TABLE "learning_submissions";
    DROP TABLE "learning_assignments";
    DROP TABLE "learning_messages";
    DROP TABLE "learning_conversation_participants";
    DROP TABLE "learning_conversations";
    DROP TABLE "learning_memberships";

    DROP FUNCTION "akademate_next_is_conversation_moderator"(integer);
    DROP FUNCTION "akademate_next_is_conversation_participant"(integer, varchar[]);
    DROP FUNCTION "akademate_next_has_learning_role"(integer, varchar);
    DROP FUNCTION "akademate_next_can_manage_memberships"();
    DROP FUNCTION "akademate_next_current_user_id"();
    DROP FUNCTION "akademate_next_current_tenant_id"();

    ALTER TABLE "staff" DROP CONSTRAINT "staff_tenant_user_account_fk";
    ALTER TABLE "staff" DROP CONSTRAINT "staff_tenant_id_id_user_unique";
    ALTER TABLE "staff" DROP CONSTRAINT "staff_tenant_fk";
    DROP INDEX "staff_user_account_unique";
    DROP INDEX "staff_tenant_idx";
    ALTER TABLE "staff" DROP COLUMN "user_account_id";
    ALTER TABLE "staff" DROP COLUMN "tenant_id";

    ALTER TABLE "students" DROP CONSTRAINT "students_tenant_user_account_fk";
    ALTER TABLE "students" DROP CONSTRAINT "students_tenant_id_id_user_unique";
    DROP INDEX "students_user_account_unique";
    ALTER TABLE "students" DROP COLUMN "user_account_id";

    ALTER TABLE "course_runs" DROP CONSTRAINT "course_runs_tenant_id_id_unique";
    ALTER TABLE "users" DROP CONSTRAINT "users_tenant_id_id_unique";
  `)
}
