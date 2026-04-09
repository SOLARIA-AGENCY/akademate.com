import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '../_lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool

    const authSession = await getAuthenticatedUserContext(request, payload)
    const tenantId = authSession?.tenantId ?? null
    if (tenantId === null) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (!drizzle?.execute) {
      console.error('[LeadsDashboard] No drizzle.execute available')
      throw new Error('DB not available')
    }

    const whereTenant = `WHERE tenant_id = ${tenantId}`
    const andTenant = `AND l.tenant_id = ${tenantId}`

    const query = async (sql: string) => {
      const res = await drizzle.execute(sql)
      const rows = Array.isArray(res) ? res : (res?.rows ?? [])
      return rows[0] ?? {}
    }

    const queryAll = async (sql: string) => {
      const res = await drizzle.execute(sql)
      return Array.isArray(res) ? res : (res?.rows ?? [])
    }

    const totalLeads = parseInt((await query(`SELECT COUNT(*) as cnt FROM leads ${whereTenant}`)).cnt ?? '0')

    const newThisMonth = parseInt(
      (await query(`SELECT COUNT(*) as cnt FROM leads WHERE tenant_id = ${tenantId} AND created_at >= date_trunc('month', CURRENT_DATE)`)).cnt ?? '0',
    )

    const unattended = parseInt(
      (await query(`
        SELECT COUNT(*) as cnt FROM leads l
        WHERE l.status = 'new'
          AND l.created_at < NOW() - INTERVAL '24 hours'
          ${andTenant}
          AND NOT EXISTS (SELECT 1 FROM lead_interactions li WHERE li.lead_id = l.id)
      `)).cnt ?? '0',
    )

    const enrolled = parseInt((await query(`SELECT COUNT(*) as cnt FROM leads WHERE tenant_id = ${tenantId} AND status = 'enrolled'`)).cnt ?? '0')
    const conversionRate = totalLeads > 0 ? Math.round((enrolled / totalLeads) * 1000) / 10 : 0

    const avgTimeRow = await query(`
      SELECT AVG(EXTRACT(EPOCH FROM (fi.first_at - l.created_at)) / 3600) as avg_hours
      FROM leads l
      INNER JOIN (
        SELECT lead_id, MIN(created_at) as first_at FROM lead_interactions GROUP BY lead_id
      ) fi ON fi.lead_id = l.id
      WHERE l.tenant_id = ${tenantId}
    `)
    const avgResponseHours = Math.round(parseFloat(avgTimeRow?.avg_hours ?? '0') * 10) / 10

    const openEnrollments = parseInt(
      (await query(`SELECT COUNT(*) as cnt FROM leads WHERE tenant_id = ${tenantId} AND status = 'enrolling'`)).cnt ?? '0',
    )

    const breakdownRows = await queryAll(
      `SELECT status, COUNT(*) as cnt FROM leads WHERE tenant_id = ${tenantId} AND status IN ('contacted', 'following_up', 'interested', 'on_hold') GROUP BY status`,
    )
    const followUpBreakdown: Record<string, number> = {}
    for (const row of breakdownRows) {
      followUpBreakdown[row.status] = parseInt(row.cnt)
    }

    const convertedThisMonth = parseInt(
      (await query(`SELECT COUNT(*) as cnt FROM leads WHERE tenant_id = ${tenantId} AND status = 'enrolled' AND updated_at >= date_trunc('month', CURRENT_DATE)`)).cnt ?? '0',
    )

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
      totalLeads: 0, newThisMonth: 0, unattended: 0, conversionRate: 0,
      avgResponseHours: 0, openEnrollments: 0, followUpBreakdown: {}, convertedThisMonth: 0,
    })
  }
}
