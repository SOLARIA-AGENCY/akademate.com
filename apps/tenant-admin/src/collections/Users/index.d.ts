/**
 * Users Collection Module
 *
 * Central export point for all Users collection components.
 *
 * Exports:
 * - Users: Main collection configuration
 * - Access control functions
 * - Validation schemas and utilities
 * - TypeScript types
 */
export { Users } from './Users';
export { isAdmin, isAdminOrGestor, isSelfOrAdmin, canReadUsers, canCreateUsers, canUpdateUsers, canDeleteUsers, } from './access';
export { passwordSchema, emailSchema, nameSchema, roleSchema, phoneSchema, avatarUrlSchema, userSchema, userCreateSchema, userUpdateSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, formatValidationErrors, validators, } from './Users.validation';
export type { UserCreate, UserUpdate, Login, ForgotPassword, ResetPassword, } from './Users.validation';
//# sourceMappingURL=index.d.ts.map