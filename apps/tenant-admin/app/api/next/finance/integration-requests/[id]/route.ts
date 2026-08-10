import { authenticateNextLearningRequest } from '@/src/lib/learning/next-learning-auth'
import { withNextLearningTransaction } from '@/src/lib/learning/next-learning-transaction'
import { cancelFinanceIntegrationRequest, getFinanceIntegrationRequest } from '@/src/lib/finance/finance-integration-request-command'
import { createFinanceIntegrationRequestHandlers } from '@/src/lib/finance/finance-integration-request-handler'
import { currentFinanceRuntime } from '@/src/lib/finance/finance-runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handlers = createFinanceIntegrationRequestHandlers({
  runtime: currentFinanceRuntime,
  authenticate: authenticateNextLearningRequest,
  list: async () => ({ items: [] }),
  create: async () => { throw new Error('not_supported') },
  detail: ({ identity, requestId }) => withNextLearningTransaction(identity, (tx, principal) => getFinanceIntegrationRequest({ tx, principal, runtime: currentFinanceRuntime(), requestId })),
  cancel: ({ identity, requestId }) => withNextLearningTransaction(identity, (tx, principal) => cancelFinanceIntegrationRequest({ tx, principal, runtime: currentFinanceRuntime(), requestId })),
})

export const GET = handlers.DETAIL
export const PATCH = handlers.PATCH
