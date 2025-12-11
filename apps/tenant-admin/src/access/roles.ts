/**
 * Role Definitions - Multi-Tenant Hierarchy
 *
 * Level 6 - SuperAdmin: Access to ALL tenants, system configuration
 * Level 5 - Admin: Full access WITHIN assigned tenant
 * Level 4 - Gestor: Manage content & users within tenant
 * Level 3 - Marketing: Create marketing content within tenant
 * Level 2 - Asesor: Read client data within tenant
 * Level 1 - Lectura: Read-only access within tenant
 */
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  GESTOR: 'gestor',
  MARKETING: 'marketing',
  ASESOR: 'asesor',
  LECTURA: 'lectura',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Role hierarchy (for permissions inheritance)
export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.SUPERADMIN]: 6,
  [ROLES.ADMIN]: 5,
  [ROLES.GESTOR]: 4,
  [ROLES.MARKETING]: 3,
  [ROLES.ASESOR]: 2,
  [ROLES.LECTURA]: 1,
};

export function hasMinimumRole(userRole: Role, minimumRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Check if user is SuperAdmin (multi-tenant system admin)
 */
export function isSuperAdmin(user: any): boolean {
  return user?.role === ROLES.SUPERADMIN;
}

/**
 * Check if user is Admin or higher (SuperAdmin or Admin)
 */
export function isAdminOrHigher(user: any): boolean {
  return user?.role === ROLES.SUPERADMIN || user?.role === ROLES.ADMIN;
}
