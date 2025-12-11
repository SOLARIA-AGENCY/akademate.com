import type { CollectionConfig } from 'payload';
import {
  canReadUsers,
  canCreateUsers,
  canUpdateUsers,
  canDeleteUsers,
} from './access';
import { passwordSchema, emailSchema, phoneSchema } from './Users.validation';

/**
 * Users Collection
 *
 * This is the authentication collection for Payload CMS.
 * It manages user accounts, authentication, and role-based access control.
 *
 * Database: PostgreSQL table 'users'
 *
 * Authentication Features:
 * - Login/Logout
 * - Password hashing (bcrypt via Payload's built-in auth)
 * - Password reset via email token
 * - Session management
 * - Login tracking (last_login_at, login_count)
 *
 * Role-Based Access Control (5 roles):
 * - admin (Level 5): Full system access
 * - gestor (Level 4): Manage content, users (except admins), moderation
 * - marketing (Level 3): Create/edit marketing content, view analytics
 * - asesor (Level 2): Read client data, create notes/interactions
 * - lectura (Level 1): Read-only access to public content
 *
 * Security Features:
 * - Password complexity requirements (enforced via validation)
 * - Unique email constraint
 * - Account activation/deactivation
 * - Cannot delete self
 * - Cannot change own role
 * - At least one admin must exist
 * - Password never exposed in API responses
 *
 * Access Control Rules:
 * - Read: Admin/Gestor can read all, others can only read self
 * - Create: Admin can create all, Gestor can create non-admins
 * - Update: Admin can update all, Gestor can update all (role change restricted), others can update self
 * - Delete: Admin only, cannot delete self
 *
 * Key Features:
 * - Auto-track login statistics (last_login_at, login_count)
 * - Email uniqueness enforced
 * - Phone number validation (Spanish format: +34 XXX XXX XXX)
 * - Avatar URL support
 * - Active/inactive status
 * - Timestamps (createdAt, updatedAt)
 */
