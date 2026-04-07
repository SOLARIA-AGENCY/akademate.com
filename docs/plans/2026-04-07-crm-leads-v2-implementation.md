# CRM Leads v2 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the leads CRM with proper interaction tracking, normalized statuses, enrollment flow, and real KPIs for CEP Formacion.

**Architecture:** Raw SQL migration for new enum/table, Next.js API routes with Payload HMR for CRUD, React client components for UI. All interactions stored in append-only `lead_interactions` table. Enrollment creation via atomic SQL transaction.

**Tech Stack:** Next.js 15, Payload CMS 3.81, PostgreSQL (raw SQL via Payload db.execute), React 19, lucide-react 1.7, TailwindCSS 4

---

## Task 1: Database Migration — New lead statuses + lead_interactions table

**Files:**
- Create: `apps/tenant-admin/migrations/20260407_lead_interactions.sql`

**Step 1: Write the migration SQL**

```sql
-- 1. Create new lead status enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_leads_status_v2') THEN
    CREATE TYPE enum_leads_status_v2 AS ENUM (
      'new', 'contacted', 'following_up', 'interested', 'enrolling',
      'enrolled', 'on_hold', 'not_interested', 'unreachable', 'discarded'
    );
  END IF;
END $$;

-- 2. Migrate leads.status column to new enum
-- Drop old default first
ALTER TABLE leads ALTER COLUMN status DROP DEFAULT;
-- Convert column: old values → new values
ALTER TABLE leads
  ALTER COLUMN status TYPE enum_leads_status_v2
  USING CASE status::text
    WHEN 'new' THEN 'new'::enum_leads_status_v2
    WHEN 'contacted' THEN 'contacted'::enum_leads_status_v2
    WHEN 'qualified' THEN 'interested'::enum_leads_status_v2
    WHEN 'converted' THEN 'enrolled'::enum_leads_status_v2
    WHEN 'rejected' THEN 'not_interested'::enum_leads_status_v2
    WHEN 'lost' THEN 'discarded'::enum_leads_status_v2
    WHEN 'spam' THEN 'discarded'::enum_leads_status_v2
    -- UI-only values that may exist in DB
    WHEN 'interested' THEN 'interested'::enum_leads_status_v2
    WHEN 'not_interested' THEN 'not_interested'::enum_leads_status_v2
    WHEN 'no_answer' THEN 'contacted'::enum_leads_status_v2
    WHEN 'wrong_number' THEN 'unreachable'::enum_leads_status_v2
    WHEN 'callback' THEN 'on_hold'::enum_leads_status_v2
    WHEN 'enrolled' THEN 'enrolled'::enum_leads_status_v2
    WHEN 'discarded' THEN 'discarded'::enum_leads_status_v2
    ELSE 'new'::enum_leads_status_v2
  END;
ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'new'::enum_leads_status_v2;

-- 3. Add new columns to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action_date TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action_note TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrollment_id INTEGER;

-- 4. Create lead_interactions table (append-only)
CREATE TABLE IF NOT EXISTS lead_interactions (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  channel VARCHAR(20) NOT NULL,
  result VARCHAR(30) NOT NULL,
  note TEXT,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_tenant_id ON lead_interactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON lead_interactions(created_at DESC);
```

**Step 2: Run the migration against the database**

Connect to the database and run the SQL. Use the DATABASE_URL from the tenant-admin .env:

```bash
# From project root — adjust DATABASE_URL as needed
psql "$DATABASE_URL" -f apps/tenant-admin/migrations/20260407_lead_interactions.sql
```

If running against production (akademate-prod):
```bash
ssh akademate-prod 'docker exec -i akademate-db psql -U akademate -d akademate' < apps/tenant-admin/migrations/20260407_lead_interactions.sql
```

Expected: All statements succeed. Verify:
```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'lead_interactions';
-- Should show: id, lead_id, user_id, channel, result, note, tenant_id, created_at

SELECT enumlabel FROM pg_enum WHERE enumtypid = 'enum_leads_status_v2'::regtype ORDER BY enumsortorder;
-- Should show all 10 values
```

