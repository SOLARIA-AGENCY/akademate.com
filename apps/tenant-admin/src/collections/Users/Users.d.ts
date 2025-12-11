import type { CollectionConfig } from 'payload';
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
export declare const Users: CollectionConfig;
//# sourceMappingURL=Users.d.ts.map