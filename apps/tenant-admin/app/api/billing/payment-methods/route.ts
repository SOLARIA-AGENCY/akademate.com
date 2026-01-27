/**
 * @fileoverview Payment Methods Management API
 * List, add, and manage payment methods
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  listPaymentMethods,
  attachPaymentMethod,
  setDefaultPaymentMethod,
  isStripeConfigured,
} from '@/@payload-config/lib/stripe'

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
// GET /api/billing/payment-methods
// ============================================================================

export async function GET(request: NextRequest) {
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
      paymentMethods: methods.map(method => ({
        id: method.id,
        type: method.type,
        card: method.card ? {
          brand: method.card.brand,
          last4: method.card.last4,
          expMonth: method.card.exp_month,
          expYear: method.card.exp_year,
          funding: method.card.funding,
        } : null,
        billingDetails: {
          name: method.billing_details.name,
          email: method.billing_details.email,
          phone: method.billing_details.phone,
          address: method.billing_details.address,
        },
        created: new Date(method.created * 1000),
      })),
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

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
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

    return NextResponse.json({
      id: method.id,
      type: method.type,
      card: method.card ? {
        brand: method.card.brand,
        last4: method.card.last4,
        expMonth: method.card.exp_month,
        expYear: method.card.exp_year,
      } : null,
      isDefault: setAsDefault,
    }, { status: 201 })
  } catch (error) {
    console.error('Attach payment method error:', error)
    return NextResponse.json(
      { error: 'Failed to attach payment method' },
      { status: 500 }
    )
  }
}