**Step 3: Commit**

```bash
git add apps/tenant-admin/migrations/20260407_lead_interactions.sql
git commit -m "feat(leads): add lead_interactions table and new 10-state status enum"
```

---

## Task 2: API — Lead interactions endpoints

**Files:**
- Create: `apps/tenant-admin/app/api/leads/[id]/interactions/route.ts`

**Step 1: Create the interactions API route**

```typescript
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/leads/[id]/interactions — list all interactions for a lead
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const payload = await getPayloadHMR({ config: configPromise })

    const result = await (payload.db as any).execute({
      raw: `
        SELECT li.*, u.email as user_email, u.first_name as user_first_name, u.last_name as user_last_name
        FROM lead_interactions li
        LEFT JOIN users u ON u.id = li.user_id
        WHERE li.lead_id = $1
        ORDER BY li.created_at DESC
      `,
      values: [parseInt(id)],
    })

    return NextResponse.json({ interactions: result.rows ?? result ?? [] })
  } catch (error) {
    console.error('[API][LeadInteractions] GET error:', error)
    return NextResponse.json({ interactions: [] })
  }
}

// POST /api/leads/[id]/interactions — register a new interaction
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { channel, result, note } = body

    if (!channel || !result) {
      return NextResponse.json(
        { error: 'channel and result are required' },
        { status: 400 },
      )
    }

    const validChannels = ['phone', 'whatsapp', 'email', 'system']
    const validResults = [
      'no_answer', 'positive', 'negative', 'callback', 'wrong_number',
      'message_sent', 'email_sent', 'enrollment_started',
    ]

    if (!validChannels.includes(channel)) {
      return NextResponse.json({ error: `Invalid channel: ${channel}` }, { status: 400 })
    }
    if (!validResults.includes(result)) {
      return NextResponse.json({ error: `Invalid result: ${result}` }, { status: 400 })
    }

    const payload = await getPayloadHMR({ config: configPromise })
    const leadId = parseInt(id)

    // Get current lead to check tenant_id and interaction count
    const lead = await payload.findByID({ collection: 'leads', id, depth: 0 })
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const tenantId = (lead as any).tenant_id ?? (lead as any).tenant ?? 1

    // TODO: get real user_id from session — for now use body.user_id or default 1
    const userId = body.user_id ?? 1

    // 1. Insert interaction (append-only)
    await (payload.db as any).execute({
      raw: `
        INSERT INTO lead_interactions (lead_id, user_id, channel, result, note, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      values: [leadId, userId, channel, result, note ?? null, tenantId],
    })

    // 2. Update lead.last_contacted_at
    await (payload.db as any).execute({
      raw: `UPDATE leads SET last_contacted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      values: [leadId],
    })

    // 3. If first interaction, auto-change status to 'contacted'
    const countResult = await (payload.db as any).execute({
      raw: `SELECT COUNT(*) as cnt FROM lead_interactions WHERE lead_id = $1`,
      values: [leadId],
    })
    const count = parseInt((countResult.rows ?? countResult)?.[0]?.cnt ?? '0')

    if (count === 1) {
      // First interaction — auto-transition to contacted
      await (payload.db as any).execute({
        raw: `UPDATE leads SET status = 'contacted' WHERE id = $1 AND status = 'new'`,
        values: [leadId],
      })
    }

    // 4. Auto status transitions based on result
    if (result === 'positive') {
      await (payload.db as any).execute({
        raw: `UPDATE leads SET status = 'interested' WHERE id = $1 AND status IN ('new', 'contacted', 'following_up')`,
        values: [leadId],
      })
    } else if (result === 'wrong_number') {
      await (payload.db as any).execute({
        raw: `UPDATE leads SET status = 'unreachable' WHERE id = $1`,
        values: [leadId],
      })
    } else if (result === 'callback') {
      await (payload.db as any).execute({
        raw: `UPDATE leads SET status = 'on_hold' WHERE id = $1`,
        values: [leadId],
      })
    } else if (result === 'negative') {
      await (payload.db as any).execute({
        raw: `UPDATE leads SET status = 'not_interested' WHERE id = $1`,
        values: [leadId],
      })
    }

    // Return updated lead
    const updatedLead = await payload.findByID({ collection: 'leads', id, depth: 0 })
    return NextResponse.json({ success: true, lead: updatedLead })
  } catch (error) {
    console.error('[API][LeadInteractions] POST error:', error)
    return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 })
  }
}
```

**Step 2: Verify the route resolves**

Start dev server and test:
```bash
curl -s http://localhost:3009/api/leads/1/interactions | head
```
Expected: `{"interactions":[]}` or similar JSON response.

**Step 3: Commit**

```bash
git add apps/tenant-admin/app/api/leads/[id]/interactions/route.ts
git commit -m "feat(leads): add GET/POST /api/leads/[id]/interactions endpoints"
```

---

## Task 3: API — Dashboard KPIs endpoint

**Files:**
- Create: `apps/tenant-admin/app/api/leads/dashboard/route.ts`

**Step 1: Create the dashboard KPIs route**

```typescript
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const db = payload.db as any

    // Total leads
    const totalRes = await db.execute({ raw: `SELECT COUNT(*) as cnt FROM leads` })
    const totalLeads = parseInt((totalRes.rows ?? totalRes)?.[0]?.cnt ?? '0')

    // New this month
    const newMonthRes = await db.execute({
      raw: `SELECT COUNT(*) as cnt FROM leads WHERE created_at >= date_trunc('month', CURRENT_DATE)`,
    })
    const newThisMonth = parseInt((newMonthRes.rows ?? newMonthRes)?.[0]?.cnt ?? '0')

    // Unattended: new leads with no interactions AND created > 24h ago
    const unattendedRes = await db.execute({
      raw: `
        SELECT COUNT(*) as cnt FROM leads l
        WHERE l.status = 'new'
          AND l.created_at < NOW() - INTERVAL '24 hours'
          AND NOT EXISTS (SELECT 1 FROM lead_interactions li WHERE li.lead_id = l.id)
      `,
    })
    const unattended = parseInt((unattendedRes.rows ?? unattendedRes)?.[0]?.cnt ?? '0')

    // Conversion rate
    const enrolledRes = await db.execute({
      raw: `SELECT COUNT(*) as cnt FROM leads WHERE status = 'enrolled'`,
    })
    const enrolled = parseInt((enrolledRes.rows ?? enrolledRes)?.[0]?.cnt ?? '0')
    const conversionRate = totalLeads > 0 ? Math.round((enrolled / totalLeads) * 1000) / 10 : 0

    // Avg response time (hours) — time between lead creation and first interaction
    const avgTimeRes = await db.execute({
      raw: `
        SELECT AVG(EXTRACT(EPOCH FROM (fi.first_at - l.created_at)) / 3600) as avg_hours
        FROM leads l
        INNER JOIN (
          SELECT lead_id, MIN(created_at) as first_at
          FROM lead_interactions
          GROUP BY lead_id
        ) fi ON fi.lead_id = l.id
      `,
    })
    const avgResponseHours = Math.round(parseFloat((avgTimeRes.rows ?? avgTimeRes)?.[0]?.avg_hours ?? '0') * 10) / 10

    // Open enrollments (pending payment)
    const openEnrollRes = await db.execute({
      raw: `SELECT COUNT(*) as cnt FROM leads WHERE status = 'enrolling'`,
    })
    const openEnrollments = parseInt((openEnrollRes.rows ?? openEnrollRes)?.[0]?.cnt ?? '0')

    // Follow-up breakdown
    const breakdownRes = await db.execute({
      raw: `
        SELECT status, COUNT(*) as cnt FROM leads
        WHERE status IN ('contacted', 'following_up', 'interested', 'on_hold')
        GROUP BY status
      `,
    })
    const followUpBreakdown: Record<string, number> = {}
    for (const row of (breakdownRes.rows ?? breakdownRes ?? [])) {
      followUpBreakdown[row.status] = parseInt(row.cnt)
    }

    // Converted this month
    const convertedMonthRes = await db.execute({
      raw: `SELECT COUNT(*) as cnt FROM leads WHERE status = 'enrolled' AND updated_at >= date_trunc('month', CURRENT_DATE)`,
    })
    const convertedThisMonth = parseInt((convertedMonthRes.rows ?? convertedMonthRes)?.[0]?.cnt ?? '0')

    return NextResponse.json({
      totalLeads,
      newThisMonth,
      unattended,
      conversionRate,
      avgResponseHours,
      openEnrollments,
      followUpBreakdown,
      convertedThisMonth,
    })
  } catch (error) {
    console.error('[API][LeadsDashboard] error:', error)
    return NextResponse.json({
      totalLeads: 0, newThisMonth: 0, unattended: 0,
      conversionRate: 0, avgResponseHours: 0, openEnrollments: 0,
      followUpBreakdown: {}, convertedThisMonth: 0,
    })
  }
}
```

**Step 2: Commit**

```bash
git add apps/tenant-admin/app/api/leads/dashboard/route.ts
git commit -m "feat(leads): add GET /api/leads/dashboard with real KPIs"
```

---

## Task 4: API — Enrollment initiation endpoint

**Files:**
- Create: `apps/tenant-admin/app/api/leads/[id]/enroll/route.ts`

**Step 1: Create the enroll route**

```typescript
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const payload = await getPayloadHMR({ config: configPromise })
    const db = payload.db as any

    // Fetch lead
    const lead = await payload.findByID({ collection: 'leads', id, depth: 0 }) as any
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Validate status allows enrollment
    const allowedStatuses = ['interested', 'following_up']
    if (!allowedStatuses.includes(lead.status)) {
      return NextResponse.json(
        { error: `Lead status "${lead.status}" does not allow enrollment. Must be: ${allowedStatuses.join(', ')}` },
        { status: 400 },
      )
    }

    // Check if already has enrollment
    if (lead.enrollment_id) {
      return NextResponse.json(
        { error: 'Lead already has an enrollment', enrollmentId: lead.enrollment_id },
        { status: 409 },
      )
    }

    const userId = body.user_id ?? 1
    const tenantId = lead.tenant_id ?? lead.tenant ?? 1

    // Atomic transaction: create enrollment + update lead + log interaction
    try {
      await db.execute({ raw: 'BEGIN' })

      // 1. Create enrollment via Payload
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student_id: lead.id,
          status: 'pending',
          payment_status: 'unpaid',
          enrolled_at: new Date().toISOString(),
          // Pre-fill from lead data
          ...(lead.course_id ? { course_run_id: lead.course_id } : {}),
          tenant: tenantId,
        },
      })

      // 2. Update lead status and link enrollment
      await db.execute({
        raw: `UPDATE leads SET status = 'enrolling', enrollment_id = $1, updated_at = NOW() WHERE id = $2`,
        values: [enrollment.id, parseInt(id)],
      })

      // 3. Log system interaction
      await db.execute({
        raw: `
          INSERT INTO lead_interactions (lead_id, user_id, channel, result, note, tenant_id)
          VALUES ($1, $2, 'system', 'enrollment_started', 'Ficha de matricula creada', $3)
        `,
        values: [parseInt(id), userId, tenantId],
      })

      await db.execute({ raw: 'COMMIT' })

      return NextResponse.json({
        success: true,
        enrollmentId: enrollment.id,
        message: 'Enrollment created successfully',
      })
    } catch (txError) {
      await db.execute({ raw: 'ROLLBACK' }).catch(() => {})
      throw txError
    }
  } catch (error) {
    console.error('[API][LeadEnroll] error:', error)
    return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add apps/tenant-admin/app/api/leads/[id]/enroll/route.ts
git commit -m "feat(leads): add POST /api/leads/[id]/enroll with atomic transaction"
```

---

## Task 5: API — Update GET /api/leads with sort and last interactor

**Files:**
- Modify: `apps/tenant-admin/app/api/leads/route.ts` (lines 14-65)

**Step 1: Replace the GET handler**

Replace the entire GET function in `apps/tenant-admin/app/api/leads/route.ts` with:

```typescript
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '25', 10), 200)
    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1)
    const status = searchParams.get('status')
    const search = searchParams.get('q')?.trim()

    const payload = await getPayloadHMR({ config: configPromise })
    const db = payload.db as any

    // Build WHERE clause
    const conditions: string[] = []
    const values: any[] = []
    let paramIdx = 1

    if (status) {
      conditions.push(`l.status = $${paramIdx++}`)
      values.push(status)
    }

    if (search) {
      conditions.push(`(l.first_name ILIKE $${paramIdx} OR l.last_name ILIKE $${paramIdx} OR l.email ILIKE $${paramIdx} OR l.phone ILIKE $${paramIdx})`)
      values.push(`%${search}%`)
      paramIdx++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Count total
    const countRes = await db.execute({
      raw: `SELECT COUNT(*) as cnt FROM leads l ${whereClause}`,
      values,
    })
    const totalDocs = parseInt((countRes.rows ?? countRes)?.[0]?.cnt ?? '0')

    const offset = (page - 1) * limit

    // Main query with last interactor and custom sort
    const result = await db.execute({
      raw: `
        SELECT
          l.*,
          li_last.user_first_name as last_interactor_name,
          li_last.channel as last_interactor_channel,
          li_last.created_at as last_interaction_at,
          COALESCE(li_count.cnt, 0) as interaction_count
        FROM leads l
        LEFT JOIN LATERAL (
          SELECT
            li.channel,
            li.created_at,
            u.first_name as user_first_name
          FROM lead_interactions li
          LEFT JOIN users u ON u.id = li.user_id
          WHERE li.lead_id = l.id
          ORDER BY li.created_at DESC
          LIMIT 1
        ) li_last ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*) as cnt FROM lead_interactions WHERE lead_id = l.id
        ) li_count ON true
        ${whereClause}
        ORDER BY
          CASE l.status
            WHEN 'new' THEN 0
            WHEN 'contacted' THEN 1
            WHEN 'following_up' THEN 2
            WHEN 'interested' THEN 3
            WHEN 'on_hold' THEN 4
            WHEN 'enrolling' THEN 5
            ELSE 6
          END,
          CASE WHEN l.status = 'new' THEN l.created_at END ASC,
          l.created_at DESC
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
      `,
      values: [...values, limit, offset],
    })

    const docs = (result.rows ?? result ?? []).map((row: any) => ({
      ...row,
      lastInteractor: row.last_interactor_name
        ? { name: row.last_interactor_name, channel: row.last_interactor_channel, at: row.last_interaction_at }
        : null,
      interactionCount: parseInt(row.interaction_count ?? '0'),
    }))

    return NextResponse.json({
      docs,
      totalDocs,
      limit,
      page,
      totalPages: Math.ceil(totalDocs / limit),
      hasNextPage: page * limit < totalDocs,
      hasPrevPage: page > 1,
    })
  } catch (error) {
    console.error('[API][Leads] Failed to fetch leads:', error)
    return NextResponse.json({
      docs: [], totalDocs: 0, limit: 25, page: 1,
      totalPages: 0, hasNextPage: false, hasPrevPage: false,
      warning: 'Leads no disponibles temporalmente.',
    })
  }
}
```

