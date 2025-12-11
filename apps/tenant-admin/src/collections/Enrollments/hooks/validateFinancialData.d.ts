import type { CollectionBeforeValidateHook } from 'payload';
/**
 * Hook: validateFinancialData
 *
 * Validates and auto-calculates financial data for enrollments.
 *
 * Validations:
 * 1. amount_paid must be >= 0
 * 2. total_amount must be >= 0
 * 3. amount_paid must be <= total_amount
 * 4. financial_aid_amount must be >= 0
 * 5. financial_aid_amount must be <= total_amount
 * 6. If financial_aid_applied is true, financial_aid_status is required
 *
 * Auto-calculations:
 * - payment_status: Automatically set based on amount_paid vs total_amount
 *   - pending: amount_paid = 0
 *   - partial: 0 < amount_paid < total_amount
 *   - paid: amount_paid >= total_amount
 *
 * Runs: beforeValidate
 *
 * Security Considerations:
 * - Financial data is sensitive - validate strictly
 * - Auto-calculate payment_status to prevent manipulation
 * - Prevent negative amounts (potential fraud)
 */
export declare const validateFinancialData: CollectionBeforeValidateHook;
//# sourceMappingURL=validateFinancialData.d.ts.map