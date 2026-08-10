import { authenticateNextLearningRequest } from '@/src/lib/learning/next-learning-auth'
import { withNextLearningTransaction } from '@/src/lib/learning/next-learning-transaction'
import { updateNextFinanceConnection } from '@/src/lib/finance/finance-connection-command'
import { createFinanceConnectionHandlers } from '@/src/lib/finance/finance-connection-handler'
import { currentFinanceRuntime } from '@/src/lib/finance/finance-runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handlers = createFinanceConnectionHandlers({
  runtime: currentFinanceRuntime,
  authenticate: authenticateNextLearningRequest,
  list: async () => ({ items: [] }),
  create: async () => { throw new Error('not_supported') },
  update: ({ identity, connectionId, payload }) => withNextLearningTransaction(identity, (tx, principal) => updateNextFinanceConnection({ tx, principal, runtime: currentFinanceRuntime(), connectionId, payload })),
})

export const PATCH = handlers.PATCH
