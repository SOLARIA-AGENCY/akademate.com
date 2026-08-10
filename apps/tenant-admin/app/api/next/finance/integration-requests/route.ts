import { authenticateNextLearningRequest } from '@/src/lib/learning/next-learning-auth'
import { withNextLearningTransaction } from '@/src/lib/learning/next-learning-transaction'
import { createFinanceIntegrationRequest, listFinanceIntegrationRequests } from '@/src/lib/finance/finance-integration-request-command'
import { createFinanceIntegrationRequestHandlers } from '@/src/lib/finance/finance-integration-request-handler'
import { currentFinanceRuntime } from '@/src/lib/finance/finance-runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handlers = createFinanceIntegrationRequestHandlers({
  runtime: currentFinanceRuntime,
  authenticate: authenticateNextLearningRequest,
  list: ({ identity }) => withNextLearningTransaction(identity, (tx, principal) => listFinanceIntegrationRequests({ tx, principal, runtime: currentFinanceRuntime() })),
  create: ({ identity, payload }) => withNextLearningTransaction(identity, (tx, principal) => createFinanceIntegrationRequest({ tx, principal, runtime: currentFinanceRuntime(), payload })),
  detail: async () => { throw new Error('not_supported') },
  cancel: async () => { throw new Error('not_supported') },
})

export const GET = handlers.GET
export const POST = handlers.POST