**Step 2: Commit**

```bash
git add apps/tenant-admin/app/api/leads/route.ts
git commit -m "feat(leads): update GET /api/leads with priority sort and last interactor"
```

---

## Task 6: API — Update PATCH /api/leads/[id] with new fields

**Files:**
- Modify: `apps/tenant-admin/app/api/leads/[id]/route.ts` (lines 23-73)

**Step 1: Replace the PATCH handler**

Replace the entire PATCH function with cleaner version that uses the new status enum and adds new fields:

```typescript
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const payload = await getPayloadHMR({ config: configPromise })

    // Fields updatable via Payload
    const payloadFields = ['status', 'priority', 'assigned_to', 'last_contacted_at', 'converted_at']
    const payloadData: Record<string, unknown> = {}
    for (const field of payloadFields) {
      if (body[field] !== undefined) payloadData[field] = body[field]
    }

    if (Object.keys(payloadData).length > 0) {
      await payload.update({ collection: 'leads', id, data: payloadData as any })
    }

    // Extra fields via raw SQL
    const sqlSets: string[] = []
    const sqlValues: any[] = []
    let idx = 1

    if (body.next_action_date !== undefined) {
      sqlSets.push(`next_action_date = $${idx++}`)
      sqlValues.push(body.next_action_date)
    }
    if (body.next_action_note !== undefined) {
      sqlSets.push(`next_action_note = $${idx++}`)
      sqlValues.push(body.next_action_note)
    }
    if (body.enrollment_id !== undefined) {
      sqlSets.push(`enrollment_id = $${idx++}`)
      sqlValues.push(body.enrollment_id)
    }

    if (sqlSets.length > 0) {
      sqlSets.push('updated_at = NOW()')
      sqlValues.push(parseInt(id))
      await (payload.db as any).execute({
        raw: `UPDATE leads SET ${sqlSets.join(', ')} WHERE id = $${idx}`,
        values: sqlValues,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('[API][Leads] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add apps/tenant-admin/app/api/leads/[id]/route.ts
git commit -m "feat(leads): update PATCH with new fields and parameterized SQL"
```

