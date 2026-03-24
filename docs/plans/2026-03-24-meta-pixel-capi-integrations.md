# Meta Pixel + Conversions API + Panel Integraciones — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Install Meta Pixel + Conversions API on cepformacion.akademate.com public pages, create server-side CAPI endpoint, and add Integrations section to the config panel.

**Architecture:** Tenant-level config stores all tracking IDs (Pixel, CAPI token, GA4, GTM). Public layout reads tenant config and injects client-side scripts. A shared `lib/meta-capi.ts` utility sends server-side events to Meta Graph API. The existing `/api/track` endpoint is extended to fire CAPI events alongside lead creation. The config UI gets a new "Integraciones" section.

**Tech Stack:** Next.js App Router, Payload CMS (Tenants collection), Meta Graph API v21.0, SHA-256 hashing for PII, React (shadcn/ui components)

**Key IDs (from memory — do NOT hardcode, read from tenant config):**
- Pixel ID: `1189071876088388`
- CAPI Token: stored in tenant `integrations.metaConversionsApiToken`
- Ad Account: `730494526974837`
- Business ID: `598666359737310`

**CRM Integration Notes:**
- This tracking system is designed to work with the CRM Leads plan (separate implementation)
- `event_id` (UUID) flows between browser Pixel and server CAPI for deduplication
- UTM parameters flow into lead records: `utm_campaign` carries the campaign code (SA-SEDE-AREA-CURSO-AÑOTEMP-TIPO)
- When a lead converts to `status=matriculado`, a `CompleteRegistration` event should fire via CAPI (CRM agent implements the hook)
- Facebook cookie values `_fbc` and `_fbp` are captured from browser and sent with CAPI events

---

## Task 1: Extend Tenant Collection with new integration fields

**Files:**
- Modify: `apps/tenant-admin/src/collections/Tenants/Tenants.ts:212-248`

**Step 1: Add new fields to the integrations group**

In `Tenants.ts`, replace the `integrations` group fields (lines 220-247) with:

```typescript
fields: [
  {
    name: 'ga4MeasurementId',
    type: 'text',
    label: 'Google Analytics 4 ID',
    admin: {
      description: 'Ej: G-XXXXXXXXXX',
    },
  },
  {
    name: 'gtmContainerId',
    type: 'text',
    label: 'Google Tag Manager ID',
    admin: {
      description: 'Ej: GTM-XXXXXXX',
    },
  },
  {
    name: 'metaPixelId',
    type: 'text',
    label: 'Meta Pixel ID',
    admin: {
      description: 'ID del pixel de Meta/Facebook',
    },
  },
  {
    name: 'metaAdAccountId',
    type: 'text',
    label: 'Meta Ad Account ID',
    admin: {
      description: 'Ej: 730494526974837',
    },
  },
  {
    name: 'metaBusinessId',
    type: 'text',
    label: 'Meta Business ID',
    admin: {
      description: 'ID del Business Manager',
    },
  },
  {
    name: 'metaConversionsApiToken',
    type: 'text',
    label: 'Meta Conversions API Token',
    admin: {
      description: 'Token secreto para la API de Conversiones. Solo visible para Admin.',
    },
  },
  {
    name: 'mailchimpApiKey',
    type: 'text',
    label: 'Mailchimp API Key',
    admin: {
      description: 'Para integracion de email marketing',
    },
  },
  {
    name: 'whatsappBusinessId',
    type: 'text',
    label: 'WhatsApp Business ID',
  },
],
```

**Step 2: Verify build compiles**

Run: `cd apps/tenant-admin && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds (or only unrelated warnings)

**Step 3: Commit**

```bash
git add apps/tenant-admin/src/collections/Tenants/Tenants.ts
git commit -m "feat(tenants): add GTM, Meta Ad Account, Business ID, and CAPI token fields to integrations"
```

---

## Task 2: Create Meta CAPI utility library

**Files:**
- Create: `apps/tenant-admin/src/lib/meta-capi.ts`

**Step 1: Create the CAPI utility**

```typescript
import { createHash } from 'crypto'

const META_GRAPH_API = 'https://graph.facebook.com/v21.0'

