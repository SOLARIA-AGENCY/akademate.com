import { CollectionAfterReadHook } from 'payload';
/**
 * Audit log for lead access (GDPR compliance)
 *
 * Every time a lead record is accessed, we log:
 * - Who accessed it
 * - When it was accessed
 * - From what IP address
 *
 * This is required for GDPR compliance to track access to personal data.
 */
export declare const auditLeadAccess: CollectionAfterReadHook;
//# sourceMappingURL=auditLeadAccess.d.ts.map