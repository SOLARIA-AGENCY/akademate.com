import { authenticateNextLearningRequest } from '@/src/lib/learning/next-learning-auth'
import { withNextLearningTransaction } from '@/src/lib/learning/next-learning-transaction'
import { cancelNextEnrollment } from '@/src/lib/enrollments/enrollment-cancellation-command'
import { createEnrollmentCancellationHandlers } from '@/src/lib/enrollments/enrollment-cancellation-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handlers = createEnrollmentCancellationHandlers({
  runtime: () => process.env.AKADEMATE_RUNTIME,
  enabled: () => process.env.AKADEMATE_NEXT_ENROLLMENTS_ENABLED === 'true',
  authenticate: authenticateNextLearningRequest,
  cancel: ({ identity, enrollmentId, cancellationType, reason }) => withNextLearningTransaction(
    identity,
    (tx, principal) => cancelNextEnrollment({
      tx,
      principal,
      enrollmentId,
      cancellationType,
      reason,
    }),
  ),
})

export const POST = handlers.POST