---

## Task 7: UI — Leads list page with dots, sort, KPIs, last interactor

**Files:**
- Modify: `apps/tenant-admin/app/(app)/(dashboard)/leads/page.tsx` (full rewrite)

**Step 1: Rewrite the leads list page**

This is a full rewrite of the page. Key changes:
- New STATUS_CONFIG with 10 statuses and dot colors
- Fetch from `/api/leads` (which now returns sorted data with lastInteractor)
- Fetch KPIs from `/api/leads/dashboard`
- Add dot color before name in each row
- Add last interactor column (name + channel icon)
- 5 KPI cards: Total, Sin atender, En seguimiento (with tooltip), Tasa conversion, Fichas abiertas
- Status filter shows all 10 statuses grouped

The STATUS_CONFIG map should be:
```typescript
const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  new:             { label: 'Nuevo',                dot: 'bg-red-500',     badge: 'bg-red-100 text-red-800 border border-red-300' },
  contacted:       { label: 'Contactado',           dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-800' },
  following_up:    { label: 'En seguimiento',       dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-800' },
  interested:      { label: 'Interesado',           dot: 'bg-green-500',   badge: 'bg-green-100 text-green-800' },
  enrolling:       { label: 'En matriculacion',     dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-800' },
  enrolled:        { label: 'Matriculado',          dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300' },
  on_hold:         { label: 'En espera',            dot: 'bg-amber-500',   badge: 'bg-gray-100 text-gray-600' },
  not_interested:  { label: 'No interesado',        dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-500' },
  unreachable:     { label: 'No contactable',       dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-500' },
  discarded:       { label: 'Descartado',           dot: 'bg-gray-400',    badge: 'bg-gray-50 text-gray-400' },
}
```

