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
export declare const passwordSchema: z.ZodString;
/**
 * Email Schema - Validates email format and length
 */
export declare const emailSchema: z.ZodString;
/**
 * Name Schema - Validates user display name
 */
export declare const nameSchema: z.ZodString;
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
export declare const roleSchema: z.ZodEnum<["admin", "gestor", "marketing", "asesor", "lectura"]>;
/**
 * Phone Schema - Validates Spanish phone number format
 *
 * Format: +34 XXX XXX XXX
 * Example: +34 123 456 789
 */
export declare const phoneSchema: z.ZodOptional<z.ZodString>;
/**
 * Avatar URL Schema - Validates image URL
 */
export declare const avatarUrlSchema: z.ZodOptional<z.ZodString>;
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
export declare const userSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["admin", "gestor", "marketing", "asesor", "lectura"]>>;
    avatar_url: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    role: "admin" | "gestor" | "marketing" | "asesor" | "lectura";
    email: string;
    password: string;
    name: string;
    phone?: string | undefined;
    is_active?: boolean | undefined;
    avatar_url?: string | undefined;
}, {
    email: string;
    password: string;
    name: string;
    role?: "admin" | "gestor" | "marketing" | "asesor" | "lectura" | undefined;
    phone?: string | undefined;
    is_active?: boolean | undefined;
    avatar_url?: string | undefined;
}>;
/**
 * User Create Schema - For POST /api/users
 *
 * Identical to userSchema but explicitly for creation operations.
 * Password is required for new users.
 */
export declare const userCreateSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["admin", "gestor", "marketing", "asesor", "lectura"]>>;
    avatar_url: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    role: "admin" | "gestor" | "marketing" | "asesor" | "lectura";
    email: string;
    password: string;
    name: string;
    phone?: string | undefined;
    is_active?: boolean | undefined;
    avatar_url?: string | undefined;
}, {
    email: string;
    password: string;
    name: string;
    role?: "admin" | "gestor" | "marketing" | "asesor" | "lectura" | undefined;
    phone?: string | undefined;
    is_active?: boolean | undefined;
    avatar_url?: string | undefined;
}>;
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
export declare const userUpdateSchema: z.ZodObject<Omit<{
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodDefault<z.ZodEnum<["admin", "gestor", "marketing", "asesor", "lectura"]>>>;
    avatar_url: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    is_active: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
}, "password">, "strip", z.ZodTypeAny, {
    role?: "admin" | "gestor" | "marketing" | "asesor" | "lectura" | undefined;
    email?: string | undefined;
    name?: string | undefined;
    phone?: string | undefined;
    is_active?: boolean | undefined;
    avatar_url?: string | undefined;
}, {
    role?: "admin" | "gestor" | "marketing" | "asesor" | "lectura" | undefined;
    email?: string | undefined;
    name?: string | undefined;
    phone?: string | undefined;
    is_active?: boolean | undefined;
    avatar_url?: string | undefined;
}>;
/**
 * Login Schema - For POST /api/users/login
 *
 * Accepts email and password for authentication.
 * No password complexity validation on login (only on creation/reset).
 */
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
/**
 * Forgot Password Schema - For POST /api/users/forgot-password
 *
 * Accepts email to send password reset token.
 */
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
/**
 * Reset Password Schema - For POST /api/users/reset-password
 *
 * Accepts reset token and new password.
 * New password must meet complexity requirements.
 */
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
/**
 * Utility function to format validation errors for API responses
 *
 * Converts Zod validation errors to a more readable format.
 *
 * @param error - Zod validation error object
 * @returns Array of formatted error messages
 */
export declare function formatValidationErrors(error: z.ZodError): string[];
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
export declare const validators: {
    /**
     * Validate user creation data
     */
    validateCreate: (data: unknown) => {
        role: "admin" | "gestor" | "marketing" | "asesor" | "lectura";
        email: string;
        password: string;
        name: string;
        phone?: string | undefined;
        is_active?: boolean | undefined;
        avatar_url?: string | undefined;
    };
    /**
     * Validate user update data
     */
    validateUpdate: (data: unknown) => {
        role?: "admin" | "gestor" | "marketing" | "asesor" | "lectura" | undefined;
        email?: string | undefined;
        name?: string | undefined;
        phone?: string | undefined;
        is_active?: boolean | undefined;
        avatar_url?: string | undefined;
    };
    /**
     * Validate login credentials
     */
    validateLogin: (data: unknown) => {
        email: string;
        password: string;
    };
    /**
     * Validate password reset request
     */
    validateResetPassword: (data: unknown) => {
        password: string;
        token: string;
    };
};
//# sourceMappingURL=Users.validation.d.ts.map