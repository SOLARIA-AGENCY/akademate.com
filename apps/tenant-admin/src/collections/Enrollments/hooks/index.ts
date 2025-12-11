/**
 * Enrollments Collection - Hooks
 *
 * This module exports all hooks for the Enrollments collection.
 *
 * Hook Execution Order:
 *
 * beforeValidate (runs before Payload's validation):
 * 1. validateEnrollmentRelationships - Validates student and course_run exist
 * 2. validateEnrollmentCapacity - Checks capacity and sets waitlisted if full
 * 3. validateFinancialData - Validates financial amounts and auto-calculates payment_status
 *
 * beforeChange (runs after validation, before database write):
 * 4. trackEnrollmentCreator - Auto-populates and protects created_by field
 * 5. captureEnrollmentTimestamps - Auto-captures lifecycle timestamps (enrolled_at, etc.)
 *
 * afterChange (runs after successful database write):
 * 6. updateCourseRunEnrollmentCount - Updates course_run.current_enrollments
 *
 * Security Patterns Applied:
 * - SP-001: Immutable fields with defense in depth (created_by, timestamps)
 * - SP-004: No PII in logs (use IDs only)
 * - Financial data validation and auto-calculation
 * - Relationship integrity validation
 */

export { validateEnrollmentRelationships } from './validateEnrollmentRelationships';
export { validateEnrollmentCapacity } from './validateEnrollmentCapacity';
export { trackEnrollmentCreator } from './trackEnrollmentCreator';
export { captureEnrollmentTimestamps } from './captureEnrollmentTimestamps';
export { validateFinancialData } from './validateFinancialData';
export { updateCourseRunEnrollmentCount } from './updateCourseRunEnrollmentCount';
