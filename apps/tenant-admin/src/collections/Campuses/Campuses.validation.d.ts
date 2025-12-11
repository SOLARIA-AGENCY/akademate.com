import { z } from 'zod';
/**
 * Complete campus validation schema
 */
export declare const campusSchema: z.ZodObject<{
    slug: z.ZodString;
    name: z.ZodEffects<z.ZodString, string, string>;
    city: z.ZodEffects<z.ZodString, string, string>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    postal_code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    maps_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    city: string;
    slug: string;
    address?: string | null | undefined;
    email?: string | null | undefined;
    phone?: string | null | undefined;
    postal_code?: string | null | undefined;
    maps_url?: string | null | undefined;
}, {
    name: string;
    city: string;
    slug: string;
    address?: string | null | undefined;
    email?: string | null | undefined;
    phone?: string | null | undefined;
    postal_code?: string | null | undefined;
    maps_url?: string | null | undefined;
}>;
/**
 * Schema for creating a new campus (slug is optional, will be auto-generated)
 */
export declare const campusCreateSchema: z.ZodObject<{
    name: z.ZodEffects<z.ZodString, string, string>;
    city: z.ZodEffects<z.ZodString, string, string>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    postal_code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    maps_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
} & {
    slug: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    city: string;
    address?: string | null | undefined;
    email?: string | null | undefined;
    phone?: string | null | undefined;
    slug?: string | undefined;
    postal_code?: string | null | undefined;
    maps_url?: string | null | undefined;
}, {
    name: string;
    city: string;
    address?: string | null | undefined;
    email?: string | null | undefined;
    phone?: string | null | undefined;
    slug?: string | undefined;
    postal_code?: string | null | undefined;
    maps_url?: string | null | undefined;
}>;
/**
 * Schema for updating an existing campus (all fields optional)
 */
export declare const campusUpdateSchema: z.ZodObject<{
    slug: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    city: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    postal_code: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    email: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    maps_url: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    address?: string | null | undefined;
    email?: string | null | undefined;
    name?: string | undefined;
    phone?: string | null | undefined;
    city?: string | undefined;
    slug?: string | undefined;
    postal_code?: string | null | undefined;
    maps_url?: string | null | undefined;
}, {
    address?: string | null | undefined;
    email?: string | null | undefined;
    name?: string | undefined;
    phone?: string | null | undefined;
    city?: string | undefined;
    slug?: string | undefined;
    postal_code?: string | null | undefined;
    maps_url?: string | null | undefined;
}>;
/**
 * Type inference from schemas
 */
export type CampusData = z.infer<typeof campusSchema>;
export type CampusCreateData = z.infer<typeof campusCreateSchema>;
export type CampusUpdateData = z.infer<typeof campusUpdateSchema>;
/**
 * Validation helper functions
 */
/**
 * Validates campus data against the schema
 * @param data - The data to validate
 * @returns Validation result with parsed data or errors
 */
export declare function validateCampus(data: unknown): z.SafeParseReturnType<{
    name: string;
    city: string;
    slug: string;
    address?: string | null | undefined;
    email?: string | null | undefined;
    phone?: string | null | undefined;
    postal_code?: string | null | undefined;
    maps_url?: string | null | undefined;
}, {
    name: string;
    city: string;
    slug: string;
    address?: string | null | undefined;
    email?: string | null | undefined;
    phone?: string | null | undefined;
    postal_code?: string | null | undefined;
    maps_url?: string | null | undefined;
}>;
/**
 * Validates campus creation data against the schema
 * @param data - The data to validate
 * @returns Validation result with parsed data or errors
 */
export declare function validateCampusCreate(data: unknown): z.SafeParseReturnType<{
    name: string;
    city: string;
    address?: string | null | undefined;
    email?: string | null | undefined;
    phone?: string | null | undefined;
    slug?: string | undefined;
    postal_code?: string | null | undefined;
    maps_url?: string | null | undefined;
}, {
    name: string;
    city: string;
    address?: string | null | undefined;
    email?: string | null | undefined;
    phone?: string | null | undefined;
    slug?: string | undefined;
    postal_code?: string | null | undefined;
    maps_url?: string | null | undefined;
}>;
/**
 * Validates campus update data against the schema
 * @param data - The data to validate
 * @returns Validation result with parsed data or errors
 */
export declare function validateCampusUpdate(data: unknown): z.SafeParseReturnType<{
    address?: string | null | undefined;
    email?: string | null | undefined;
    name?: string | undefined;
    phone?: string | null | undefined;
    city?: string | undefined;
    slug?: string | undefined;
    postal_code?: string | null | undefined;
    maps_url?: string | null | undefined;
}, {
    address?: string | null | undefined;
    email?: string | null | undefined;
    name?: string | undefined;
    phone?: string | null | undefined;
    city?: string | undefined;
    slug?: string | undefined;
    postal_code?: string | null | undefined;
    maps_url?: string | null | undefined;
}>;
/**
 * Format Zod validation errors for Payload
 * @param errors - Zod validation errors
 * @returns Formatted error messages
 */
export declare function formatValidationErrors(errors: z.ZodError): {
    field: string;
    message: string;
}[];
/**
 * Spanish phone number formatter
 * Formats a phone number to the Spanish format: +34 XXX XXX XXX
 *
 * @param phone - Raw phone number
 * @returns Formatted phone number or null if invalid
 *
 * @example
 * formatSpanishPhone('34912345678') // '+34 912 345 678'
 * formatSpanishPhone('+34912345678') // '+34 912 345 678'
 * formatSpanishPhone('912345678') // '+34 912 345 678'
 */
export declare function formatSpanishPhone(phone: string): string | null;
/**
 * Validates Spanish postal code
 *
 * @param postalCode - Postal code to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidSpanishPostalCode('28001') // true
 * isValidSpanishPostalCode('123') // false
 */
export declare function isValidSpanishPostalCode(postalCode: string): boolean;
/**
 * Validates Spanish phone number
 *
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidSpanishPhone('+34 912 345 678') // true
 * isValidSpanishPhone('912345678') // false
 */
export declare function isValidSpanishPhone(phone: string): boolean;
//# sourceMappingURL=Campuses.validation.d.ts.map