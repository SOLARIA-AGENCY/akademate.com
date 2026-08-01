import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

import {
  assertAkademateNextRuntime,
  resolveNextDatabaseAppRole,
} from '../src/runtime/select-runtime-migrations'

/**
 * Message delivery needs two guarantees that cannot be expressed by the
 * original learning schema alone:
 *
 * 1. a client id is scoped to the sender, so two participants may safely use
 *    the same local id without colliding with each other;
 * 2. the send transaction locks the membership, conversation and participant
 *    rows before it makes its final decision, closing the archive/send race.
 *
 * This is a follow-up migration on purpose. The already-applied learning
 * migration is immutable; production must apply this migration as a new
 * version instead of silently rewriting history.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    ALTER TABLE "learning_messages"
      DROP CONSTRAINT "learning_messages_client_unique";
    ALTER TABLE "learning_messages"
      ADD CONSTRAINT "learning_messages_sender_client_unique"
      UNIQUE ("tenant_id", "conversation_id", "sender_user_id", "client_message_id");

    CREATE FUNCTION "akademate_next_lock_learning_membership"(requested_course_run_id integer)
      RETURNS void
      LANGUAGE plpgsql VOLATILE SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $$
      BEGIN
        PERFORM 1
        FROM learning_memberships
        WHERE tenant_id = akademate_next_current_tenant_id()
          AND user_id = akademate_next_current_user_id()
          AND course_run_id = requested_course_run_id
        FOR UPDATE;
      END
      $$;

    CREATE FUNCTION "akademate_next_lock_learning_conversation"(requested_conversation_id integer)
      RETURNS void
      LANGUAGE plpgsql VOLATILE SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $$
      BEGIN
        PERFORM 1
        FROM learning_conversations
        WHERE tenant_id = akademate_next_current_tenant_id()
          AND id = requested_conversation_id
        FOR UPDATE;
      END
      $$;

    CREATE FUNCTION "akademate_next_lock_learning_participant"(requested_conversation_id integer)
      RETURNS void
      LANGUAGE plpgsql VOLATILE SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $$
      BEGIN
        PERFORM 1
        FROM learning_conversation_participants
        WHERE tenant_id = akademate_next_current_tenant_id()
          AND conversation_id = requested_conversation_id
          AND user_id = akademate_next_current_user_id()
        FOR UPDATE;
      END
      $$;

    REVOKE ALL ON FUNCTION "akademate_next_lock_learning_membership"(integer) FROM PUBLIC;
    REVOKE ALL ON FUNCTION "akademate_next_lock_learning_conversation"(integer) FROM PUBLIC;
    REVOKE ALL ON FUNCTION "akademate_next_lock_learning_participant"(integer) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION "akademate_next_lock_learning_membership"(integer) TO ${applicationRoleIdentifier};
    GRANT EXECUTE ON FUNCTION "akademate_next_lock_learning_conversation"(integer) TO ${applicationRoleIdentifier};
    GRANT EXECUTE ON FUNCTION "akademate_next_lock_learning_participant"(integer) TO ${applicationRoleIdentifier};
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM "learning_messages"
        GROUP BY "tenant_id", "conversation_id", "client_message_id"
        HAVING count(*) > 1
      ) THEN
        RAISE EXCEPTION
          'Cannot roll back message sender idempotency: client ids now overlap across senders';
      END IF;
    END
    $$;

    REVOKE ALL ON FUNCTION "akademate_next_lock_learning_membership"(integer) FROM PUBLIC;
    REVOKE ALL ON FUNCTION "akademate_next_lock_learning_conversation"(integer) FROM PUBLIC;
    REVOKE ALL ON FUNCTION "akademate_next_lock_learning_participant"(integer) FROM PUBLIC;
    DROP FUNCTION "akademate_next_lock_learning_participant"(integer);
    DROP FUNCTION "akademate_next_lock_learning_conversation"(integer);
    DROP FUNCTION "akademate_next_lock_learning_membership"(integer);

    ALTER TABLE "learning_messages"
      DROP CONSTRAINT "learning_messages_sender_client_unique";
    ALTER TABLE "learning_messages"
      ADD CONSTRAINT "learning_messages_client_unique"
      UNIQUE ("tenant_id", "conversation_id", "client_message_id");
  `)
}
