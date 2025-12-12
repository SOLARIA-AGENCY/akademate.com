/**
 * AKADEMATE.COM - Role-Based Access Control (RBAC)
 *
 * Blueprint Reference: Section 6.2 - Roles
 *
 * Role hierarchy per Blueprint:
 * - superadmin: Platform-wide admin (SOLARIA staff)
 * - admin: Tenant admin (full tenant access)
 * - gestor: Operations manager (courses, enrollments)
 * - instructor: Course instructor (own courses)
 * - student: Enrolled student (own content)
 *
 * Permission format: resource:action
 * Example: courses:create, enrollments:read
 */

/**
 * Available roles in the system
 */
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  GESTOR: 'gestor',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

/**
 * Resource types in the system
 */
export const RESOURCES = {
  TENANTS: 'tenants',
  USERS: 'users',
  COURSES: 'courses',
  COURSE_RUNS: 'course_runs',
  CYCLES: 'cycles',
  CENTERS: 'centers',
  INSTRUCTORS: 'instructors',
  ENROLLMENTS: 'enrollments',
  LEADS: 'leads',
  CAMPAIGNS: 'campaigns',
  MODULES: 'modules',
  LESSONS: 'lessons',
  ASSIGNMENTS: 'assignments',
  SUBMISSIONS: 'submissions',
  GRADES: 'grades',
  API_KEYS: 'api_keys',
  AUDIT_LOGS: 'audit_logs',
  SUBSCRIPTIONS: 'subscriptions',
  SETTINGS: 'settings',
} as const

export type Resource = (typeof RESOURCES)[keyof typeof RESOURCES]

/**
 * Available actions
 */
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  EXPORT: 'export',
  IMPERSONATE: 'impersonate',
  PUBLISH: 'publish',
  ENROLL: 'enroll',
  GRADE: 'grade',
} as const

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS]

/**
 * Permission string format
 */
export type Permission = `${Resource}:${Action}` | '*:*'

/**
 * Role permission matrix
 * Each role has a set of allowed permissions
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Platform superadmin - full access
  superadmin: ['*:*'],

  // Tenant admin - full tenant access
  admin: [
    'users:create', 'users:read', 'users:update', 'users:delete', 'users:list', 'users:impersonate',
    'courses:create', 'courses:read', 'courses:update', 'courses:delete', 'courses:list', 'courses:publish',
    'course_runs:create', 'course_runs:read', 'course_runs:update', 'course_runs:delete', 'course_runs:list', 'course_runs:publish',
    'cycles:create', 'cycles:read', 'cycles:update', 'cycles:delete', 'cycles:list',
    'centers:create', 'centers:read', 'centers:update', 'centers:delete', 'centers:list',
    'instructors:create', 'instructors:read', 'instructors:update', 'instructors:delete', 'instructors:list',
    'enrollments:create', 'enrollments:read', 'enrollments:update', 'enrollments:delete', 'enrollments:list', 'enrollments:export',
    'leads:create', 'leads:read', 'leads:update', 'leads:delete', 'leads:list', 'leads:export',
    'campaigns:create', 'campaigns:read', 'campaigns:update', 'campaigns:delete', 'campaigns:list',
    'modules:create', 'modules:read', 'modules:update', 'modules:delete', 'modules:list',
    'lessons:create', 'lessons:read', 'lessons:update', 'lessons:delete', 'lessons:list',
    'assignments:create', 'assignments:read', 'assignments:update', 'assignments:delete', 'assignments:list',
    'submissions:read', 'submissions:list', 'submissions:export',
    'grades:create', 'grades:read', 'grades:update', 'grades:list', 'grades:export',
    'api_keys:create', 'api_keys:read', 'api_keys:update', 'api_keys:delete', 'api_keys:list',
    'audit_logs:read', 'audit_logs:list', 'audit_logs:export',
    'subscriptions:read', 'subscriptions:update',
    'settings:read', 'settings:update',
  ],

  // Operations manager
  gestor: [
    'users:read', 'users:list',
    'courses:read', 'courses:update', 'courses:list',
    'course_runs:create', 'course_runs:read', 'course_runs:update', 'course_runs:list', 'course_runs:publish',
    'cycles:read', 'cycles:list',
    'centers:read', 'centers:list',
    'instructors:read', 'instructors:list',
    'enrollments:create', 'enrollments:read', 'enrollments:update', 'enrollments:list', 'enrollments:export',
    'leads:read', 'leads:update', 'leads:list',
    'campaigns:read', 'campaigns:list',
    'modules:read', 'modules:list',
    'lessons:read', 'lessons:list',
    'assignments:read', 'assignments:list',
    'submissions:read', 'submissions:list',
    'grades:read', 'grades:update', 'grades:list',
  ],

  // Course instructor
  instructor: [
    'courses:read', 'courses:list',
    'course_runs:read', 'course_runs:list',
    'modules:create', 'modules:read', 'modules:update', 'modules:list',
    'lessons:create', 'lessons:read', 'lessons:update', 'lessons:list',
    'assignments:create', 'assignments:read', 'assignments:update', 'assignments:list',
    'submissions:read', 'submissions:list',
    'grades:create', 'grades:read', 'grades:update', 'grades:list',
    'enrollments:read', 'enrollments:list',
  ],

  // Student
  student: [
    'courses:read', 'courses:list',
    'course_runs:read', 'course_runs:list',
    'modules:read', 'modules:list',
    'lessons:read', 'lessons:list',
    'assignments:read', 'assignments:list',
    'submissions:create', 'submissions:read', 'submissions:list',
    'grades:read',
    'enrollments:read',
  ],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  roles: Role[],
  resource: Resource,
  action: Action
): boolean {
  const permission: Permission = `${resource}:${action}`

  for (const role of roles) {
    const rolePermissions = ROLE_PERMISSIONS[role]
    if (!rolePermissions) continue

    // Check for wildcard permission (superadmin)
    if (rolePermissions.includes('*:*')) {
      return true
    }

    // Check for specific permission
    if (rolePermissions.includes(permission)) {
      return true
    }
  }

  return false
}

/**
 * Check if user can perform action on resource
 * Throws if not authorized
 */
