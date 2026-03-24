import { createHash } from 'crypto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  clientIpAddress?: string
  clientUserAgent?: string
  fbc?: string
  fbp?: string
}

export interface CustomData {
  content_name?: string
  content_category?: string
  content_ids?: string[]
  content_type?: string
  value?: number
  currency?: string
}

interface MetaEventParams {
  pixelId: string
  accessToken: string
  eventName: string
  eventId: string
  eventSourceUrl: string
  userData: UserData
  customData?: CustomData
  testEventCode?: string
}

interface MetaResult {
  success: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** SHA-256 hex digest after trimming and lowercasing the input. */
function hashValue(raw: string): string {
  return createHash('sha256')
    .update(raw.trim().toLowerCase())
    .digest('hex')
}

/** Strip everything except digits, then hash. */
function hashPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return createHash('sha256').update(digits).digest('hex')
}

/**
 * Build the `user_data` object using Meta's parameter names.
 * PII fields (em, ph, fn, ln, ct, st, zp, country) are hashed.
 * Non-PII fields (client_ip_address, client_user_agent, fbc, fbp) are sent as-is.
 */
function buildUserData(ud: UserData): Record<string, string | undefined> {
  return {
    ...(ud.email && { em: hashValue(ud.email) }),
    ...(ud.phone && { ph: hashPhone(ud.phone) }),
    ...(ud.firstName && { fn: hashValue(ud.firstName) }),
    ...(ud.lastName && { ln: hashValue(ud.lastName) }),
    ...(ud.city && { ct: hashValue(ud.city) }),
    ...(ud.state && { st: hashValue(ud.state) }),
    ...(ud.zipCode && { zp: hashValue(ud.zipCode) }),
    ...(ud.country && { country: hashValue(ud.country) }),
    ...(ud.clientIpAddress && { client_ip_address: ud.clientIpAddress }),
    ...(ud.clientUserAgent && { client_user_agent: ud.clientUserAgent }),
    ...(ud.fbc && { fbc: ud.fbc }),
    ...(ud.fbp && { fbp: ud.fbp }),
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Send a server-side event to Meta's Conversions API.
 *
 * Never throws — always returns `{ success, error? }`.
 */
export async function sendMetaEvent({
  pixelId,
  accessToken,
  eventName,
  eventId,
  eventSourceUrl,
  userData,
  customData,
  testEventCode,
}: MetaEventParams): Promise<MetaResult> {
  const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: eventSourceUrl,
        action_source: 'website' as const,
        user_data: buildUserData(userData),
        ...(customData && { custom_data: customData }),
      },
    ],
    ...(testEventCode && { test_event_code: testEventCode }),
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[meta-capi] HTTP ${res.status}: ${body}`)
      return { success: false, error: `HTTP ${res.status}: ${body}` }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[meta-capi] ${message}`)
    return { success: false, error: message }
  }
}
