/**
 * Students Collection - Access Control
 *
 * This module exports all access control functions for the Students collection.
 *
 * Access control is implemented following the 6-tier RBAC model:
 * 1. Public (unauthenticated)
 * 2. Lectura (read-only with limited field access)
 * 3. Asesor (can create/read, limited update)
 * 4. Marketing (can create/read, very limited update)
 * 5. Gestor (full CRUD except immutable fields)
 * 6. Admin (full CRUD except immutable fields)
 *
 * Security Patterns Applied:
 * - SP-004: PII Data Handling (field-level access control)
 * - Defense in depth (collection-level + field-level access)
 * - Principle of least privilege
 */

export { canCreateStudent } from './canCreateStudent';
export { canReadStudents } from './canReadStudents';
export { canUpdateStudent } from './canUpdateStudent';
export { canDeleteStudent } from './canDeleteStudent';
