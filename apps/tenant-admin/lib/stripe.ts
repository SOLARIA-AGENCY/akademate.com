/**
 * Stripe Integration Module (Stub)
 *
 * This module will be implemented when billing features are enabled.
 * For now, it provides type-safe stubs to prevent TypeScript errors.
 *
 * @see https://stripe.com/docs/api
 */

// Stripe instance placeholder
export const stripe = null as any;

// Common Stripe types (stubs)
export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid';
  current_period_end: number;
  current_period_start: number;
}

export interface StripeInvoice {
  id: string;
  customer: string;
  amount_due: number;
  amount_paid: number;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
}

export interface StripePaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer' | 'sepa_debit';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

// Helper functions (stubs - throw not implemented)
export async function createCustomer(_email: string, _metadata?: Record<string, string>): Promise<StripeCustomer> {
  throw new Error('Stripe integration not configured. Set STRIPE_SECRET_KEY environment variable.');
}

export async function createCheckoutSession(_customerId: string, _priceId: string): Promise<{ url: string }> {
  throw new Error('Stripe integration not configured. Set STRIPE_SECRET_KEY environment variable.');
}

export async function createBillingPortalSession(_customerId: string): Promise<{ url: string }> {
  throw new Error('Stripe integration not configured. Set STRIPE_SECRET_KEY environment variable.');
}

export async function getSubscriptions(_customerId: string): Promise<StripeSubscription[]> {
  throw new Error('Stripe integration not configured. Set STRIPE_SECRET_KEY environment variable.');
}

export async function cancelSubscription(_subscriptionId: string): Promise<StripeSubscription> {
  throw new Error('Stripe integration not configured. Set STRIPE_SECRET_KEY environment variable.');
}

export async function getInvoices(_customerId: string): Promise<StripeInvoice[]> {
  throw new Error('Stripe integration not configured. Set STRIPE_SECRET_KEY environment variable.');
}

export async function getPaymentMethods(_customerId: string): Promise<StripePaymentMethod[]> {
  throw new Error('Stripe integration not configured. Set STRIPE_SECRET_KEY environment variable.');
}

export default stripe;
