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
export declare const ROLES: {
    readonly SUPERADMIN: "superadmin";
    readonly ADMIN: "admin";
    readonly GESTOR: "gestor";
    readonly MARKETING: "marketing";
    readonly ASESOR: "asesor";
    readonly LECTURA: "lectura";
};
export type Role = (typeof ROLES)[keyof typeof ROLES];
export declare const ROLE_HIERARCHY: Record<Role, number>;
export declare function hasMinimumRole(userRole: Role, minimumRole: Role): boolean;
/**
 * Check if user is SuperAdmin (multi-tenant system admin)
 */
export declare function isSuperAdmin(user: any): boolean;
/**
 * Check if user is Admin or higher (SuperAdmin or Admin)
 */
export declare function isAdminOrHigher(user: any): boolean;
//# sourceMappingURL=roles.d.ts.map