In each table row, add before the name:
```tsx
<span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${statusCfg.dot}`} />
```

Add last interactor column:
```tsx
{lead.lastInteractor && (
  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
    {lead.lastInteractor.channel === 'phone' && <Phone className="h-3 w-3" />}
    {lead.lastInteractor.channel === 'whatsapp' && <MessageSquare className="h-3 w-3" />}
    {lead.lastInteractor.channel === 'email' && <Mail className="h-3 w-3" />}
    <span className="truncate max-w-[80px]">{lead.lastInteractor.name}</span>
  </div>
)}
```

Add KPI dashboard cards fetched from `/api/leads/dashboard`:
- Total leads, Sin atender (red if >0), En seguimiento (tooltip with breakdown), Tasa conversion (%), Fichas abiertas

The full implementation should preserve the existing filter UI pattern but update status filter buttons to use the new 10 statuses (show a subset: new, contacted, interested, on_hold, enrolled, discarded).

**Step 2: Verify it renders**

Start dev server, navigate to `/leads`. Verify:
- Dots appear before names with correct colors
- KPI cards show real data from dashboard endpoint
- List is sorted: new first (oldest), then follow-up, then rest
- Last interactor shows in rows that have interactions

**Step 3: Commit**

```bash
git add apps/tenant-admin/app/\(app\)/\(dashboard\)/leads/page.tsx
git commit -m "feat(leads): rewrite leads list with status dots, KPIs, and last interactor"
```

---

## Task 8: UI — Lead detail page with interaction history, modal, enrollment button

**Files:**
- Modify: `apps/tenant-admin/app/(app)/(dashboard)/inscripciones/[id]/page.tsx` (major update)

**Step 1: Add interaction history section and contact modal**

Key changes to the detail page:

1. **STATUS_OPTIONS** — update to 10 new statuses with correct values/labels/colors

2. **New state variables:**
```typescript
const [interactions, setInteractions] = React.useState<any[]>([])
const [showContactModal, setShowContactModal] = React.useState<{ channel: 'phone' | 'whatsapp' | 'email' } | null>(null)
const [contactResult, setContactResult] = React.useState('')
const [contactNote, setContactNote] = React.useState('')
```

3. **Fetch interactions on load:**
```typescript
const loadInteractions = React.useCallback(async () => {
  try {
    const res = await fetch(`/api/leads/${id}/interactions`)
    if (res.ok) {
      const data = await res.json()
      setInteractions(data.interactions ?? [])
    }
  } catch {}
}, [id])

