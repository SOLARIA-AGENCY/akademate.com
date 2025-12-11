import { z } from 'zod';
/**
 * Students Collection - Validation Schemas
 *
 * This file contains Zod schemas for validating student data with GDPR compliance
 * and Spanish-specific validation (DNI, phone format).
 *
 * Key validations:
 * - Spanish phone format: +34 XXX XXX XXX
 * - Email RFC 5322 compliance
 * - Spanish DNI format: 8 digits + checksum letter
 * - GDPR consent MUST be true (not just truthy)
 * - Privacy policy acceptance MUST be true
 * - Age validation: Student must be >= 16 years old
 * - Status, gender enums
 * - Field length constraints
 */
/**
 * Spanish phone format: +34 XXX XXX XXX
 * Examples:
 * - +34 612 345 678 ✅ (mobile)
 * - +34 912 345 678 ✅ (landline Madrid)
 * - 612345678 ❌ (missing +34)
 * - +1 555 123 4567 ❌ (wrong country code)
 */
export declare const spanishPhoneRegex: RegExp;
export declare const phoneSchema: z.ZodString;
/**
 * Format Spanish phone number from various input formats
 *
 * @param phone - Input phone number
 * @returns Formatted phone in +34 XXX XXX XXX format
 *
 * Examples:
 * - formatSpanishPhone('612345678') → '+34 612 345 678'
 * - formatSpanishPhone('34612345678') → '+34 612 345 678'
 * - formatSpanishPhone('+34612345678') → '+34 612 345 678'
 */
export declare const formatSpanishPhone: (phone: string) => string;
/**
 * Spanish DNI format: 8 digits + 1 letter (checksum)
 * The letter is calculated from the number using modulo 23
 *
 * Examples:
 * - 12345678Z ✅ (valid checksum)
 * - 12345678X ❌ (invalid checksum)
 * - 1234567Z ❌ (only 7 digits)
 */
export declare const dniRegex: RegExp;
/**
 * Validate Spanish DNI checksum
 *
 * @param dni - DNI string (8 digits + 1 letter)
 * @returns true if checksum is valid
 *
 * Algorithm:
 * 1. Extract number (first 8 digits)
 * 2. Calculate: number % 23
 * 3. Look up letter at that position in DNI_LETTERS
 * 4. Compare with provided letter
 */
export declare const validateDNIChecksum: (dni: string) => boolean;
/**
 * Zod schema for DNI validation with checksum
 */
export declare const dniSchema: z.ZodEffects<z.ZodString, string, string>;
/**
 * Email validation using Zod's built-in email validator (RFC 5322)
 */
export declare const emailSchema: z.ZodString;
/**
 * GDPR consent MUST be explicitly true (not just truthy)
 * This enforces the database CHECK constraint at the application level
 */
export declare const gdprConsentSchema: z.ZodLiteral<true>;
/**
 * Privacy policy acceptance MUST be explicitly true
 * This enforces the database CHECK constraint at the application level
 */
export declare const privacyPolicySchema: z.ZodLiteral<true>;
/**
 * Marketing consent is OPTIONAL (can be true or false)
 */
export declare const marketingConsentSchema: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
/**
 * Validate date of birth:
 * - Must be in the past
 * - Student must be at least 16 years old
 */
export declare const dateOfBirthSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Student status enum
 */
export declare const VALID_STUDENT_STATUSES: readonly ["active", "inactive", "suspended", "graduated"];
export declare const statusSchema: z.ZodEnum<["active", "inactive", "suspended", "graduated"]>;
/**
 * Gender enum
 */
export declare const VALID_GENDERS: readonly ["male", "female", "non-binary", "prefer-not-to-say"];
export declare const genderSchema: z.ZodEnum<["male", "female", "non-binary", "prefer-not-to-say"]>;
/**
 * Emergency contact relationship enum
 */
export declare const VALID_RELATIONSHIPS: readonly ["parent", "father", "mother", "guardian", "spouse", "partner", "sibling", "friend", "other"];
export declare const relationshipSchema: z.ZodEnum<["parent", "father", "mother", "guardian", "spouse", "partner", "sibling", "friend", "other"]>;
export declare const uuidSchema: z.ZodString;
/**
 * Complete Student validation schema
 *
 * Required fields:
 * - first_name, last_name, email, phone (PII)
 * - gdpr_consent = true (MANDATORY)
 * - privacy_policy_accepted = true (MANDATORY)
 *
 * Optional fields:
 * - dni (unique if provided)
 * - address, city, postal_code, country
 * - date_of_birth (must be >= 16 years old)
 * - gender
 * - emergency_contact_* (name, phone, relationship)
 * - marketing_consent (OPTIONAL, defaults to false)
 * - status, notes
 */
