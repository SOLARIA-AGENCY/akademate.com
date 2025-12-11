/**
 * Staff Collection - Hooks
 *
 * This module exports all hooks for the Staff collection.
 *
 * Hook execution order:
 * 1. beforeValidate: (none currently)
 * 2. validate: Payload's built-in validation
 * 3. beforeChange: trackStaffCreator
 * 4. afterChange: (none currently)
 * 5. afterRead: (none currently)
 *
 * Data Integrity:
 * - trackStaffCreator: Auto-populates and protects created_by field
 *
 * Security:
 * - All hooks implement error handling to prevent data corruption
 * - Immutable fields (created_by) are protected
 * - No PII is logged in console.log statements
 */

export { trackStaffCreator } from './trackStaffCreator';