interface UserData {
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

interface CustomData {
  content_name?: string
  content_category?: string
  content_ids?: string[]
  content_type?: string
  value?: number
  currency?: string
}

interface MetaEvent {
  event_name: string
  event_time: number
  event_id: string
  event_source_url?: string
  action_source: 'website'
  user_data: Record<string, string | undefined>
  custom_data?: CustomData
}

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function hashUserData(data: UserData): Record<string, string | undefined> {
  return {
    em: data.email ? sha256(data.email) : undefined,
    ph: data.phone ? sha256(data.phone.replace(/\D/g, '')) : undefined,
    fn: data.firstName ? sha256(data.firstName) : undefined,
    ln: data.lastName ? sha256(data.lastName) : undefined,
    ct: data.city ? sha256(data.city) : undefined,
    st: data.state ? sha256(data.state) : undefined,
    zp: data.zipCode ? sha256(data.zipCode) : undefined,
    country: data.country ? sha256(data.country) : undefined,
    client_ip_address: data.clientIpAddress,
    client_user_agent: data.clientUserAgent,
    fbc: data.fbc,
    fbp: data.fbp,
  }
}

export async function sendMetaEvent(
  pixelId: string,
  accessToken: string,
  eventName: string,
  eventId: string,
  userData: UserData,
  sourceUrl?: string,
  customData?: CustomData,
): Promise<{ success: boolean; error?: string }> {
  const event: MetaEvent = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: sourceUrl,
    action_source: 'website',
    user_data: hashUserData(userData),
    custom_data: customData,
  }

