import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

import {
  assertAkademateNextRuntime,
  resolveNextDatabaseAppRole,
} from '../src/runtime/select-runtime-migrations'

/**
 * The dashboard reads profile counts exclusively through its bounded
 * SECURITY DEFINER projection. The bootstrap role historically received CRUD
 * on every pre-existing table; remove that ambient access for the two profile
 * tables so a compromised application query cannot bypass the projection.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    REVOKE ALL ON "students" FROM PUBLIC;
    REVOKE ALL ON "staff" FROM PUBLIC;
    REVOKE ALL ON "students" FROM ${applicationRoleIdentifier};
    REVOKE ALL ON "staff" FROM ${applicationRoleIdentifier};
    REVOKE ALL ON SEQUENCE "students_id_seq" FROM ${applicationRoleIdentifier};
    REVOKE ALL ON SEQUENCE "staff_id_seq" FROM ${applicationRoleIdentifier};
  `)
}

/**
 * Restores the exact broad bootstrap privileges that existed before this
 * hardening migration. Rolling this back intentionally weakens least privilege
 * and must therefore remain an explicit operator action.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    GRANT SELECT, INSERT, UPDATE, DELETE ON "students" TO ${applicationRoleIdentifier};
    GRANT SELECT, INSERT, UPDATE, DELETE ON "staff" TO ${applicationRoleIdentifier};
    GRANT USAGE, SELECT ON SEQUENCE "students_id_seq" TO ${applicationRoleIdentifier};
    GRANT USAGE, SELECT ON SEQUENCE "staff_id_seq" TO ${applicationRoleIdentifier};
  `)
}
