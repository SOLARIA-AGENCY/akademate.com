/**
 * Media Collection - Hooks
 *
 * Security Patterns Applied:
 * - SP-001: Immutable created_by field (trackMediaCreator)
 * - SP-004: No PII/file content logging (all hooks)
 *
 * Validation Hooks:
 * - validateMediaFile: File type, size, extension validation
 * - validateFolder: Folder path sanitization and validation
 * - trackMediaCreator: Auto-populate and protect created_by field
 *
 * Execution Order:
 * 1. Field validators (Payload + Zod)
 * 2. beforeChange hooks (these hooks)
 * 3. Database write
 * 4. afterChange hooks (if any)
 */

export { trackMediaCreator } from './trackMediaCreator';
export { validateMediaFile } from './validateMediaFile';
export { validateFolder } from './validateFolder';