React.useEffect(() => { void loadInteractions() }, [loadInteractions])
```

4. **Register interaction function (replaces markContacted):**
```typescript
const registerInteraction = async () => {
  if (!showContactModal || !contactResult) return
  setSaving(true)
  try {
    await fetch(`/api/leads/${id}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: showContactModal.channel,
        result: contactResult,
        note: contactNote || undefined,
      }),
    })
    await loadLead()
    await loadInteractions()
    setShowContactModal(null)
    setContactResult('')
    setContactNote('')
  } catch {}
  finally { setSaving(false) }
}
```

5. **Contact result modal** — shows after clicking any contact action button:
```tsx
{showContactModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Registrar resultado — {showContactModal.channel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {CONTACT_RESULTS.map(({ value, label, icon: Icon }) => (
            <Button key={value} variant={contactResult === value ? 'default' : 'outline'} size="sm"
              onClick={() => setContactResult(value)}>
              <Icon className="h-3 w-3 mr-1" />{label}
            </Button>
          ))}
        </div>
        <Textarea placeholder="Nota opcional..." value={contactNote}
          onChange={e => setContactNote(e.target.value)} rows={2} />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setShowContactModal(null)}>Cancelar</Button>
          <Button disabled={!contactResult || saving} onClick={() => void registerInteraction()}>
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
)}
```

6. **Interaction history timeline** — new Card section below contact actions:
```tsx
<Card>
  <CardHeader className="pb-3">
    <CardTitle className="text-base">Historial de contacto</CardTitle>
  </CardHeader>
  <CardContent>
    {interactions.length === 0 ? (
      <p className="text-sm text-muted-foreground">Sin interacciones registradas</p>
    ) : (
      <div className="space-y-3">
        {interactions.map((i: any) => (
          <div key={i.id} className="flex items-start gap-3 text-sm border-l-2 border-muted pl-3">
            <div className="shrink-0 mt-0.5">
              {i.channel === 'phone' && <Phone className="h-4 w-4 text-primary" />}
              {i.channel === 'whatsapp' && <MessageSquare className="h-4 w-4 text-green-600" />}
              {i.channel === 'email' && <Mail className="h-4 w-4 text-blue-600" />}
              {i.channel === 'system' && <CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{i.user_first_name || 'Sistema'}</span>
                <Badge variant="outline" className="text-[10px]">{RESULT_LABELS[i.result] ?? i.result}</Badge>
              </div>
              {i.note && <p className="text-muted-foreground mt-0.5">{i.note}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(i.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>
```

Add RESULT_LABELS constant:
```typescript
const RESULT_LABELS: Record<string, string> = {
  no_answer: 'Sin respuesta',
  positive: 'Respondio positivo',
  negative: 'Respondio negativo',
  callback: 'Pide callback',
  wrong_number: 'Numero incorrecto',
  message_sent: 'Mensaje enviado',
  email_sent: 'Email enviado',
  enrollment_started: 'Matriculacion iniciada',
}
```

7. **Enrollment button** — in the header area, visible only when status is `interested` or `following_up`:
```tsx
{['interested', 'following_up'].includes(lead.status) && !lead.enrollment_id && (
  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleEnroll}>
    <GraduationCap className="mr-2 h-4 w-4" />Iniciar Matriculacion
  </Button>
)}
{lead.enrollment_id && (
  <Button variant="outline" onClick={() => router.push(`/matriculaciones/${lead.enrollment_id}`)}>
    Ver ficha de matricula
  </Button>
)}
```

Add `GraduationCap` to lucide-react imports. Add handleEnroll:
```typescript
const handleEnroll = async () => {
  if (!confirm('¿Iniciar proceso de matriculacion para este lead?')) return
  setSaving(true)
  try {
    const res = await fetch(`/api/leads/${id}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json()
    if (data.success && data.enrollmentId) {
      router.push(`/matriculaciones/${data.enrollmentId}`)
    }
  } catch {}
  finally { setSaving(false) }
}
```

8. **Sidebar improvements** — add assigned asesor, next action date/note:
```tsx
{/* Assigned advisor */}
<div className="flex justify-between">
  <span className="text-muted-foreground">Asesor</span>
  <span className="font-medium text-xs">{lead.assigned_to?.first_name || 'Sin asignar'}</span>
</div>

{/* Next action */}
{lead.next_action_date && (
  <div className="flex justify-between">
    <span className="text-muted-foreground">Proxima accion</span>
    <span className="text-xs">{new Date(lead.next_action_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
  </div>
)}
{lead.next_action_note && (
  <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-1">{lead.next_action_note}</div>
)}
```

9. **Update contact action buttons** to open modal instead of directly calling markContacted:
- Phone result buttons → `onClick={() => setShowContactModal({ channel: 'phone' })}`
- WhatsApp "Marcar contactado" → `onClick={() => { setContactResult('message_sent'); setShowContactModal({ channel: 'whatsapp' }) }}`
- Email "Marcar contactado" → `onClick={() => { setContactResult('email_sent'); setShowContactModal({ channel: 'email' }) }}`

**Step 2: Verify it renders**

Navigate to a lead detail page. Verify:
- Interaction history shows (empty initially)
- Clicking a phone result opens modal
- Submitting modal creates interaction and updates timeline
- Enrollment button appears when status is interested
- Sidebar shows new fields

**Step 3: Commit**

```bash
git add apps/tenant-admin/app/\(app\)/\(dashboard\)/inscripciones/\[id\]/page.tsx
git commit -m "feat(leads): add interaction history, contact modal, enrollment button to lead detail"
```

---

## Task 9: Final verification and cleanup

**Step 1: Build check**

```bash
pnpm -C apps/tenant-admin run build
```

Expected: Build succeeds with no type errors.

**Step 2: Remove the redirect from leads/[id]**

Update `apps/tenant-admin/app/(app)/(dashboard)/leads/[id]/page.tsx` to redirect to the correct path (inscripciones/[id] is still the detail page):

No change needed — the redirect already sends to `/inscripciones/${id}` which is the detail page we modified.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(leads): CRM v2 complete — interactions, enrollment flow, real KPIs"
git push origin feat/better-auth-integration
```
