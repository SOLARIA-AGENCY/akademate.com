import { createInternalFinanceRequestVerifier, createFinanceDrainHandler } from '@/src/lib/finance/finance-drain-handler'
import { currentFinanceRuntime } from '@/src/lib/finance/finance-runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const verifier = createInternalFinanceRequestVerifier({ key: process.env.AKADEMATE_NEXT_FINANCE_DRAINER_HMAC_KEY ?? '' })

const handlers = createFinanceDrainHandler({
  runtime: currentFinanceRuntime,
  verifyInternalRequest: (request) => verifier.verify(request),
  claim: async () => null,
  execute: async () => { throw new Error('finance_drain_not_wired') },
  finish: async () => undefined,
})

export const POST = handlers.POST
