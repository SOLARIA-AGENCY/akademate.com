import type { Access, FieldAccess } from 'payload'

const WRITE_ROLES = ['superadmin', 'admin', 'gestor'] as const
const READ_ROLES = ['superadmin', 'admin', 'gestor', 'marketing', 'asesor', 'lectura'] as const

function roleOf(user: { role?: string } | null | undefined): string | null {
  return typeof user?.role === 'string' ? user.role : null
}

export const canReadOrganization: Access = ({ req: { user } }) => {
  const role = roleOf(user)
  return Boolean(role && (READ_ROLES as readonly string[]).includes(role))
}

export const canWriteOrganization: Access = ({ req: { user } }) => {
  const role = roleOf(user)
  return Boolean(role && (WRITE_ROLES as readonly string[]).includes(role))
}

export const organizationFieldAccess: FieldAccess = ({ req: { user } }) => {
  const role = roleOf(user)
  return Boolean(role && (WRITE_ROLES as readonly string[]).includes(role))
}

export const organizationAccess = {
  read: canReadOrganization,
  create: canWriteOrganization,
  update: canWriteOrganization,
  delete: canWriteOrganization,
}
