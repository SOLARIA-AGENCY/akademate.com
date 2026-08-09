import { authenticateNextLearningRequest } from '@/src/lib/learning/next-learning-auth'
import { withNextLearningTransaction } from '@/src/lib/learning/next-learning-transaction'
import { createEventTicketTypeHandlers } from '@/src/lib/offers/event-ticket-type-handler'
import {
  deleteNextEventTicketType,
  listNextEventTicketTypes,
  upsertNextEventTicketType,
} from '@/src/lib/offers/event-ticket-type-command'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handlers = createEventTicketTypeHandlers({
  runtime: () => process.env.AKADEMATE_RUNTIME,
  enabled: () => process.env.AKADEMATE_NEXT_OFFERS_ENABLED === 'true',
  authenticate: authenticateNextLearningRequest,
  list: ({ identity, courseRunId }) =>
    withNextLearningTransaction(identity, (tx, principal) =>
      listNextEventTicketTypes({ tx, principal, courseRunId })
    ),
  upsert: ({ identity, courseRunId, body }) =>
    withNextLearningTransaction(identity, (tx, principal) =>
      upsertNextEventTicketType({ tx, principal, courseRunId, input: body })
    ),
  remove: ({ identity, courseRunId, ticketTypeId }) =>
    withNextLearningTransaction(identity, (tx, principal) =>
      deleteNextEventTicketType({ tx, principal, courseRunId, ticketTypeId })
    ),
})

export const GET = handlers.GET
export const POST = handlers.POST
