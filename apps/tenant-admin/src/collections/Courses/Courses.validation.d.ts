import { z } from 'zod';
/**
 * Courses Validation - Zod Schemas (3-Layer Validation)
 *
 * Layer 1: Payload field validators (in Courses.ts)
 * Layer 2: Zod runtime validation (this file)
 * Layer 3: PostgreSQL constraints (in migrations)
 *
 * This provides comprehensive validation at runtime and enables
 * type-safe data handling throughout the application.
 */
/**
 * Zod schema for course validation
 *
 * Validates:
 * - Required fields: slug, name, cycle_id, modality
 * - Optional fields: descriptions, pricing, campus relationships
 * - Format constraints: slug format, name length, price precision
 * - Enum validation: modality values
 * - Relationship validation: UUIDs for cycle and campuses
 */
export declare const CourseSchema: z.ZodObject<{
    slug: z.ZodString;
    name: z.ZodString;
    cycle: z.ZodString;
    campuses: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    short_description: z.ZodOptional<z.ZodString>;
    long_description: z.ZodOptional<z.ZodString>;
    modality: z.ZodEnum<["presencial", "online", "hibrido"]>;
    duration_hours: z.ZodOptional<z.ZodNumber>;
    base_price: z.ZodOptional<z.ZodNumber>;
    financial_aid_available: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    active: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    featured: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    meta_title: z.ZodOptional<z.ZodString>;
    meta_description: z.ZodOptional<z.ZodString>;
    created_by: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    featured: boolean;
    name: string;
    campuses: string[];
    slug: string;
    cycle: string;
    modality: "presencial" | "online" | "hibrido";
    financial_aid_available: boolean;
    short_description?: string | undefined;
    long_description?: string | undefined;
    duration_hours?: number | undefined;
    base_price?: number | undefined;
    meta_title?: string | undefined;
    meta_description?: string | undefined;
    created_by?: string | undefined;
}, {
    name: string;
    slug: string;
    cycle: string;
    modality: "presencial" | "online" | "hibrido";
    active?: boolean | undefined;
    featured?: boolean | undefined;
    campuses?: string[] | undefined;
    short_description?: string | undefined;
    long_description?: string | undefined;
    duration_hours?: number | undefined;
    base_price?: number | undefined;
    financial_aid_available?: boolean | undefined;
    meta_title?: string | undefined;
    meta_description?: string | undefined;
    created_by?: string | undefined;
}>;
/**
 * TypeScript type inferred from Zod schema
 * Use this type for type-safe course data handling
 */
export type CourseInput = z.infer<typeof CourseSchema>;
/**
 * Validation helper function
 *
 * Validates course data against the Zod schema and returns
 * validated data or throws validation errors.
 *
 * @param data - Unknown data to validate
 * @returns Validated CourseInput
 * @throws ZodError if validation fails
 */
export declare const validateCourseData: (data: unknown) => CourseInput;
/**
 * Safe validation helper (doesn't throw)
 *
 * @param data - Unknown data to validate
 * @returns { success: true, data } or { success: false, error }
 */
export declare const validateCourseDataSafe: (data: unknown) => z.SafeParseReturnType<{
    name: string;
    slug: string;
    cycle: string;
    modality: "presencial" | "online" | "hibrido";
    active?: boolean | undefined;
    featured?: boolean | undefined;
    campuses?: string[] | undefined;
    short_description?: string | undefined;
    long_description?: string | undefined;
    duration_hours?: number | undefined;
    base_price?: number | undefined;
    financial_aid_available?: boolean | undefined;
    meta_title?: string | undefined;
    meta_description?: string | undefined;
    created_by?: string | undefined;
}, {
    active: boolean;
    featured: boolean;
    name: string;
    campuses: string[];
    slug: string;
    cycle: string;
    modality: "presencial" | "online" | "hibrido";
    financial_aid_available: boolean;
    short_description?: string | undefined;
    long_description?: string | undefined;
    duration_hours?: number | undefined;
    base_price?: number | undefined;
    meta_title?: string | undefined;
    meta_description?: string | undefined;
    created_by?: string | undefined;
}>;
/**
 * Slug generation utility
 *
 * Converts course name to URL-friendly slug:
 * - Converts to lowercase
 * - Normalizes Unicode characters (removes accents)
 * - Replaces non-alphanumeric chars with hyphens
 * - Removes leading/trailing hyphens
 *
 * Examples:
 * - "Técnico Superior en Marketing" → "tecnico-superior-en-marketing"
 * - "Grado Medio - Informática" → "grado-medio-informatica"
 *
 * @param name - Course name
 * @returns URL-friendly slug
 */
export declare const generateCourseSlug: (name: string) => string;
/**
 * Format validation errors for better UX
 *
 * Converts Zod error object to user-friendly error messages
 *
 * @param error - Zod validation error
 * @returns Array of formatted error messages
 */
export declare const formatValidationErrors: (error: z.ZodError) => string[];
/**
 * Partial schema for updates (all fields optional)
 * Use this when validating PATCH requests
 */
export declare const CourseUpdateSchema: z.ZodObject<{
    slug: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    cycle: z.ZodOptional<z.ZodString>;
    campuses: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>>;
    short_description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    long_description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    modality: z.ZodOptional<z.ZodEnum<["presencial", "online", "hibrido"]>>;
    duration_hours: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    base_price: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    financial_aid_available: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    active: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    featured: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    meta_title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    meta_description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    created_by: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    active?: boolean | undefined;
    featured?: boolean | undefined;
    name?: string | undefined;
    campuses?: string[] | undefined;
    slug?: string | undefined;
    cycle?: string | undefined;
    short_description?: string | undefined;
    long_description?: string | undefined;
    modality?: "presencial" | "online" | "hibrido" | undefined;
    duration_hours?: number | undefined;
    base_price?: number | undefined;
    financial_aid_available?: boolean | undefined;
    meta_title?: string | undefined;
    meta_description?: string | undefined;
    created_by?: string | undefined;
}, {
    active?: boolean | undefined;
    featured?: boolean | undefined;
    name?: string | undefined;
    campuses?: string[] | undefined;
    slug?: string | undefined;
    cycle?: string | undefined;
    short_description?: string | undefined;
    long_description?: string | undefined;
    modality?: "presencial" | "online" | "hibrido" | undefined;
    duration_hours?: number | undefined;
    base_price?: number | undefined;
    financial_aid_available?: boolean | undefined;
    meta_title?: string | undefined;
    meta_description?: string | undefined;
    created_by?: string | undefined;
}>;
/**
 * Type for course updates
 */
export type CourseUpdate = z.infer<typeof CourseUpdateSchema>;
//# sourceMappingURL=Courses.validation.d.ts.map