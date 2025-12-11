import type { CollectionBeforeValidateHook } from 'payload';
import { validateFinancialAmounts, calculatePaymentStatus } from '../Enrollments.validation';

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
export const validateFinancialData: CollectionBeforeValidateHook = async ({
  data,
  req,
}) => {
  if (!data) {
    return data;
  }

  // Validate financial amounts
  const validation = validateFinancialAmounts({
    total_amount: data.total_amount || 0,
    amount_paid: data.amount_paid || 0,
    financial_aid_amount: data.financial_aid_amount,
  });

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Validate financial aid logic
  if (data.financial_aid_applied && !data.financial_aid_status) {
    throw new Error('Financial aid status is required when financial aid is applied');
  }

  // Auto-calculate payment_status based on amounts
  if (data.total_amount !== undefined && data.amount_paid !== undefined) {
    const calculatedStatus = calculatePaymentStatus(data.amount_paid, data.total_amount);
    data.payment_status = calculatedStatus;
  }

  return data;
};
