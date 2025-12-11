import { z } from 'zod';
/**
 * Leads Collection - Validation Schemas
 *
 * This file contains Zod schemas for validating lead data with GDPR compliance.
 *
 * Key validations:
 * - Spanish phone format: +34 XXX XXX XXX
 * - Email RFC 5322 compliance
 * - GDPR consent MUST be true (not just truthy)
 * - Privacy policy acceptance MUST be true
 * - Status, priority, and contact method enums
 * - Lead score range: 0-100
 * - Field length constraints
 */
/**
 * Spanish phone format: +34 XXX XXX XXX
 * Examples:
 * - +34 612 345 678 ✅
 * - +34 623 456 789 ✅
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
 * Lead status enum
 */
export declare const statusSchema: z.ZodEnum<["new", "contacted", "qualified", "converted", "rejected", "spam"]>;
/**
 * Priority enum
 */
export declare const prioritySchema: z.ZodEnum<["low", "medium", "high", "urgent"]>;
/**
 * Preferred contact method enum
 */
export declare const contactMethodSchema: z.ZodEnum<["email", "phone", "whatsapp"]>;
/**
 * Preferred contact time enum
 */
export declare const contactTimeSchema: z.ZodEnum<["morning", "afternoon", "evening", "anytime"]>;
/**
 * Lead score validation: 0-100
 */
export declare const leadScoreSchema: z.ZodNumber;
export declare const uuidSchema: z.ZodString;
/**
 * Complete Lead validation schema
 *
 * Required fields:
 * - first_name, last_name, email, phone (PII)
 * - gdpr_consent = true (MANDATORY)
 * - privacy_policy_accepted = true (MANDATORY)
 *
 * Optional fields:
 * - course, campus, campaign (relationships)
 * - message, notes (text fields)
 * - preferred_contact_method, preferred_contact_time
 * - marketing_consent (OPTIONAL, defaults to false)
 * - status, priority, assigned_to
 * - utm_* (tracking parameters)
 * - lead_score
 */
export declare const LeadSchema: z.ZodObject<{
    first_name: z.ZodString;
    last_name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    gdpr_consent: z.ZodLiteral<true>;
    privacy_policy_accepted: z.ZodLiteral<true>;
    marketing_consent: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    course: z.ZodOptional<z.ZodString>;
    campus: z.ZodOptional<z.ZodString>;
    campaign: z.ZodOptional<z.ZodString>;
    assigned_to: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    preferred_contact_method: z.ZodOptional<z.ZodEnum<["email", "phone", "whatsapp"]>>;
    preferred_contact_time: z.ZodOptional<z.ZodEnum<["morning", "afternoon", "evening", "anytime"]>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["new", "contacted", "qualified", "converted", "rejected", "spam"]>>>;
    priority: z.ZodDefault<z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>>;
    lead_score: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    utm_source: z.ZodOptional<z.ZodString>;
    utm_medium: z.ZodOptional<z.ZodString>;
    utm_campaign: z.ZodOptional<z.ZodString>;
    utm_term: z.ZodOptional<z.ZodString>;
    utm_content: z.ZodOptional<z.ZodString>;
    mailchimp_subscriber_id: z.ZodOptional<z.ZodString>;
    whatsapp_contact_id: z.ZodOptional<z.ZodString>;
    consent_timestamp: z.ZodOptional<z.ZodString>;
    consent_ip_address: z.ZodOptional<z.ZodString>;
    last_contacted_at: z.ZodOptional<z.ZodString>;
    converted_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "new" | "contacted" | "qualified" | "converted" | "rejected" | "spam";
    email: string;
    priority: "low" | "medium" | "high" | "urgent";
    phone: string;
    first_name: string;
    last_name: string;
    gdpr_consent: true;
    privacy_policy_accepted: true;
    marketing_consent: boolean;
    lead_score: number;
    course?: string | undefined;
    message?: string | undefined;
    notes?: string | undefined;
    campus?: string | undefined;
    utm_source?: string | undefined;
    utm_medium?: string | undefined;
    utm_campaign?: string | undefined;
    utm_term?: string | undefined;
    utm_content?: string | undefined;
    campaign?: string | undefined;
    preferred_contact_method?: "email" | "phone" | "whatsapp" | undefined;
    preferred_contact_time?: "morning" | "afternoon" | "evening" | "anytime" | undefined;
    consent_timestamp?: string | undefined;
    consent_ip_address?: string | undefined;
    assigned_to?: string | undefined;
    mailchimp_subscriber_id?: string | undefined;
    whatsapp_contact_id?: string | undefined;
    last_contacted_at?: string | undefined;
    converted_at?: string | undefined;
}, {
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    gdpr_consent: true;
    privacy_policy_accepted: true;
    status?: "new" | "contacted" | "qualified" | "converted" | "rejected" | "spam" | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    course?: string | undefined;
    message?: string | undefined;
    notes?: string | undefined;
    campus?: string | undefined;
    utm_source?: string | undefined;
    utm_medium?: string | undefined;
    utm_campaign?: string | undefined;
    utm_term?: string | undefined;
    utm_content?: string | undefined;
    campaign?: string | undefined;
    preferred_contact_method?: "email" | "phone" | "whatsapp" | undefined;
    preferred_contact_time?: "morning" | "afternoon" | "evening" | "anytime" | undefined;
    marketing_consent?: boolean | undefined;
    consent_timestamp?: string | undefined;
    consent_ip_address?: string | undefined;
    assigned_to?: string | undefined;
    mailchimp_subscriber_id?: string | undefined;
    whatsapp_contact_id?: string | undefined;
    lead_score?: number | undefined;
    last_contacted_at?: string | undefined;
    converted_at?: string | undefined;
}>;
/**
 * Type inference from schema
 */
