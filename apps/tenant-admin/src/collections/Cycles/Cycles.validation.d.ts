import { z } from 'zod';
/**
 * Zod Validation Schema for Cycles Collection
 *
 * Provides runtime type validation and TypeScript type inference
 * for the Cycles collection data.
 *
 * Usage:
 * - Type inference: `type CycleData = z.infer<typeof cycleSchema>`
 * - Validation: `cycleSchema.parse(data)` or `cycleSchema.safeParse(data)`
 */
/**
 * Level enum values matching PostgreSQL CHECK constraint
 */
export declare const cycleLevel: z.ZodEnum<["fp_basica", "grado_medio", "grado_superior", "certificado_profesionalidad"]>;
export type CycleLevel = z.infer<typeof cycleLevel>;
/**
 * Complete cycle validation schema
 */
export declare const cycleSchema: z.ZodObject<{
    slug: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    level: z.ZodEnum<["fp_basica", "grado_medio", "grado_superior", "certificado_profesionalidad"]>;
    order_display: z.ZodDefault<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    level: "grado_medio" | "grado_superior" | "fp_basica" | "certificado_profesionalidad";
    order_display: number | null;
    description?: string | null | undefined;
}, {
    name: string;
    slug: string;
    level: "grado_medio" | "grado_superior" | "fp_basica" | "certificado_profesionalidad";
    description?: string | null | undefined;
    order_display?: number | null | undefined;
}>;
/**
 * Schema for creating a new cycle (slug is optional, will be auto-generated)
 */
export declare const cycleCreateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    level: z.ZodEnum<["fp_basica", "grado_medio", "grado_superior", "certificado_profesionalidad"]>;
    order_display: z.ZodDefault<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
} & {
    slug: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    level: "grado_medio" | "grado_superior" | "fp_basica" | "certificado_profesionalidad";
    order_display: number | null;
    description?: string | null | undefined;
    slug?: string | undefined;
}, {
    name: string;
    level: "grado_medio" | "grado_superior" | "fp_basica" | "certificado_profesionalidad";
    description?: string | null | undefined;
    slug?: string | undefined;
    order_display?: number | null | undefined;
}>;
/**
 * Schema for updating an existing cycle (all fields optional)
 */
export declare const cycleUpdateSchema: z.ZodObject<{
    slug: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    level: z.ZodOptional<z.ZodEnum<["fp_basica", "grado_medio", "grado_superior", "certificado_profesionalidad"]>>;
    order_display: z.ZodOptional<z.ZodDefault<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>>;
}, "strip", z.ZodTypeAny, {
    description?: string | null | undefined;
    name?: string | undefined;
    slug?: string | undefined;
    level?: "grado_medio" | "grado_superior" | "fp_basica" | "certificado_profesionalidad" | undefined;
    order_display?: number | null | undefined;
}, {
    description?: string | null | undefined;
    name?: string | undefined;
    slug?: string | undefined;
    level?: "grado_medio" | "grado_superior" | "fp_basica" | "certificado_profesionalidad" | undefined;
    order_display?: number | null | undefined;
}>;
/**
 * Type inference from schemas
 */
export type CycleData = z.infer<typeof cycleSchema>;
export type CycleCreateData = z.infer<typeof cycleCreateSchema>;
export type CycleUpdateData = z.infer<typeof cycleUpdateSchema>;
/**
 * Validation helper functions
 */
/**
 * Validates cycle data against the schema
 * @param data - The data to validate
 * @returns Validation result with parsed data or errors
 */
export declare function validateCycle(data: unknown): z.SafeParseReturnType<{
    name: string;
    slug: string;
    level: "grado_medio" | "grado_superior" | "fp_basica" | "certificado_profesionalidad";
    description?: string | null | undefined;
    order_display?: number | null | undefined;
}, {
    name: string;
    slug: string;
    level: "grado_medio" | "grado_superior" | "fp_basica" | "certificado_profesionalidad";
    order_display: number | null;
    description?: string | null | undefined;
}>;
/**
 * Validates cycle creation data against the schema
 * @param data - The data to validate
 * @returns Validation result with parsed data or errors
 */
export declare function validateCycleCreate(data: unknown): z.SafeParseReturnType<{
    name: string;
    level: "grado_medio" | "grado_superior" | "fp_basica" | "certificado_profesionalidad";
    description?: string | null | undefined;
    slug?: string | undefined;
    order_display?: number | null | undefined;
}, {
    name: string;
    level: "grado_medio" | "grado_superior" | "fp_basica" | "certificado_profesionalidad";
    order_display: number | null;
    description?: string | null | undefined;
    slug?: string | undefined;
}>;
/**
 * Validates cycle update data against the schema
 * @param data - The data to validate
 * @returns Validation result with parsed data or errors
 */
export declare function validateCycleUpdate(data: unknown): z.SafeParseReturnType<{
    description?: string | null | undefined;
    name?: string | undefined;
    slug?: string | undefined;
    level?: "grado_medio" | "grado_superior" | "fp_basica" | "certificado_profesionalidad" | undefined;
    order_display?: number | null | undefined;
}, {
    description?: string | null | undefined;
    name?: string | undefined;
    slug?: string | undefined;
    level?: "grado_medio" | "grado_superior" | "fp_basica" | "certificado_profesionalidad" | undefined;
    order_display?: number | null | undefined;
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
//# sourceMappingURL=Cycles.validation.d.ts.map