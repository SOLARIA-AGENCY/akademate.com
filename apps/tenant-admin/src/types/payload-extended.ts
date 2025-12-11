/**
 * Extended Payload Types
 *
 * Extends Payload CMS types to include Express server access
 * required for API testing with supertest, and other type augmentations
 * to match runtime behavior in Payload CMS 3.x.
 *
 * This file bridges the gap between Payload's TypeScript definitions
 * and its actual runtime API.
 */

import type { Express } from 'express';
import type { Payload } from 'payload';

declare module 'payload' {
  /**
   * Extends BasePayload with Express server
   */
  interface BasePayload {
    /**
     * Express application instance
     *
     * Used in tests for supertest API testing.
     * Available at runtime but not typed in Payload 3.x.
     */
    express: Express;
  }
}

/**
 * Type-safe Payload instance with Express access
 */
export type PayloadWithExpress = Payload & {
  express: Express;
};

/**
 * Validation function type - matches Payload's validator signature
 * Can accept value and optional context with operation, originalDoc, etc.
 */
export type ValidationFunction<T = unknown> = (
  value: T,
  context?: { operation?: string; originalDoc?: unknown; [key: string]: unknown }
) => true | string | Promise<true | string>;

/**
 * Type-safe validator wrapper
 * Casts validator functions to a type that Payload accepts
 *
 * This is necessary because Payload's validator types are overly restrictive
 * and don't properly account for the flexible validator signatures that
 * Payload actually accepts at runtime.
 */
export const validator = <T>(fn: ValidationFunction<T>) => fn as never;
