import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'
import {
  disconnectTenantPaymentProvider,
  findTenantPaymentProvider,
  upsertTenantPaymentProvider,
} from '@/app/lib/offers/store'
import {
  buildStoredConnection,
  toPublicConnection,
  validateLearnerStripeInput,
} from '@/src/domain/tenant-learner-stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function canManage(role: string | null): boolean {
  return ['admin', 'gestor', 'superadmin'].includes(role ?? '')
}

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload as any)
  if (!auth?.tenantId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const stored = await findTenantPaymentProvider(payload as any, auth.tenantId)
  return NextResponse.json({
    success: true,
    data: toPublicConnection(stored ? { ...stored, tenantId: auth.tenantId } : { tenantId: auth.tenantId, status: 'disconnected', publishableKey: '', secretCiphertext: '', webhookSecretCiphertext: '', secretLast4: '', connectAccountId: '', livemode: false }),
  })
}

export async function PUT(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload as any)
  if (!auth?.tenantId || !canManage(auth.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    publishableKey?: string
    secretKey?: string
    webhookSecret?: string
    connectAccountId?: string
  }
  const errors = validateLearnerStripeInput(body)
  if (errors.length > 0) {
    return NextResponse.json({ success: false, error: errors[0], details: errors }, { status: 400 })
  }

  try {
    const stored = buildStoredConnection(auth.tenantId, body)
    await upsertTenantPaymentProvider(payload as any, stored)
    return NextResponse.json({
      success: true,
      data: toPublicConnection(stored),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar Stripe'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload as any)
  if (!auth?.tenantId || !canManage(auth.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  await disconnectTenantPaymentProvider(payload as any, auth.tenantId)
  return NextResponse.json({
    success: true,
    data: toPublicConnection(null),
  })
}