  try {
    const response = await fetch(
      `${META_GRAPH_API}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [event] }),
      },
    )

    if (!response.ok) {
      const error = await response.text()
      console.error(`[meta-capi] Error sending ${eventName}:`, error)
      return { success: false, error }
    }

    console.log(`[meta-capi] Sent ${eventName} (event_id: ${eventId})`)
    return { success: true }
  } catch (err) {
    console.error(`[meta-capi] Failed to send ${eventName}:`, err)
    return { success: false, error: String(err) }
  }
}
```

**Step 2: Commit**

```bash
git add apps/tenant-admin/src/lib/meta-capi.ts
git commit -m "feat: add Meta Conversions API utility with SHA-256 hashing"
```

---

## Task 3: Create server-side CAPI endpoint

**Files:**
- Create: `apps/tenant-admin/app/api/meta/events/route.ts`

**Step 1: Create the endpoint**

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { sendMetaEvent } from '@/src/lib/meta-capi'

/**
 * Server-side Meta Conversions API endpoint.
 *
 * POST /api/meta/events
 *
 * Body: {
 *   event_name: 'PageView' | 'ViewContent' | 'Lead' | 'CompleteRegistration' | 'Contact',
 *   event_id: string (UUID, shared with browser Pixel for deduplication),
 *   source_url: string,
 *   user_data: { email?, phone?, firstName?, lastName?, fbc?, fbp? },
 *   custom_data?: { content_name?, content_category?, content_ids?, value?, currency? }
 * }
 *
 * Reads pixelId and CAPI token from tenant config.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_name, event_id, source_url, user_data, custom_data } = body

    if (!event_name || !event_id) {
      return NextResponse.json({ ok: false, error: 'event_name and event_id required' }, { status: 400 })
    }

    const { getPayloadHMR } = await import('@payloadcms/next/utilities')
    const configPromise = (await import('@payload-config')).default
    const payload = await getPayloadHMR({ config: configPromise })

    const tenants = await payload.find({ collection: 'tenants', limit: 1, depth: 0 })
    const tenant = tenants.docs[0] as any

    const pixelId = tenant?.integrations?.metaPixelId
    const accessToken = tenant?.integrations?.metaConversionsApiToken

    if (!pixelId || !accessToken) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const enrichedUserData = {
      ...user_data,
      clientIpAddress: user_data?.clientIpAddress || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      clientUserAgent: user_data?.clientUserAgent || request.headers.get('user-agent') || '',
    }

    const result = await sendMetaEvent(
      pixelId,
      accessToken,
      event_name,
      event_id,
      enrichedUserData,
      source_url,
      custom_data,
    )

    return NextResponse.json({ ok: result.success })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
```

**Step 2: Commit**

```bash
git add apps/tenant-admin/app/api/meta/events/route.ts
git commit -m "feat: add /api/meta/events endpoint for server-side Conversions API"
```

---

## Task 4: Extend /api/track to fire CAPI events

**Files:**
- Modify: `apps/tenant-admin/app/api/track/route.ts`

**Step 1: Replace entire file adding CAPI integration**

```typescript
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Public tracking endpoint for page views and lead captures.
 * Fires Meta CAPI events for dual tracking (browser Pixel + server CAPI).
 *
 * POST /api/track
 *
 * Body (page view):
 *   { path, slug, referrer, userAgent, timestamp, event_id?, fbp?, fbc? }
 *
 * Body (lead capture):
 *   { type: 'lead', path, courseRunId, courseName, first_name, last_name, email, phone,
 *     event_id?, fbp?, fbc?, utm_source?, utm_medium?, utm_campaign? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.type === 'lead') {
      try {
        const { getPayloadHMR } = await import('@payloadcms/next/utilities')
        const configPromise = (await import('@payload-config')).default
        const payload = await getPayloadHMR({ config: configPromise })

        await payload.create({
          collection: 'leads',
          data: {
            first_name: body.first_name || '',
            last_name: body.last_name || '',
            email: body.email || '',
            phone: body.phone || '',
            source: body.utm_source ? `${body.utm_source}_ads` : 'web',
            status: 'nuevo',
            course_interest: body.courseName || '',
            notes: `Landing page: ${body.path || ''} | CourseRun ID: ${body.courseRunId || ''}`,
            utm_source: body.utm_source || 'landing',
            utm_medium: body.utm_medium || 'organic',
            utm_campaign: body.utm_campaign || body.slug || '',
          },
        })

        console.log(`[track] Lead captured: ${body.email} for ${body.courseName}`)
      } catch (err) {
        console.error('[track] Failed to create lead:', err)
      }

      if (body.event_id) {
        fireCapiEvent(request, 'Lead', body.event_id, body).catch(() => {})
      }

      return NextResponse.json({ ok: true })
    }

    console.log(`[track] Page view: ${body.path} | referrer: ${body.referrer || 'direct'}`)

    if (body.event_id) {
      fireCapiEvent(request, 'PageView', body.event_id, body).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}

async function fireCapiEvent(request: NextRequest, eventName: string, eventId: string, body: any) {
  const { sendMetaEvent } = await import('@/src/lib/meta-capi')
  const { getPayloadHMR } = await import('@payloadcms/next/utilities')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayloadHMR({ config: configPromise })

  const tenants = await payload.find({ collection: 'tenants', limit: 1, depth: 0 })
  const tenant = tenants.docs[0] as any
  const pixelId = tenant?.integrations?.metaPixelId
  const accessToken = tenant?.integrations?.metaConversionsApiToken

  if (!pixelId || !accessToken) return

  await sendMetaEvent(pixelId, accessToken, eventName, eventId, {
    email: body.email,
    phone: body.phone,
    firstName: body.first_name,
    lastName: body.last_name,
    clientIpAddress: request.headers.get('x-forwarded-for') || '',
    clientUserAgent: body.userAgent || request.headers.get('user-agent') || '',
    fbc: body.fbc,
    fbp: body.fbp,
  }, body.path ? `https://cepformacion.akademate.com${body.path}` : undefined)
}
```

**Step 2: Commit**

```bash
git add apps/tenant-admin/app/api/track/route.ts
git commit -m "feat: extend /api/track with Meta CAPI dual tracking"
```

---

## Task 5: Install Meta Pixel in public layout

**Files:**
- Modify: `apps/tenant-admin/app/(public)/layout.tsx`

**Step 1: Extend getTenantData to include tracking IDs**

Add `metaPixelId` and `ga4MeasurementId` to the return object of `getTenantData()`.

**Step 2: Add Meta Pixel script in head**

Inside the `<html>` element, before `<body>`, add a `<head>` with the Meta Pixel base code. The Pixel ID comes from `tenant.metaPixelId` (read from DB, not hardcoded). Use a standard `<script>` tag with the official fbevents.js SDK snippet. Include `<noscript>` fallback image tag.

Note: The Pixel base code is Facebook's official SDK — it uses inline script which is standard practice for tracking pixels. The Pixel ID value comes from the trusted tenant database, not user input.

**Step 3: Commit**

```bash
git add apps/tenant-admin/app/(public)/layout.tsx
git commit -m "feat: inject Meta Pixel in public layout from tenant config"
```

---

## Task 6: Add ViewContent tracking to convocatoria pages

**Files:**
- Create: `apps/tenant-admin/app/(public)/p/convocatorias/[slug]/MetaViewContent.tsx`
- Modify: `apps/tenant-admin/app/(public)/p/convocatorias/[slug]/page.tsx`

**Step 1: Create MetaViewContent client component**

A 'use client' component that on mount:
1. Generates a `crypto.randomUUID()` as `event_id`
2. Fires `fbq('track', 'ViewContent', {...}, {eventID})` (browser Pixel)
3. POSTs to `/api/meta/events` with same `event_id` (server CAPI)

Props: `contentName`, `contentCategory`, `contentId`, `sourceUrl`

**Step 2: Include in convocatoria page**

Add `<MetaViewContent>` at the bottom of the page component with course name, category, and slug.

**Step 3: Commit**

```bash
git add apps/tenant-admin/app/(public)/p/convocatorias/[slug]/MetaViewContent.tsx
git add apps/tenant-admin/app/(public)/p/convocatorias/[slug]/page.tsx
git commit -m "feat: add ViewContent tracking for convocatoria pages (Pixel + CAPI)"
```

---

## Task 7: Add Lead tracking to PreinscripcionForm

**Files:**
- Modify: `apps/tenant-admin/app/(public)/p/convocatorias/[slug]/PreinscripcionForm.tsx`

**Step 1: In the form submit handler, add Lead tracking**

Before the existing fetch to `/api/track`:
1. Generate `event_id = crypto.randomUUID()`
2. Read `_fbc` and `_fbp` cookies from browser
3. Fire `fbq('track', 'Lead', {...}, {eventID})` (browser)
4. Add `event_id`, `fbc`, `fbp`, and UTM params to the `/api/track` body

The server-side CAPI event fires automatically via `/api/track` (Task 4).

**Step 2: Commit**

```bash
git add apps/tenant-admin/app/(public)/p/convocatorias/[slug]/PreinscripcionForm.tsx
git commit -m "feat: add Lead event tracking with deduplication to PreinscripcionForm"
```

---

## Task 8: Add Integraciones section to config page

**Files:**
- Modify: `apps/tenant-admin/app/(app)/(dashboard)/configuracion/page.tsx`

**Step 1: Add 'integraciones' to SECTIONS array**

Import `Plug` from lucide-react. Add `{ id: 'integraciones', label: 'Integraciones', icon: Plug }` after 'areas'.

**Step 2: Add IntegrationsConfig interface and state**

Fields: ga4MeasurementId, gtmContainerId, metaPixelId, metaAdAccountId, metaBusinessId, metaConversionsApiToken, mailchimpApiKey, whatsappBusinessId

**Step 3: Add UI section with three cards**

Card "Google": GA4 ID + GTM ID inputs
Card "Meta / Facebook": Pixel ID + Ad Account ID + Business ID + CAPI Token (password field with eye toggle)
Card "Email y Messaging": Mailchimp API Key (password field) + WhatsApp Business ID

Each card with Save button using existing `saveSection('integrations', data)` pattern.

**Step 4: Load integrations from tenant on mount, save via /api/config**

Follow the same pattern as other sections (academia, theme, logos).

**Step 5: Commit**

```bash
git add apps/tenant-admin/app/(app)/(dashboard)/configuracion/page.tsx
git commit -m "feat: add Integraciones section to config page with Meta/Google/Email fields"
```

---

## Task 9: Add IntegrationsSchema to /api/config

**Files:**
- Modify: `apps/tenant-admin/app/api/config/route.ts`

**Step 1: Add Zod validation schema**

```typescript
const IntegrationsSchema = z.object({
  ga4MeasurementId: z.string().default(''),
  gtmContainerId: z.string().default(''),
  metaPixelId: z.string().default(''),
  metaAdAccountId: z.string().default(''),
  metaBusinessId: z.string().default(''),
  metaConversionsApiToken: z.string().default(''),
  mailchimpApiKey: z.string().default(''),
  whatsappBusinessId: z.string().default(''),
})
```

**Step 2: Handle 'integrations' section in PUT handler**

Add case for `section === 'integrations'` that validates with IntegrationsSchema and saves to tenant branding jsonb, following the same pattern as other sections.

**Step 3: Commit**

```bash
git add apps/tenant-admin/app/api/config/route.ts
git commit -m "feat: add integrations schema to /api/config endpoint"
```

---

## Task 10: Verify end-to-end

**Step 1:** Set Pixel ID `1189071876088388` and CAPI token in tenant config (via new UI or Payload admin)

**Step 2:** Visit a public convocatoria page. Check browser DevTools Network for `facebook.com/tr` requests.

**Step 3:** In Meta Events Manager > Probar eventos, verify PageView and ViewContent arrive.

**Step 4:** Submit a preinscripcion form. Verify Lead event appears in Events Manager from both Pixel and CAPI (should show "Varios" in integration column).

---

## Summary of files

| Action | File |
|--------|------|
| Modify | `apps/tenant-admin/src/collections/Tenants/Tenants.ts` |
| Create | `apps/tenant-admin/src/lib/meta-capi.ts` |
| Create | `apps/tenant-admin/app/api/meta/events/route.ts` |
| Modify | `apps/tenant-admin/app/api/track/route.ts` |
| Modify | `apps/tenant-admin/app/(public)/layout.tsx` |
| Create | `apps/tenant-admin/app/(public)/p/convocatorias/[slug]/MetaViewContent.tsx` |
| Modify | `apps/tenant-admin/app/(public)/p/convocatorias/[slug]/PreinscripcionForm.tsx` |
| Modify | `apps/tenant-admin/app/(app)/(dashboard)/configuracion/page.tsx` |
| Modify | `apps/tenant-admin/app/api/config/route.ts` |
