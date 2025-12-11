import { CollectionAfterChangeHook } from 'payload';
/**
 * Trigger events when a new lead is created
 *
 * This hook:
 * 1. Sends notification to marketing team
 * 2. Triggers lead scoring workflow
 * 3. Adds lead to CRM queue (if integration enabled)
 * 4. Creates initial lead activity entry
 */
export declare const triggerLeadCreated: CollectionAfterChangeHook;
//# sourceMappingURL=triggerLeadCreated.d.ts.map