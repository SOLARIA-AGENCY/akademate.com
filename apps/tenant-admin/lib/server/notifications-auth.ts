import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createPayloadIdentityResolver } from './payload-principal'
import { verifyAvailableSession, type VerifiedPrincipal } from './session'

export type AuthenticatedNotifications = {
  payload: Awaited<ReturnType<typeof getPayload>>
  principal: VerifiedPrincipal
}

export async function resolveNotificationsPrincipal(
  request: NextRequest,
): Promise<AuthenticatedNotifications | null> {
  const payload = await getPayload({ config: configPromise })
  const verified = await verifyAvailableSession(
    {
      payloadToken: request.cookies.get('payload-token')?.value,
      sessionV2: request.cookies.get('akademate_session_v2')?.value,
    },
    {
      resolveIdentity: createPayloadIdentityResolver(payload),
      requireResolvedIdentity: true,
    },
  )
  return verified ? { payload, principal: verified.principal } : null
}
