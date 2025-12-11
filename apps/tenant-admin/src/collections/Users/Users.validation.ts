import { z } from 'zod';

/**
 * Users Collection Validation Schemas
 *
 * This module defines comprehensive validation rules for the Users collection using Zod.
 * It enforces security best practices including password complexity requirements.
 *
 * Password Requirements:
 * - Minimum 8 characters, maximum 100 characters
 * - At least one lowercase letter (a-z)
 * - At least one uppercase letter (A-Z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 *
 * Email Requirements:
 * - Valid email format
 * - Maximum 100 characters
 * - Will be unique (enforced at database level)
 *
 * Phone Format (Spanish):
 * - Format: +34 XXX XXX XXX
 * - Optional field
 *
 * Role Hierarchy:
 * - admin (Level 5): Full system access
 * - gestor (Level 4): Manage content, users (except admins), moderate
 * - marketing (Level 3): Create and edit marketing content
 * - asesor (Level 2): Read-only access to client data, create notes
 * - lectura (Level 1): Read-only access to public content
 */

/**
 * Password Schema - Enforces strong password requirements
 *
 * Security Requirements:
 * - Minimum length: 8 characters (industry standard)
 * - Maximum length: 100 characters (prevent DoS attacks)
 * - Character diversity: lowercase, uppercase, number, special character
 *
 * Examples of valid passwords:
 * - "MyP@ssw0rd"
 * - "Test123!@#"
 * - "Secure$Pass2024"
 *
 * Examples of invalid passwords:
 * - "short1!" (too short)
 * - "nouppercase123!" (no uppercase)
 * - "NOLOWERCASE123!" (no lowercase)
 * - "NoNumbers!@#" (no number)
 * - "NoSpecial123" (no special character)
 */
export const passwordSchema = z
  .string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string',
  })
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^a-zA-Z0-9]/,
    'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)'
  );

/**
 * Email Schema - Validates email format and length
 */
export const emailSchema = z
  .string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string',
  })
  .email('Invalid email format')
  .max(100, 'Email must be less than 100 characters')
  .toLowerCase() // Normalize to lowercase
  .trim(); // Remove whitespace

/**
 * Name Schema - Validates user display name
 */
export const nameSchema = z
  .string({
    required_error: 'Name is required',
    invalid_type_error: 'Name must be a string',
  })
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .trim();

/**
 * Role Schema - Validates user role against allowed values
 *
 * Role Permissions Summary:
 * - admin: All permissions
 * - gestor: Manage content + users (except admins) + moderation
 * - marketing: Create/edit marketing content + view analytics
 * - asesor: Read client data + create notes/interactions
 * - lectura: Read public content only
 */
export const roleSchema = z.enum(['admin', 'gestor', 'marketing', 'asesor', 'lectura'], {
  required_error: 'Role is required',
  invalid_type_error:
    'Role must be one of: admin, gestor, marketing, asesor, lectura',
});

/**
 * Phone Schema - Validates Spanish phone number format
 *
 * Format: +34 XXX XXX XXX
 * Example: +34 123 456 789
 */
export const phoneSchema = z
  .string()
  .regex(
    /^\+34\s\d{3}\s\d{3}\s\d{3}$/,
    'Phone must be in format: +34 XXX XXX XXX (e.g., +34 123 456 789)'
  )
  .optional();

/**
 * Avatar URL Schema - Validates image URL
 */
export const avatarUrlSchema = z
  .string()
  .url('Avatar URL must be a valid URL')
  .max(500, 'Avatar URL must be less than 500 characters')
  .optional();

/**
 * Complete User Schema - Used for creating new users
 *
 * All required fields must be provided:
 * - email: Unique, valid email address
 * - password: Strong password meeting complexity requirements
 * - name: Display name for the user
 * - role: User's access level (defaults to 'lectura' if not provided)
 *
 * Optional fields:
 * - avatar_url: Profile picture URL
 * - phone: Spanish phone number
 * - is_active: Account status (defaults to true)
 */
export const userSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  role: roleSchema.default('lectura'),
  avatar_url: avatarUrlSchema,
  phone: phoneSchema,
  is_active: z.boolean().default(true).optional(),
});

/**
 * User Create Schema - For POST /api/users
 *
 * Identical to userSchema but explicitly for creation operations.
 * Password is required for new users.
 */
export const userCreateSchema = userSchema;

/**
 * User Update Schema - For PATCH /api/users/:id
 *
 * All fields are optional for partial updates.
 * Password is omitted - use dedicated password reset endpoint instead.
 *
 * Note: Some fields have additional restrictions:
 * - role: Only admin can change (enforced in access control)
 * - is_active: Only admin can change (enforced in access control)
 * - email: Cannot be changed (enforced in collection config)
 */
export const userUpdateSchema = userSchema.partial().omit({ password: true });

/**
 * Login Schema - For POST /api/users/login
 *
 * Accepts email and password for authentication.
 * No password complexity validation on login (only on creation/reset).
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string',
  }),
});

/**
 * Forgot Password Schema - For POST /api/users/forgot-password
 *
 * Accepts email to send password reset token.
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset Password Schema - For POST /api/users/reset-password
 *
 * Accepts reset token and new password.
 * New password must meet complexity requirements.
 */
export const resetPasswordSchema = z.object({
  token: z.string({
    required_error: 'Reset token is required',
    invalid_type_error: 'Reset token must be a string',
  }),
  password: passwordSchema,
});

/**
 * Utility function to format validation errors for API responses
 *
 * Converts Zod validation errors to a more readable format.
 *
 * @param error - Zod validation error object
 * @returns Array of formatted error messages
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
}

/**
 * Type exports for TypeScript type safety
 */
export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type Login = z.infer<typeof loginSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;

/**
 * Validation helper functions for use in Payload hooks
 */
export const validators = {
  /**
   * Validate user creation data
   */
  validateCreate: (data: unknown) => {
    const result = userCreateSchema.safeParse(data);
    if (!result.success) {
      throw new Error(formatValidationErrors(result.error).join(', '));
    }
    return result.data;
  },

  /**
   * Validate user update data
   */
  validateUpdate: (data: unknown) => {
    const result = userUpdateSchema.safeParse(data);
    if (!result.success) {
      throw new Error(formatValidationErrors(result.error).join(', '));
    }
    return result.data;
  },

  /**
   * Validate login credentials
   */
  validateLogin: (data: unknown) => {
    const result = loginSchema.safeParse(data);
    if (!result.success) {
      throw new Error(formatValidationErrors(result.error).join(', '));
    }
    return result.data;
  },

  /**
   * Validate password reset request
   */
  validateResetPassword: (data: unknown) => {
    const result = resetPasswordSchema.safeParse(data);
    if (!result.success) {
      throw new Error(formatValidationErrors(result.error).join(', '));
    }
    return result.data;
  },
};
