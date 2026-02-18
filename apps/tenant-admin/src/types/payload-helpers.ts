/**
 * Payload CMS Helper Types
 *
 * Provides proper TypeScript types for patterns where Payload's
 * built-in types don't match runtime behavior. These replace
 * untyped casts with specific, descriptive type assertions.
 *
 * Categories:
 * - PayloadLogger: Logger interface (pino-based)
 * - FieldHookConfig: Field-level hook wrapper objects
 * - Request helpers: IP and header access types
 * - Validator helpers: Validator function with context
 */

import type { FieldHook } from 'payload';

/**
 * Logger interface matching Payload's pino-based logger.
 * Used instead of untyped casts when accessing `req.payload.logger`.
 */
export interface PayloadLogger {
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
  debug(msg: string, meta?: Record<string, unknown>): void;
}

/**
 * Field hook wrapper object used in field-level beforeChange hooks.
 * Payload field hooks can accept { hook, fieldName } objects in some versions.
 */
export interface FieldHookConfig {
  hook: FieldHook;
  fieldName?: string;
  [key: string]: unknown;
}

/**
 * Extended request type with IP address.
 * Available at runtime on Express/Node requests but not typed in Payload 3.x.
 */
export interface RequestWithIP {
  ip?: string;
}

/**
 * Headers accessor that supports both plain object and Headers API (get method).
 * Payload 3.x uses Web-standard Headers in some contexts.
 */
export interface PayloadRequestHeaders {
  [key: string]: string | string[] | undefined;
  get?: (name: string) => string | null | undefined;
}

/**
 * Validator function type with operation context.
 * Payload validators receive (value, { operation, originalDoc, ... }) at runtime,
 * but the built-in types are more restrictive.
 */
export type PayloadValidatorWithContext<T = unknown> = (
  value: T,
  context: { operation?: string; originalDoc?: Record<string, unknown>; [key: string]: unknown }
) => true | string | Promise<true | string>;

/**
 * Audit log data shape for creating audit-logs entries.
 */
export interface AuditLogCreateData {
  entity_type: string;
  entity_id: string | number;
  action: string;
  user_id?: string | number;
  ip_address?: string;
  changes?: unknown;
}
