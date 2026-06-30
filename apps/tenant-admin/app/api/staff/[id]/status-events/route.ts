import { NextResponse, type NextRequest } from 'next/server'
import postgres from 'postgres'

const dbConnectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URI
const sql = dbConnectionString ? postgres(dbConnectionString) : null

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!sql) {
    return NextResponse.json(
      { success: false, error: 'DATABASE_URL is required for /api/staff/[id]/status-events' },
      { status: 503 },
    )
  }

  const { id } = await context.params
  const staffId = Number(id)
  if (!Number.isFinite(staffId)) {
    return NextResponse.json({ success: false, error: 'ID de personal no válido' }, { status: 400 })
  }

  const events = await sql`
    SELECT
      e.id,
      e.previous_status,
      e.new_status,
      e.reason,
      e.source,
      e.import_batch,
      e.changed_at,
      e.notes,
      COALESCE(u.id, CASE WHEN e.previous_status = 'created' THEN creator.id END) AS changed_by_id,
      COALESCE(u.name, CASE WHEN e.previous_status = 'created' THEN creator.name END) AS changed_by_name,
      COALESCE(u.email, CASE WHEN e.previous_status = 'created' THEN creator.email END) AS changed_by_email,
      CASE
        WHEN e.changed_by_id IS NULL
          AND e.previous_status = 'created'
          AND creator.id IS NOT NULL
        THEN true
        ELSE false
      END AS changed_by_fallback
    FROM staff_status_events e
    LEFT JOIN users u ON u.id = e.changed_by_id
    LEFT JOIN staff s ON s.id = e.staff_id
    LEFT JOIN users creator ON creator.id = s.created_by_id
    WHERE e.staff_id = ${staffId}
    ORDER BY e.changed_at DESC, e.id DESC
    LIMIT 100
  `

  return NextResponse.json({
    success: true,
    data: events.map((event) => ({
      id: event.id,
      previousStatus: event.previous_status,
      newStatus: event.new_status,
      reason: event.reason,
      source: event.source,
      importBatch: event.import_batch,
      changedAt: event.changed_at,
      notes: event.notes,
      changedById: event.changed_by_id,
      changedByName: event.changed_by_name,
      changedByEmail: event.changed_by_email,
      changedByFallback: event.changed_by_fallback,
    })),
  })
}
