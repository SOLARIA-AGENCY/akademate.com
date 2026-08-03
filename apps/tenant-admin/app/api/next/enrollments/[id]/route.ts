import { authenticateNextLearningRequest } from '@/src/lib/learning/next-learning-auth'
import { withNextLearningTransaction } from '@/src/lib/learning/next-learning-transaction'
import { getNextEnrollmentDetail } from '@/src/lib/enrollments/enrollment-detail-command'
import { createEnrollmentDetailHandlers } from '@/src/lib/enrollments/enrollment-detail-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handlers = createEnrollmentDetailHandlers({
  runtime: () => process.env.AKADEMATE_RUNTIME,
  enabled: () => process.env.AKADEMATE_NEXT_ENROLLMENTS_ENABLED === 'true',
  authenticate: authenticateNextLearningRequest,
  read: ({ identity, enrollmentId }) => withNextLearningTransaction(
    identity,
    (tx, principal) => getNextEnrollmentDetail({ tx, principal, enrollmentId }),
  ),
})

export const GET = handlers.GET