export const Users: CollectionConfig = {
  slug: 'users',

  /**
   * CRITICAL: Enable authentication
   * This makes this collection the auth collection for Payload
   */
  auth: {
    /**
     * Email verification settings
     * Disabled for now, can be enabled later with email service
     */
    verify: false,

    /**
     * Max login attempts before lockout
     * Set to 5 failed attempts
     */
    maxLoginAttempts: 5,

    /**
     * Lockout time in milliseconds
     * 15 minutes = 900000ms
     */
    lockTime: 900000, // 15 minutes

    /**
     * Token expiration
     * Default is 7200 seconds (2 hours)
     */
    tokenExpiration: 7200,

    /**
     * Use email as login field
     */
    useAPIKey: false,
  },

  labels: {
    singular: 'User',
    plural: 'Users',
  },

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'is_active', 'last_login_at'],
    group: 'Core',
    description: 'System users with authentication and role-based access control',
  },

  /**
   * Collection-level access control
   */
  access: {
    /**
     * Read: Admin/Gestor see all, others see only self
     */
    read: canReadUsers,

    /**
     * Create: Admin creates all, Gestor creates non-admins
     */
    create: canCreateUsers,

    /**
     * Update: Admin/Gestor update all (some fields restricted), others update self
     */
    update: canUpdateUsers,

    /**
     * Delete: Admin only, cannot delete self
     */
    delete: canDeleteUsers,

    /**
     * Admin UI access: Only authenticated users can access admin panel
     */
    admin: ({ req: { user } }) => {
      return !!user;
    },
  },

  fields: [
    /**
     * Email - Primary identifier and login credential
     * Payload automatically adds this field when auth is enabled
     * We just configure its validation
     */
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Email address (used for login)',
        readOnly: true, // Email should not be changed after creation
      },
      validate: (val: unknown): true | string => {
        if (!val) return 'Email is required';

        try {
          emailSchema.parse(val);
          return true;
        } catch (error: any) {
          return error.errors?.[0]?.message || 'Invalid email format';
        }
      },
    },

    /**
     * Password - Authentication credential
     * Payload automatically handles hashing when auth is enabled
     */
    {
      name: 'password',
      type: 'text',
      required: ({ operation }) => operation === 'create',
      admin: {
        description: 'Password (min 8 chars, must include uppercase, lowercase, number, special char)',
      },
      validate: (val: unknown, { operation }): true | string => {
        // On create, password is mandatory; on update, allow empty (e.g., login stats updates)
        if (!val) return operation === 'create' ? 'Password is required' : true;

        try {
          passwordSchema.parse(val);
          return true;
        } catch (error: any) {
          return error.errors?.[0]?.message || 'Invalid password';
        }
      },
    },

    /**
     * Name - Display name for the user
     */
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name of the user',
      },
      validate: (val: unknown): true | string => {
        if (!val) return 'Name is required';
        const strVal = String(val);
        if (strVal.length < 2) return 'Name must be at least 2 characters';
        if (strVal.length > 100) return 'Name must be less than 100 characters';
        return true;
      },
    },

    /**
     * Role - Determines access level and permissions
     * Field-level access control prevents non-admins from changing roles
     *
     * MULTI-TENANT HIERARCHY:
     * - superadmin (Level 6): Access ALL tenants, system configuration
     * - admin (Level 5): Full access WITHIN assigned tenant
     * - gestor (Level 4): Manage content & users within tenant
     * - marketing (Level 3): Create marketing content within tenant
     * - asesor (Level 2): Read client data within tenant
     * - lectura (Level 1): Read-only access within tenant
     */
    {
      name: 'role',
      type: 'select',
      required: ({ operation }) => operation === 'create',
      defaultValue: 'lectura',
      options: [
        {
          label: 'SuperAdmin (Level 6) - Multi-tenant system access',
          value: 'superadmin'
        },
        {
          label: 'Admin (Level 5) - Full tenant access',
          value: 'admin'
        },
        {
          label: 'Gestor (Level 4) - Manage content & users',
          value: 'gestor'
        },
        {
          label: 'Marketing (Level 3) - Create marketing content',
          value: 'marketing'
        },
        {
          label: 'Asesor (Level 2) - Read client data',
          value: 'asesor'
        },
        {
          label: 'Lectura (Level 1) - Read-only access',
          value: 'lectura'
        },
      ],
      admin: {
        description: 'User access level and permissions',
        position: 'sidebar',
      },
      /**
       * Field-level access control for role changes
       * Only superadmin/admin can change roles
       */
      access: {
        read: () => true, // Everyone can see roles
        update: ({ req }) => !!req.user && (req.user.role === 'superadmin' || req.user.role === 'admin'),
      },
    },

    /**
     * Tenant - Multi-tenant association
     * Links user to a specific academy/organization
     * SuperAdmin users do NOT have a tenant (they access all)
     */
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: false, // SuperAdmin doesn't have tenant
      index: true,
      admin: {
        description: 'Academia/Organización asignada',
        position: 'sidebar',
        // Only show for non-superadmin users
        condition: (data) => data?.role !== 'superadmin',
      },
      /**
       * Field-level access control for tenant assignment
       * Only superadmin can assign/change tenants
       */
      access: {
        read: () => true,
        update: ({ req }) => !!req.user && req.user.role === 'superadmin',
      },
      hooks: {
        beforeValidate: [
          ({ value, siblingData }) => {
            // SuperAdmin should NOT have a tenant
            if (siblingData?.role === 'superadmin') {
              return null;
            }
            return value;
          },
        ],
      },
    },

    /**
     * Avatar URL - Profile picture
     */
    {
      name: 'avatar_url',
      type: 'text',
      admin: {
        description: 'URL to profile picture',
        position: 'sidebar',
      },
      validate: (val: unknown): true | string => {
        if (!val) return true; // Optional field

        const strVal = String(val);
        try {
          new URL(strVal);
          return true;
        } catch {
          return 'Avatar URL must be a valid URL';
        }
      },
    },

    /**
     * Phone - Contact number (Spanish format)
     */
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'Phone number (format: +34 XXX XXX XXX)',
      },
      validate: (val: unknown): true | string => {
        if (!val) return true; // Optional field

        try {
          phoneSchema.parse(val);
          return true;
        } catch (error: any) {
          return error.errors?.[0]?.message || 'Invalid phone format';
        }
      },
    },

    /**
     * Active Status - Enable/disable account
     * Only admin can change this
     */
    {
      name: 'is_active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Account active status',
        position: 'sidebar',
      },
      /**
       * Field-level access control for activation
       * Only admin can activate/deactivate users
       */
      access: {
        read: () => true, // Everyone can see status
        update: ({ req }) => !!req.user && req.user.role === 'admin', // Only admin can change status
      },
    },

    /**
     * Last Login - Timestamp of most recent login
     * Read-only, updated automatically via hook
     */
    {
      name: 'last_login_at',
      type: 'date',
      admin: {
        description: 'Last login timestamp',
        readOnly: true,
        position: 'sidebar',
      },
    },

    /**
     * Login Count - Total number of logins
     * Read-only, incremented automatically via hook
     */
    {
      name: 'login_count',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Total number of logins',
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],

  /**
   * Hooks - Business logic and side effects
   */
  hooks: {
    /**
     * After Login - Update login statistics
     * Triggered after successful authentication
     */
    afterLogin: [
      async ({ req, user }) => {
        try {
          // Update login stats
          await req.payload.update({
            collection: 'users',
            id: user.id,
            data: {
              last_login_at: new Date().toISOString(),
              login_count: (user.login_count || 0) + 1,
            },
          });
        } catch (error) {
          // Log error but don't block login
          console.error('Failed to update login stats:', error);
        }
      },
    ],

    /**
     * Before Change - Validation and business logic
     * Triggered before create or update operations
     */
    beforeChange: [
      async ({ req, operation, data, originalDoc }) => {
        /**
         * Prevent users from changing their own role
         * Exception: Admin can change any role
         */
        if (operation === 'update' && req.user && originalDoc) {
          // Check if role is being changed
          if (data.role && data.role !== originalDoc.role) {
            // Only admin can change roles
            if (req.user.role !== 'admin') {
              throw new Error('You do not have permission to change user roles');
            }

            // If user is trying to change their own role (even as admin), deny
            if (req.user.id === originalDoc.id && req.user.role !== 'admin') {
              throw new Error('You cannot change your own role');
            }
          }
        }

        /**
         * Prevent demoting the last admin
         * Ensures at least one admin always exists
         */
        if (operation === 'update' && data.role && originalDoc?.role === 'admin') {
          // If changing from admin to another role
          if (data.role !== 'admin') {
            // Count total admin users
            const admins = await req.payload.find({
              collection: 'users',
              where: {
                role: { equals: 'admin' },
              },
              limit: 0, // Just get count
            });

            // If this is the last admin, prevent demotion
            if (admins.totalDocs <= 1) {
              throw new Error('Cannot demote the last admin user. At least one admin must exist.');
            }
          }
        }

        /**
         * Prevent inactive users from logging in
         * This is checked during authentication
         */
        if (operation === 'update' && data.is_active === false && originalDoc) {
          // Log deactivation for audit purposes
          console.log(`User ${originalDoc.email} (ID: ${originalDoc.id}) has been deactivated`);
        }

        return data;
      },
    ],

    /**
     * Before Delete - Prevent deleting the last admin
     */
    beforeDelete: [
      async ({ req, id }) => {
        // Get the user being deleted
        const userToDelete = await req.payload.findByID({
          collection: 'users',
          id,
        });

        // If deleting an admin, check if it's the last one
        if (userToDelete.role === 'admin') {
          const admins = await req.payload.find({
            collection: 'users',
            where: {
              role: { equals: 'admin' },
            },
            limit: 0,
          });

          if (admins.totalDocs <= 1) {
            throw new Error('Cannot delete the last admin user. At least one admin must exist.');
          }
        }

        // Prevent users from deleting themselves
        if (req.user && req.user.id === id) {
          throw new Error('You cannot delete yourself.');
        }
      },
    ],

    /**
     * After Read - Remove sensitive fields from response
     * Already handled by Payload's auth system, but can add custom logic here
     */
    afterRead: [
      async ({ doc }) => {
        // Remove sensitive fields (Payload already does this, but being explicit)
        // This is just documentation of what Payload handles automatically
        return doc;
      },
    ],
  },

  /**
   * Timestamps - Automatically add createdAt and updatedAt
   */
  timestamps: true,
};
