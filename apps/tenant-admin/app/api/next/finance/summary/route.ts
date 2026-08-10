import { authenticateNextLearningRequest } from '@/src/lib/learning/next-learning-auth'
import { withNextLearningTransaction } from '@/src/lib/learning/next-learning-transaction'
import { getNextFinanceSummary } from '@/src/lib/finance/finance-connection-command'
import { currentFinanceRuntime } from '@/src/lib/finance/finance-runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request): Promise<Response> {
  const runtime = currentFinanceRuntime()
  if (runtime.mode === 'disabled') return Response.json({ error: 'not_found' }, { status: 404 })
  const identity = await authenticateNextLearningRequest(request)
  if (!identity) return Response.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const result = await withNextLearningTransaction(identity, (tx, principal) => getNextFinanceSummary({ tx, principal, runtime }))
    return Response.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    if (error instanceof Error && error.message === 'finance_forbidden') return Response.json({ error: 'forbidden' }, { status: 403 })
    console.error('[Akademate Next Finance] Summary failed', error)
    return Response.json({ error: 'finance_service_unavailable' }, { status: 503 })
  }
}
