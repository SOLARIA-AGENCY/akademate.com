/**
 * @fileoverview Stripe Billing Portal API
 * Creates billing portal sessions for customer self-service
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createBillingPortalSession as createBillingPortalSessionImport,
  isStripeConfigured as isStripeConfiguredImport,
} from '@/@payload-config/lib/stripe'

// ============================================================================
// Types
// ============================================================================

/**
 * Response from Stripe billing portal session creation
 */
interface BillingPortalSession {
  url: string
}

/**
 * Options for creating a billing portal session
 */
interface CreateBillingPortalOptions {
  tenantId: string
  stripeCustomerId: string
  returnUrl: string
}

// Type the imported functions to satisfy ESLint
const isStripeConfigured = isStripeConfiguredImport as () => boolean
const createBillingPortalSession = createBillingPortalSessionImport as (
  options: CreateBillingPortalOptions
) => Promise<BillingPortalSession>

// ============================================================================
// Schemas
// ============================================================================

const CreatePortalSchema = z.object({
  tenantId: z.string().uuid(),
  stripeCustomerId: z.string().min(1),
  returnUrl: z.string().url(),
})

// ============================================================================
// POST /api/billing/portal
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const body: unknown = await request.json()
    const validation = CreatePortalSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { tenantId, stripeCustomerId, returnUrl } = validation.data

    const session = await createBillingPortalSession({
      tenantId,
      returnUrl,
      stripeCustomerId,
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error('Billing portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}
