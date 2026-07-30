import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'
import { buildFinanceScopeWhere, getScopeBindingsForUser } from '@/src/access/scopedOrganizationAccess'
import { aggregateFinanceEntries, type FinanceEntryForReport } from '@/src/domain/financeReporting'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload as never)
  if (!auth?.tenantId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const bindings = await getScopeBindingsForUser(payload, auth.tenantId, auth.userId)
  const result = await payload.find({
    collection: 'finance-entries',
    where: buildFinanceScopeWhere(auth.tenantId, bindings),
    depth: 1,
    limit: 5000,
    sort: '-date',
    overrideAccess: true,
  })
  const rows = aggregateFinanceEntries(result.docs as FinanceEntryForReport[])
  const totals = rows.reduce((sum, row) => ({
    income: sum.income + row.income,
    expense: sum.expense + row.expense,
    net: sum.net + row.net,
    entries: sum.entries + row.entries,
  }), { income: 0, expense: 0, net: 0, entries: 0 })
  return NextResponse.json({ rows, totals })
}