export declare const StudentSchema: z.ZodObject<{
    first_name: z.ZodString;
    last_name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    gdpr_consent: z.ZodLiteral<true>;
    privacy_policy_accepted: z.ZodLiteral<true>;
    marketing_consent: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    dni: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    postal_code: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    date_of_birth: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    gender: z.ZodOptional<z.ZodEnum<["male", "female", "non-binary", "prefer-not-to-say"]>>;
    emergency_contact_name: z.ZodOptional<z.ZodString>;
    emergency_contact_phone: z.ZodOptional<z.ZodString>;
    emergency_contact_relationship: z.ZodOptional<z.ZodEnum<["parent", "father", "mother", "guardian", "spouse", "partner", "sibling", "friend", "other"]>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["active", "inactive", "suspended", "graduated"]>>>;
    notes: z.ZodOptional<z.ZodString>;
    consent_timestamp: z.ZodOptional<z.ZodString>;
    consent_ip_address: z.ZodOptional<z.ZodString>;
    created_by: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "suspended" | "inactive" | "graduated";
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    gdpr_consent: true;
    privacy_policy_accepted: true;
    marketing_consent: boolean;
    address?: string | undefined;
    country?: string | undefined;
    city?: string | undefined;
    notes?: string | undefined;
    created_by?: string | undefined;
    consent_timestamp?: string | undefined;
    consent_ip_address?: string | undefined;
    postal_code?: string | undefined;
    dni?: string | undefined;
    date_of_birth?: string | undefined;
    gender?: "male" | "female" | "non-binary" | "prefer-not-to-say" | undefined;
    emergency_contact_name?: string | undefined;
    emergency_contact_phone?: string | undefined;
    emergency_contact_relationship?: "other" | "parent" | "father" | "mother" | "guardian" | "spouse" | "partner" | "sibling" | "friend" | undefined;
}, {
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    gdpr_consent: true;
    privacy_policy_accepted: true;
    status?: "active" | "suspended" | "inactive" | "graduated" | undefined;
    address?: string | undefined;
    country?: string | undefined;
    city?: string | undefined;
    notes?: string | undefined;
    created_by?: string | undefined;
    marketing_consent?: boolean | undefined;
    consent_timestamp?: string | undefined;
    consent_ip_address?: string | undefined;
    postal_code?: string | undefined;
    dni?: string | undefined;
    date_of_birth?: string | undefined;
    gender?: "male" | "female" | "non-binary" | "prefer-not-to-say" | undefined;
    emergency_contact_name?: string | undefined;
    emergency_contact_phone?: string | undefined;
    emergency_contact_relationship?: "other" | "parent" | "father" | "mother" | "guardian" | "spouse" | "partner" | "sibling" | "friend" | undefined;
}>;
/**
 * Type inference from schema
 */
export type StudentInput = z.infer<typeof StudentSchema>;
/**
 * Validation helper function
 *
 * @param data - Raw data to validate
 * @returns Validated student data
 * @throws ZodError if validation fails
 */
export declare const validateStudentData: (data: unknown) => StudentInput;
/**
 * Safe validation helper (returns result object)
 *
 * @param data - Raw data to validate
 * @returns { success: boolean, data?: StudentInput, error?: ZodError }
 */
export declare const safeValidateStudentData: (data: unknown) => z.SafeParseReturnType<{
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    gdpr_consent: true;
    privacy_policy_accepted: true;
    status?: "active" | "suspended" | "inactive" | "graduated" | undefined;
    address?: string | undefined;
    country?: string | undefined;
    city?: string | undefined;
    notes?: string | undefined;
    created_by?: string | undefined;
    marketing_consent?: boolean | undefined;
    consent_timestamp?: string | undefined;
    consent_ip_address?: string | undefined;
    postal_code?: string | undefined;
    dni?: string | undefined;
    date_of_birth?: string | undefined;
    gender?: "male" | "female" | "non-binary" | "prefer-not-to-say" | undefined;
    emergency_contact_name?: string | undefined;
    emergency_contact_phone?: string | undefined;
    emergency_contact_relationship?: "other" | "parent" | "father" | "mother" | "guardian" | "spouse" | "partner" | "sibling" | "friend" | undefined;
}, {
    status: "active" | "suspended" | "inactive" | "graduated";
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    gdpr_consent: true;
    privacy_policy_accepted: true;
    marketing_consent: boolean;
    address?: string | undefined;
    country?: string | undefined;
    city?: string | undefined;
    notes?: string | undefined;
    created_by?: string | undefined;
    consent_timestamp?: string | undefined;
    consent_ip_address?: string | undefined;
    postal_code?: string | undefined;
    dni?: string | undefined;
    date_of_birth?: string | undefined;
    gender?: "male" | "female" | "non-binary" | "prefer-not-to-say" | undefined;
    emergency_contact_name?: string | undefined;
    emergency_contact_phone?: string | undefined;
    emergency_contact_relationship?: "other" | "parent" | "father" | "mother" | "guardian" | "spouse" | "partner" | "sibling" | "friend" | undefined;
}>;
/**
 * Partial schema for updates (all fields optional except immutable ones)
 */