export type LeadInput = z.infer<typeof LeadSchema>;
/**
 * Validation helper function
 *
 * @param data - Raw data to validate
 * @returns Validated lead data
 * @throws ZodError if validation fails
 */
export declare const validateLeadData: (data: unknown) => LeadInput;
/**
 * Safe validation helper (returns result object)
 *
 * @param data - Raw data to validate
 * @returns { success: boolean, data?: LeadInput, error?: ZodError }
 */
export declare const safeValidateLeadData: (data: unknown) => z.SafeParseReturnType<{
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    gdpr_consent: true;
    privacy_policy_accepted: true;
    status?: "new" | "contacted" | "qualified" | "converted" | "rejected" | "spam" | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    course?: string | undefined;
    message?: string | undefined;
    notes?: string | undefined;
    campus?: string | undefined;
    utm_source?: string | undefined;
    utm_medium?: string | undefined;
    utm_campaign?: string | undefined;
    utm_term?: string | undefined;
    utm_content?: string | undefined;
    campaign?: string | undefined;
    preferred_contact_method?: "email" | "phone" | "whatsapp" | undefined;
    preferred_contact_time?: "morning" | "afternoon" | "evening" | "anytime" | undefined;
    marketing_consent?: boolean | undefined;
    consent_timestamp?: string | undefined;
    consent_ip_address?: string | undefined;
    assigned_to?: string | undefined;
    mailchimp_subscriber_id?: string | undefined;
    whatsapp_contact_id?: string | undefined;
    lead_score?: number | undefined;
    last_contacted_at?: string | undefined;
    converted_at?: string | undefined;
}, {
    status: "new" | "contacted" | "qualified" | "converted" | "rejected" | "spam";
    email: string;
    priority: "low" | "medium" | "high" | "urgent";
    phone: string;
    first_name: string;
    last_name: string;
    gdpr_consent: true;
    privacy_policy_accepted: true;
    marketing_consent: boolean;
    lead_score: number;
    course?: string | undefined;
    message?: string | undefined;
    notes?: string | undefined;
    campus?: string | undefined;
    utm_source?: string | undefined;
    utm_medium?: string | undefined;
    utm_campaign?: string | undefined;
    utm_term?: string | undefined;
    utm_content?: string | undefined;
    campaign?: string | undefined;
    preferred_contact_method?: "email" | "phone" | "whatsapp" | undefined;
    preferred_contact_time?: "morning" | "afternoon" | "evening" | "anytime" | undefined;
    consent_timestamp?: string | undefined;
    consent_ip_address?: string | undefined;
    assigned_to?: string | undefined;
    mailchimp_subscriber_id?: string | undefined;
    whatsapp_contact_id?: string | undefined;
    last_contacted_at?: string | undefined;
    converted_at?: string | undefined;
}>;
/**
 * Partial schema for updates (all fields optional except IDs)
 */
