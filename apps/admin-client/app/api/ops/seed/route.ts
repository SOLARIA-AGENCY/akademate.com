import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ops/seed
 * Seeds CEP Comunicación as the first enterprise client.
 * Idempotent — skips insert if slug already exists.
 */
export async function POST() {
  const db = getDb()

  try {
    // Check if CEP Comunicación already exists
    const existing = await db.query(
      "SELECT id FROM tenants WHERE slug = 'cep-comunicacion'",
    )

    if (existing.rows.length > 0) {
      return NextResponse.json({
        message: 'CEP Comunicación ya existe',
        id: existing.rows[0]?.id,
        skipped: true,
      })
    }

    const result = await db.query(
      `INSERT INTO tenants (
        name, slug, domain,
        contact_email, contact_phone,
        notes,
        limits_max_users,
        limits_max_courses,
        limits_max_leads_per_month,
        limits_storage_quota_m_b,
        active, created_at, updated_at
      ) VALUES (
        'CEP Comunicación', 'cep-comunicacion', 'cepcomunicacion.com',
        'info@cepcomunicacion.com', '+34 922 000 000',
        'Cliente enterprise — comunicación y formación en Tenerife. Plan Enterprise €1200/mes.',
        500, 999, 50000, 102400,
        true, NOW(), NOW()
      ) RETURNING id, name, slug`,
    )

    return NextResponse.json({
      message: 'CEP Comunicación creado correctamente',
      doc: result.rows[0],
    }, { status: 201 })
  } catch (error) {
    console.error('[ops/seed] Error', error)
    return NextResponse.json({ error: 'Error al crear seed' }, { status: 500 })
  }
}
