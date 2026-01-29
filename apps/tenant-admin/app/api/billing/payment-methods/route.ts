/**
 * @fileoverview Payment Methods Management API
 * List, add, and manage payment methods
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type Stripe from 'stripe'
import {
  listPaymentMethods as listPaymentMethodsImport,
  attachPaymentMethod as attachPaymentMethodImport,
  setDefaultPaymentMethod as setDefaultPaymentMethodImport,
  isStripeConfigured as isStripeConfiguredImport,
} from '@/@payload-config/lib/stripe'

// Type-safe wrappers for imported Stripe functions (path alias requires explicit casting)
const isStripeConfigured = isStripeConfiguredImport as () => boolean
const listPaymentMethods = listPaymentMethodsImport as (customerId: string) => Promise<Stripe.PaymentMethod[]>
const attachPaymentMethod = attachPaymentMethodImport as (paymentMethodId: string, customerId: string) => Promise<Stripe.PaymentMethod>
const setDefaultPaymentMethod = setDefaultPaymentMethodImport as (customerId: string, paymentMethodId: string) => Promise<Stripe.Customer>

// ============================================================================
// Types & Interfaces
// ============================================================================

/** Card details for payment method response */
interface CardDetails {
  brand: string
  last4: string
  expMonth: number
  expYear: number
  funding?: string
}

/** Billing details for payment method response */
interface BillingDetails {
  name: string | null
  email: string | null
  phone: string | null
  address: Stripe.Address | null
}

/** Payment method response format */
interface PaymentMethodResponse {
  id: string
  type: string
  card: CardDetails | null
  billingDetails: BillingDetails
  created: Date
}

/** Attach payment method response format */
interface AttachPaymentMethodResponse {
  id: string
  type: string
  card: CardDetails | null
  isDefault: boolean
}

// ============================================================================
// Schemas
// ============================================================================

const ListPaymentMethodsSchema = z.object({
  customerId: z.string().min(1),
})

const AttachPaymentMethodSchema = z.object({
  customerId: z.string().min(1),
  paymentMethodId: z.string().min(1),
  setAsDefault: z.boolean().optional().default(false),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extracts card details from a Stripe payment method
 */
function extractCardDetails(method: Stripe.PaymentMethod): CardDetails | null {
  if (!method.card) {
    return null
  }
  return {
    brand: method.card.brand,
    last4: method.card.last4,
    expMonth: method.card.exp_month,
    expYear: method.card.exp_year,
    funding: method.card.funding ?? undefined,
  }
}

/**
 * Transforms a Stripe payment method to our API response format
 */
function transformPaymentMethod(method: Stripe.PaymentMethod): PaymentMethodResponse {
  return {
    id: method.id,
    type: method.type,
    card: extractCardDetails(method),
    billingDetails: {
      name: method.billing_details.name,
      email: method.billing_details.email,
      phone: method.billing_details.phone,
      address: method.billing_details.address,
    },
    created: new Date(method.created * 1000),
  }
}

// ============================================================================
// GET /api/billing/payment-methods
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    const validation = ListPaymentMethodsSchema.safeParse({ customerId })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const methods = await listPaymentMethods(validation.data.customerId)

    return NextResponse.json({
      paymentMethods: methods.map(transformPaymentMethod),
    })
  } catch (error) {
    console.error('List payment methods error:', error)
    return NextResponse.json(
      { error: 'Failed to list payment methods' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/billing/payment-methods
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const body: unknown = await request.json()
    const validation = AttachPaymentMethodSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { customerId, paymentMethodId, setAsDefault } = validation.data

    // Attach payment method to customer
    const method = await attachPaymentMethod(paymentMethodId, customerId)

    // Set as default if requested
    if (setAsDefault) {
      await setDefaultPaymentMethod(customerId, paymentMethodId)
    }

    const response: AttachPaymentMethodResponse = {
      id: method.id,
      type: method.type,
      card: extractCardDetails(method),
      isDefault: setAsDefault ?? false,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Attach payment method error:', error)
    return NextResponse.json(
      { error: 'Failed to attach payment method' },
      { status: 500 }
    )
  }
}