export declare const LeadUpdateSchema: z.ZodObject<{
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    marketing_consent: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    course: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    campus: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    campaign: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    assigned_to: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    message: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    preferred_contact_method: z.ZodOptional<z.ZodOptional<z.ZodEnum<["email", "phone", "whatsapp"]>>>;
    preferred_contact_time: z.ZodOptional<z.ZodOptional<z.ZodEnum<["morning", "afternoon", "evening", "anytime"]>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodEnum<["new", "contacted", "qualified", "converted", "rejected", "spam"]>>>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>>>;
    lead_score: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodNumber>>>;
    utm_source: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    utm_medium: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    utm_campaign: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    utm_term: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    utm_content: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    mailchimp_subscriber_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    whatsapp_contact_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    consent_timestamp: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    consent_ip_address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    last_contacted_at: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    converted_at: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    gdpr_consent: z.ZodOptional<z.ZodLiteral<true>>;
    privacy_policy_accepted: z.ZodOptional<z.ZodLiteral<true>>;
}, "strip", z.ZodTypeAny, {
    status?: "new" | "contacted" | "qualified" | "converted" | "rejected" | "spam" | undefined;
    email?: string | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    course?: string | undefined;
    message?: string | undefined;
    phone?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    notes?: string | undefined;
    campus?: string | undefined;
    utm_source?: string | undefined;
    utm_medium?: string | undefined;
    utm_campaign?: string | undefined;
    utm_term?: string | undefined;
    utm_content?: string | undefined;
    campaign?: string | undefined;
    preferred_contact_method?: "email" | "phone" | "whatsapp" | undefined;
    preferred_contact_time?: "morning" | "afternoon" | "evening" | "anytime" | undefined;
    gdpr_consent?: true | undefined;
    privacy_policy_accepted?: true | undefined;
    marketing_consent?: boolean | undefined;
    consent_timestamp?: string | undefined;
    consent_ip_address?: string | undefined;
    assigned_to?: string | undefined;
    mailchimp_subscriber_id?: string | undefined;
    whatsapp_contact_id?: string | undefined;
    lead_score?: number | undefined;
    last_contacted_at?: string | undefined;
    converted_at?: string | undefined;
}, {
    status?: "new" | "contacted" | "qualified" | "converted" | "rejected" | "spam" | undefined;
    email?: string | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    course?: string | undefined;
    message?: string | undefined;
    phone?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    notes?: string | undefined;
    campus?: string | undefined;
    utm_source?: string | undefined;
    utm_medium?: string | undefined;
    utm_campaign?: string | undefined;
    utm_term?: string | undefined;
    utm_content?: string | undefined;
    campaign?: string | undefined;
    preferred_contact_method?: "email" | "phone" | "whatsapp" | undefined;
    preferred_contact_time?: "morning" | "afternoon" | "evening" | "anytime" | undefined;
    gdpr_consent?: true | undefined;
    privacy_policy_accepted?: true | undefined;
    marketing_consent?: boolean | undefined;
    consent_timestamp?: string | undefined;
    consent_ip_address?: string | undefined;
    assigned_to?: string | undefined;
    mailchimp_subscriber_id?: string | undefined;
    whatsapp_contact_id?: string | undefined;
    lead_score?: number | undefined;
    last_contacted_at?: string | undefined;
    converted_at?: string | undefined;
}>;
export type LeadUpdateInput = z.infer<typeof LeadUpdateSchema>;
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
//# sourceMappingURL=Leads.validation.d.ts.map