export function assertPermission(
  roles: Role[],
  resource: Resource,
  action: Action
): void {
  if (!hasPermission(roles, resource, action)) {
    throw new AuthorizationError(
      `Permission denied: ${resource}:${action}`,
      resource,
      action,
      roles
    )
  }
}

/**
 * Authorization error with context
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly resource: Resource,
    public readonly action: Action,
    public readonly roles: Role[]
  ) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Get all permissions for a set of roles
 */
export function getPermissions(roles: Role[]): Permission[] {
  const permissions = new Set<Permission>()

  for (const role of roles) {
    const rolePermissions = ROLE_PERMISSIONS[role]
    if (rolePermissions) {
      for (const perm of rolePermissions) {
        permissions.add(perm)
      }
    }
  }

  return Array.from(permissions)
}

/**
 * Check if role is at least as privileged as another role
 */
export function isRoleAtLeast(role: Role, minRole: Role): boolean {
  const hierarchy: Role[] = ['student', 'instructor', 'gestor', 'admin', 'superadmin']
  const roleIndex = hierarchy.indexOf(role)
  const minIndex = hierarchy.indexOf(minRole)
  return roleIndex >= minIndex
}

/**
 * Check if user has any of the required roles
 */
export function hasRole(userRoles: Role[], requiredRoles: Role[]): boolean {
  return userRoles.some(role => requiredRoles.includes(role))
}

/**
 * Check if user has all required roles
 */
export function hasAllRoles(userRoles: Role[], requiredRoles: Role[]): boolean {
  return requiredRoles.every(role => userRoles.includes(role))
}

/**
 * Validate role string
 */
export function isValidRole(role: string): role is Role {
  return Object.values(ROLES).includes(role as Role)
}

/**
 * Parse roles from JSONB array (as stored in memberships)
 */
export function parseRoles(roles: unknown): Role[] {
  if (!Array.isArray(roles)) {
    return []
  }

  return roles.filter(isValidRole)
}

/**
 * Get the highest privileged role from a list
 */
export function getHighestRole(roles: Role[]): Role | null {
  const hierarchy: Role[] = ['student', 'instructor', 'gestor', 'admin', 'superadmin']

  let highest: Role | null = null
  let highestIndex = -1

  for (const role of roles) {
    const index = hierarchy.indexOf(role)
    if (index > highestIndex) {
      highest = role
      highestIndex = index
    }
  }

  return highest
}

/**
 * Check if user can impersonate (admin and superadmin only)
 */
export function canImpersonate(roles: Role[]): boolean {
  return hasPermission(roles, RESOURCES.USERS, ACTIONS.IMPERSONATE)
}

/**
 * Check if user can impersonate a specific target user
 * Rules:
 * - superadmin can impersonate anyone
 * - admin can impersonate non-admin users in same tenant
 * - cannot impersonate yourself
 */
export function canImpersonateUser(
  actorRoles: Role[],
  targetRoles: Role[],
  actorId: string,
  targetId: string
): boolean {
  // Cannot impersonate yourself
  if (actorId === targetId) {
    return false
  }

  // Must have impersonate permission
  if (!canImpersonate(actorRoles)) {
    return false
  }

  // Superadmin can impersonate anyone
  if (actorRoles.includes(ROLES.SUPERADMIN)) {
    return true
  }

  // Admin cannot impersonate other admins or superadmins
  if (
    targetRoles.includes(ROLES.ADMIN) ||
    targetRoles.includes(ROLES.SUPERADMIN)
  ) {
    return false
  }

  return true
}
