export {
  NextAuthenticatedInfrastructureError as NextLearningInfrastructureError,
  resolveNextDatabaseConfig as resolveNextLearningDatabaseConfig,
  withNextAuthenticatedTransaction as withNextLearningTransaction,
} from '../runtime/next-authenticated-transaction.ts'
export type {
  NextAuthenticatedIdentity as NextLearningIdentity,
  NextAuthenticatedPrincipal as NextLearningPrincipal,
  NextSqlClient as LearningSqlClient,
  NextSqlPool as LearningSqlPool,
  NextTransactionOptions as TransactionOptions,
} from '../runtime/next-authenticated-transaction.ts'
