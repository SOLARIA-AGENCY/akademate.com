import { createHash, randomBytes } from 'crypto'
import type { Payload } from 'payload'

// ============================================================================
// Types
// ============================================================================

export type ApiScope =
  | 'courses:read'
  | 'courses:write'
  | 'students:read'
  | 'students:write'
  | 'enrollments:read'
  | 'enrollments:write'
  | 'analytics:read'
  | 'keys:manage'

export interface ValidatedApiKey {
  valid: true
  tenantId: string
  scopes: ApiScope[]
  keyId: string
}

export type ApiKeyValidationResult = ValidatedApiKey | null

// ============================================================================
// Core utilities
// ============================================================================

/**
 * Hash a plaintext API key using SHA-256 (hex).
 * Used both when storing a new key and when validating an incoming token.
 */
export function hashApiKey(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex')
}

/**
 * Generate a cryptographically secure random API key.
 * Format: 64-character hex string (32 random bytes).
 * The prefix "ak_" helps developers recognise the token type.
 */
export function generateApiKey(): string {
  return `ak_${randomBytes(32).toString('hex')}`
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate a Bearer token against the ApiKeys collection in Payload CMS.
 *
 * Flow:
 *  1. Hash the incoming token (SHA-256 hex)
 *  2. Query api-keys collection for matching key_hash
 *  3. Check is_active === true
 *  4. Update last_used_at asynchronously (fire-and-forget)
 *  5. Return tenantId + scopes on success, null on failure
 *
 * IMPORTANT: This function must only be called from Node.js route handlers,
 * NOT from Edge middleware (crypto and Payload DB are not edge-safe).
 */
export async function validateBearerToken(
  token: string,
  getPayload: () => Promise<Payload>
): Promise<ApiKeyValidationResult> {
  if (!token || typeof token !== 'string') return null

  try {
    const hash = hashApiKey(token)
    const payload = await getPayload()

    const result = await payload.find({
      collection: 'api-keys',
      where: {
        key_hash: {
          equals: hash,
        },
        is_active: {
          equals: true,
        },
      },
      limit: 1,
      depth: 1, // Populate tenant relation to get tenantId
    })

    if (!result.docs || result.docs.length === 0) {
      return null
    }

    const apiKey = result.docs[0]

    // Extract tenantId from the relation (may be populated object or raw id)
    const tenantId =
      typeof apiKey.tenant === 'object' && apiKey.tenant !== null
        ? String((apiKey.tenant as { id: string | number }).id)
        : String(apiKey.tenant)

    // Extract scopes from the array field
    const scopes: ApiScope[] = Array.isArray(apiKey.scopes)
      ? (apiKey.scopes as Array<{ scope: ApiScope }>)
          .map((s) => s.scope)
          .filter(Boolean)
      : []

    // Fire-and-forget: update last_used_at without blocking the request
    payload
      .update({
        collection: 'api-keys',
        id: String(apiKey.id),
        data: { last_used_at: new Date().toISOString() },
      })
      .catch((err) => {
        console.warn('[apiKeyAuth] Failed to update last_used_at:', err)
      })

    return {
      valid: true,
      tenantId,
      scopes,
      keyId: String(apiKey.id),
    }
  } catch (err) {
    console.error('[apiKeyAuth] validateBearerToken error:', err)
    return null
  }
}
