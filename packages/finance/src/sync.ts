import type {
  AccountingConnectionScope,
  AccountingImportStore,
  AccountingReadClient,
  AccountingSyncResult,
} from './contracts'
import { normalizeAccountingTransactions } from './normalize'
import { AccountingSyncError, sanitizeAccountingError } from './sync-error'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface SynchronizeAccountingInput {
  readonly scope: AccountingConnectionScope
  readonly client: AccountingReadClient
  readonly store: AccountingImportStore
  readonly cursor?: string | null
  readonly pageSize?: number
  readonly maxPages?: number
}

export async function synchronizeAccountingReadModel(
  input: SynchronizeAccountingInput
): Promise<AccountingSyncResult> {
  assertAccountingReadBinding(input.scope, input.client)

  const pageSize = input.pageSize ?? 200
  const maxPages = input.maxPages ?? 100
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 500) {
    throw new AccountingSyncError(
      'ACCOUNTING_INVALID_PAGE_SIZE',
      'Accounting pageSize must be between 1 and 500.'
    )
  }
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 1_000) {
    throw new AccountingSyncError(
      'ACCOUNTING_INVALID_MAX_PAGES',
      'Accounting maxPages must be between 1 and 1000.'
    )
  }

  let cursor = input.cursor ?? null
  const seenCursors = new Set<string>(cursor === null ? [] : [cursor])
  const { syncRunId } = await input.store.beginSync({ scope: input.scope, cursor })
  let pages = 0
  let received = 0
  let upserted = 0
  let skipped = 0

  try {
    while (true) {
      let page
      try {
        page = await input.client.listTransactions({
          externalCompanyId: input.scope.externalCompanyId,
          cursor,
          pageSize,
        })
      } catch (error) {
        throw sanitizeAccountingError(
          error,
          'ACCOUNTING_PROVIDER_READ_FAILED',
          'External accounting read failed.'
        )
      }

      pages += 1
      received += page.items.length

      const transactions = normalizeAccountingTransactions(input.scope, page.items)
      const persisted = await input.store.upsertTransactions({
        scope: input.scope,
        syncRunId,
        transactions,
      })

      if (
        !Number.isInteger(persisted.upserted) ||
        !Number.isInteger(persisted.skipped) ||
        persisted.upserted < 0 ||
        persisted.skipped < 0 ||
        persisted.upserted + persisted.skipped !== transactions.length
      ) {
        throw new AccountingSyncError(
          'ACCOUNTING_STORE_COUNT_MISMATCH',
          'Accounting import store returned inconsistent record counts.'
        )
      }
      upserted += persisted.upserted
      skipped += persisted.skipped

      if (page.nextCursor === null) {
        await input.store.completeSync({
          scope: input.scope,
          syncRunId,
          nextCursor: null,
          received,
          upserted,
          skipped,
        })
        return { syncRunId, nextCursor: null, pages, received, upserted, skipped }
      }

      if (page.nextCursor.length === 0 || seenCursors.has(page.nextCursor)) {
        throw new AccountingSyncError(
          'ACCOUNTING_CURSOR_DID_NOT_ADVANCE',
          'External accounting cursor did not advance.'
        )
      }
      if (pages >= maxPages) {
        throw new AccountingSyncError(
          'ACCOUNTING_PAGE_LIMIT_REACHED',
          'External accounting sync reached its configured page limit.'
        )
      }

      seenCursors.add(page.nextCursor)
      cursor = page.nextCursor
    }
  } catch (error) {
    const safeError = sanitizeAccountingError(error)
    await input.store.failSync({
      scope: input.scope,
      syncRunId,
      errorCode: safeError.code,
      errorSummary: safeError.safeSummary,
    })
    throw safeError
  }
}

export function assertAccountingReadBinding(
  scope: AccountingConnectionScope,
  client: AccountingReadClient
): void {
  if (scope.connectionStatus !== 'active') {
    throw new AccountingSyncError(
      'ACCOUNTING_CONNECTION_INACTIVE',
      'Accounting connection must be active before synchronization.'
    )
  }

  if (scope.integrationMode !== 'read_only') {
    throw new AccountingSyncError(
      'ACCOUNTING_INTEGRATION_NOT_READ_ONLY',
      'Accounting synchronization requires a read-only connection.'
    )
  }

  for (const [field, value] of Object.entries({
    tenantId: scope.tenantId,
    legalEntityId: scope.legalEntityId,
    connectionId: scope.connectionId,
  })) {
    if (!UUID_PATTERN.test(value.trim())) {
      throw new AccountingSyncError(
        'ACCOUNTING_INVALID_SCOPE',
        `Accounting connection scope field ${field} must be a UUID.`
      )
    }
  }

  const externalCompanyId = scope.externalCompanyId.trim()
  if (
    externalCompanyId.length === 0 ||
    externalCompanyId.length > 255 ||
    externalCompanyId !== scope.externalCompanyId
  ) {
    throw new AccountingSyncError(
      'ACCOUNTING_INVALID_SCOPE',
      'Accounting connection scope field externalCompanyId is invalid.'
    )
  }

  const provider = scope.provider.trim()
  if (provider.length === 0 || provider.length > 100 || provider !== scope.provider) {
    throw new AccountingSyncError(
      'ACCOUNTING_INVALID_SCOPE',
      'Accounting connection scope field provider is invalid.'
    )
  }

  if (client.provider !== provider) {
    throw new AccountingSyncError(
      'ACCOUNTING_PROVIDER_MISMATCH',
      'Accounting client does not match the configured connection provider.'
    )
  }
}
