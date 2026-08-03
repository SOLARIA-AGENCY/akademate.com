import { authenticateNextLearningRequest } from '@/src/lib/learning/next-learning-auth'
import { withNextLearningTransaction } from '@/src/lib/learning/next-learning-transaction'
import { getNextDashboard } from '@/src/lib/dashboard/next-dashboard-command'
import { createNextDashboardHandlers } from '@/src/lib/dashboard/next-dashboard-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handlers = createNextDashboardHandlers({
  runtime: () => process.env.AKADEMATE_RUNTIME,
  enabled: () => process.env.AKADEMATE_NEXT_DASHBOARD_ENABLED === 'true',
  authenticate: authenticateNextLearningRequest,
  read: ({ identity }) => withNextLearningTransaction(
    identity,
    (tx, principal) => getNextDashboard({ tx, principal }),
  ),
})

export const GET = handlers.GET
