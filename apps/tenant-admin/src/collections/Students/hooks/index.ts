/**
 * Students Collection - Hooks
 *
 * This module exports all hooks for the Students collection.
 *
 * Hook Execution Order:
 * 1. beforeValidate:
 *    - captureStudentConsentMetadata (capture GDPR consent timestamp/IP)
 *    - validateStudentData (validate email, phone, DNI, age)
 *    - validateStudentRelationships (check created_by user exists)
 *
 * 2. beforeChange:
 *    - trackStudentCreator (auto-populate and protect created_by field)
 *
 * Security Patterns Applied:
 * - SP-001: Immutable Fields (created_by protection)
 * - SP-002: GDPR Critical Fields (consent metadata capture)
 * - SP-004: PII Data Handling (NO logging of PII in any hook)
 *
 * All hooks follow these principles:
 * - NO logging of PII (email, phone, DNI, names, IP addresses)
 * - Only log non-PII identifiers (IDs, boolean flags, operation types)
 * - Descriptive error messages without exposing system internals
 * - Early validation to catch issues before database write
 */

export { captureStudentConsentMetadata } from './captureStudentConsentMetadata';
export { validateStudentData } from './validateStudentData';
export { validateStudentRelationships } from './validateStudentRelationships';
export { trackStudentCreator } from './trackStudentCreator';
