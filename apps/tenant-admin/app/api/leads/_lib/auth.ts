import type { NextRequest } from 'next/server'
import { SESSION_V2_COOKIE, verifyAvailableSession } from '@/lib/server/session'
import { createPayloadIdentityResolver } from '@/lib/server/payload-principal'

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

export async function getAuthenticatedUserContext(
  request: NextRequest,
  payload: any,
): Promise<{ userId: string | number; tenantId: number | null } | null> {
  const verified = await verifyAvailableSession(
    {
      payloadToken: request.cookies.get('payload-token')?.value,
      sessionV2: request.cookies.get(SESSION_V2_COOKIE)?.value,
    },
    {
      resolveIdentity: createPayloadIdentityResolver(payload),
      requireResolvedIdentity: true,
    },
  )
  if (!verified) return null
  return {
    userId: verified.principal.userId,
    tenantId: toPositiveInt(verified.principal.tenantId),
  }
}