export declare const StudentUpdateSchema: z.ZodObject<{
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    marketing_consent: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    dni: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    city: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    postal_code: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    country: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    date_of_birth: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>>;
    gender: z.ZodOptional<z.ZodOptional<z.ZodEnum<["male", "female", "non-binary", "prefer-not-to-say"]>>>;
    emergency_contact_name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    emergency_contact_phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    emergency_contact_relationship: z.ZodOptional<z.ZodOptional<z.ZodEnum<["parent", "father", "mother", "guardian", "spouse", "partner", "sibling", "friend", "other"]>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodEnum<["active", "inactive", "suspended", "graduated"]>>>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    gdpr_consent: z.ZodOptional<z.ZodLiteral<true>>;
    privacy_policy_accepted: z.ZodOptional<z.ZodLiteral<true>>;
    consent_timestamp: z.ZodOptional<z.ZodNever>;
    consent_ip_address: z.ZodOptional<z.ZodNever>;
    created_by: z.ZodOptional<z.ZodNever>;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "suspended" | "inactive" | "graduated" | undefined;
    address?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    country?: string | undefined;
    city?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    notes?: string | undefined;
    created_by?: undefined;
    gdpr_consent?: true | undefined;
    privacy_policy_accepted?: true | undefined;
    marketing_consent?: boolean | undefined;
    consent_timestamp?: undefined;
    consent_ip_address?: undefined;
    postal_code?: string | undefined;
    dni?: string | undefined;
    date_of_birth?: string | undefined;
    gender?: "male" | "female" | "non-binary" | "prefer-not-to-say" | undefined;
    emergency_contact_name?: string | undefined;
    emergency_contact_phone?: string | undefined;
    emergency_contact_relationship?: "other" | "parent" | "father" | "mother" | "guardian" | "spouse" | "partner" | "sibling" | "friend" | undefined;
}, {
    status?: "active" | "suspended" | "inactive" | "graduated" | undefined;
    address?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    country?: string | undefined;
    city?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    notes?: string | undefined;
    created_by?: undefined;
    gdpr_consent?: true | undefined;
    privacy_policy_accepted?: true | undefined;
    marketing_consent?: boolean | undefined;
    consent_timestamp?: undefined;
    consent_ip_address?: undefined;
    postal_code?: string | undefined;
    dni?: string | undefined;
    date_of_birth?: string | undefined;
    gender?: "male" | "female" | "non-binary" | "prefer-not-to-say" | undefined;
    emergency_contact_name?: string | undefined;
    emergency_contact_phone?: string | undefined;
    emergency_contact_relationship?: "other" | "parent" | "father" | "mother" | "guardian" | "spouse" | "partner" | "sibling" | "friend" | undefined;
}>;
export type StudentUpdateInput = z.infer<typeof StudentUpdateSchema>;
/**
 * Format validation errors for API responses
 *
 * @param error - Zod error object
 * @returns Formatted error array for Payload CMS
 */
export declare const formatValidationErrors: (error: z.ZodError) => {
    message: string;
    field: string;
}[];
/**
 * Validate email uniqueness (must be checked against database)
 * This is handled by Payload's unique constraint
 */
export declare const checkEmailUniqueness: (email: string, payload: any, excludeId?: string) => Promise<boolean>;
/**
 * Validate DNI uniqueness (must be checked against database)
 * This is handled by Payload's unique constraint
 */
export declare const checkDNIUniqueness: (dni: string, payload: any, excludeId?: string) => Promise<boolean>;
//# sourceMappingURL=Students.validation.d.ts.map