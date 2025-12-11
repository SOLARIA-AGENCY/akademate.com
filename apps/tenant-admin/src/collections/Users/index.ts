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

// Main collection configuration
export { Users } from './Users';

// Access control functions
export {
  isAdmin,
  isAdminOrGestor,
  isSelfOrAdmin,
  canReadUsers,
  canCreateUsers,
  canUpdateUsers,
  canDeleteUsers,
} from './access';

// Validation schemas and utilities
export {
  passwordSchema,
  emailSchema,
  nameSchema,
  roleSchema,
  phoneSchema,
  avatarUrlSchema,
  userSchema,
  userCreateSchema,
  userUpdateSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  formatValidationErrors,
  validators,
} from './Users.validation';

// TypeScript types
export type {
  UserCreate,
  UserUpdate,
  Login,
  ForgotPassword,
  ResetPassword,
} from './Users.validation';
