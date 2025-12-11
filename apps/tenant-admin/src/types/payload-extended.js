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
/**
 * Type-safe validator wrapper
 * Casts validator functions to a type that Payload accepts
 *
 * This is necessary because Payload's validator types are overly restrictive
 * and don't properly account for the flexible validator signatures that
 * Payload actually accepts at runtime.
 */
export const validator = (fn) => fn;
//# sourceMappingURL=payload-extended.js.map