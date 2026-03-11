import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { validateBearerToken } from './apiKeyAuth'
import type { ApiScope, ValidatedApiKey } from './apiKeyAuth'

// ============================================================================
// Types
// ============================================================================

export type { ApiScope, ValidatedApiKey }

export type V1AuthResult =
  | { ok: true; auth: ValidatedApiKey }
  | { ok: false; response: NextResponse }

// ============================================================================
// Helper
// ============================================================================

/**
 * Authenticate an incoming /api/v1/* request.
 *
 * Flow:
 *  1. Read the `x-api-bearer-token` header (set by middleware after extraction)
 *     OR fall back to raw `Authorization: Bearer <token>` header.
 *  2. Delegate to validateBearerToken from apiKeyAuth.
 *  3. Verify that `requiredScope` is present in the key's scopes.
 *  4. Return { ok: true, auth } on success or { ok: false, response } on failure.
 *
 * Pass `requiredScope: null` to accept any valid key without scope checking.
 */
export async function requireV1Auth(
  request: Request,
  requiredScope: ApiScope | null,
): Promise<V1AuthResult> {
  // The middleware forwards the raw token via a custom header to avoid
  // re-parsing Authorization inside edge routes. We support both paths.
  const headerToken =
    request.headers.get('x-api-bearer-token') ??
    (() => {
      const auth = request.headers.get('authorization') ?? ''
      return auth.startsWith('Bearer ') ? auth.slice(7) : null
    })()

  if (!headerToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Missing API key', code: 'MISSING_API_KEY' },
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    }
  }

  const validated = await validateBearerToken(headerToken, () =>
    getPayloadHMR({ config: configPromise }),
  )

  if (!validated) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid or inactive API key', code: 'INVALID_API_KEY' },
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    }
  }

  if (requiredScope !== null && !validated.scopes.includes(requiredScope)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `Insufficient permissions. Required scope: ${requiredScope}`,
          code: 'FORBIDDEN',
        },
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      ),
    }
  }

  return { ok: true, auth: validated }
}
