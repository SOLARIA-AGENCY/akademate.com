import { authenticateNextLearningRequest } from '@/src/lib/learning/next-learning-auth'
import { withNextLearningTransaction } from '@/src/lib/learning/next-learning-transaction'
import { createNextFinanceConnection, listNextFinanceConnections, updateNextFinanceConnection } from '@/src/lib/finance/finance-connection-command'
import { createFinanceConnectionHandlers } from '@/src/lib/finance/finance-connection-handler'
import { currentFinanceRuntime } from '@/src/lib/finance/finance-runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handlers = createFinanceConnectionHandlers({
  runtime: currentFinanceRuntime,
  authenticate: authenticateNextLearningRequest,
  list: ({ identity }) => withNextLearningTransaction(identity, (tx, principal) => listNextFinanceConnections({ tx, principal, runtime: currentFinanceRuntime() })),
  create: ({ identity, payload }) => withNextLearningTransaction(identity, (tx, principal) => createNextFinanceConnection({ tx, principal, runtime: currentFinanceRuntime(), payload })),
  update: ({ identity, connectionId, payload }) => withNextLearningTransaction(identity, (tx, principal) => updateNextFinanceConnection({ tx, principal, runtime: currentFinanceRuntime(), connectionId, payload })),
})

export const GET = handlers.GET
export const POST = handlers.POST
