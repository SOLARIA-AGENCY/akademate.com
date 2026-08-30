export class AccountingSyncError extends Error {
  readonly code: string
  readonly safeSummary: string

  constructor(code: string, safeSummary: string, options?: ErrorOptions) {
    super(safeSummary, options)
    this.name = 'AccountingSyncError'
    this.code = code
    this.safeSummary = safeSummary
  }
}

export function sanitizeAccountingError(
  error: unknown,
  fallbackCode = 'ACCOUNTING_SYNC_FAILED',
  fallbackSummary = 'Accounting synchronization failed.'
): AccountingSyncError {
  return error instanceof AccountingSyncError
    ? error
    : new AccountingSyncError(fallbackCode, fallbackSummary)
}
