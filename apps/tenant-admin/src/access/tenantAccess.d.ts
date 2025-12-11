import type { Access, FieldAccess } from 'payload';
/**
 * Multi-Tenant Access Control Utilities
 *
 * These functions provide tenant-aware access control for all collections.
 * They ensure that users can only access data within their assigned tenant,
 * while SuperAdmin has access to all tenants.
 *
 * Usage:
 * ```ts
 * import { tenantFilteredAccess, tenantFieldAccess } from '@/access/tenantAccess'
 *
 * export const MyCollection: CollectionConfig = {
 *   access: {
 *     read: tenantFilteredAccess.read,
 *     create: tenantFilteredAccess.create,
 *     update: tenantFilteredAccess.update,
 *     delete: tenantFilteredAccess.delete,
 *   }
 * }
 * ```
 */
/**
 * Check if user is SuperAdmin
 */
export declare const isSuperAdmin: (user: any) => boolean;
/**
 * Check if user is Admin or higher
 */
export declare const isAdminOrHigher: (user: any) => boolean;
/**
 * Get user's tenant ID
 * Returns null for SuperAdmin (they don't have a tenant)
 */
export declare const getUserTenantId: (user: any) => string | number | null;
/**
 * Tenant-filtered read access
 * - SuperAdmin: Can read all documents
 * - Others: Can only read documents from their tenant
 */
export declare const tenantReadAccess: Access;
/**
 * Tenant-filtered create access
 * - SuperAdmin: Can create in any tenant (must specify tenant)
 * - Admin/Gestor: Can create within their tenant
 * - Others: Cannot create
 */
export declare const tenantCreateAccess: Access;
/**
 * Tenant-filtered update access
 * - SuperAdmin: Can update any document
 * - Admin/Gestor: Can update documents within their tenant
 * - Others: Cannot update
 */
export declare const tenantUpdateAccess: Access;
/**
 * Tenant-filtered delete access
 * - SuperAdmin: Can delete any document
 * - Admin: Can delete documents within their tenant
 * - Others: Cannot delete
 */
export declare const tenantDeleteAccess: Access;
/**
 * Bundled tenant access controls
 */
export declare const tenantFilteredAccess: {
    read: Access;
    create: Access;
    update: Access;
    delete: Access;
};
/**
 * Field access for tenant field
 * - SuperAdmin: Can set/change tenant on any document
 * - Others: Tenant is auto-assigned, cannot be changed
 */
export declare const tenantFieldAccess: FieldAccess;
/**
 * Hook to auto-assign tenant on document creation
 * Used in beforeChange hooks
 */
export declare const autoAssignTenant: ({ req, data }: {
    req: any;
    data: any;
}) => any;
/**
 * Reusable tenant field definition for collections
 */
export declare const tenantField: {
    name: string;
    type: "relationship";
    relationTo: string;
    required: boolean;
    index: boolean;
    admin: {
        position: "sidebar";
        description: string;
        condition: (data: any, siblingData: any, { user }: {
            user: any;
        }) => boolean;
    };
    access: {
        read: () => boolean;
        update: FieldAccess;
    };
    hooks: {
        beforeChange: (({ req, value, data }: {
            req: any;
            value: any;
            data: any;
        }) => any)[];
    };
};
//# sourceMappingURL=tenantAccess.d.ts.map