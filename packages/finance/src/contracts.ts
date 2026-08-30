export type AccountingTransactionKind = 'income' | 'expense' | 'transfer' | 'adjustment'
export type AccountingTransactionStatus = 'pending' | 'posted' | 'voided'

export interface AccountingConnectionScope {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly connectionId: string
  readonly provider: string
  readonly externalCompanyId: string
  readonly integrationMode: 'read_only'
  readonly connectionStatus: 'active'
}

export interface ExternalAccountingTransaction {
  readonly externalId: string
  readonly kind: AccountingTransactionKind
  readonly status: AccountingTransactionStatus
  readonly bookedOn: string
  readonly valueOn?: string | null
  readonly amount: string
  readonly currency: string
  readonly description?: string | null
  readonly counterpartyName?: string | null
  readonly accountCode?: string | null
  readonly costCenter?: string | null
  readonly reference?: string | null
  readonly sourceUpdatedAt?: string | null
}

export interface AccountingTransactionPage {
  readonly items: readonly ExternalAccountingTransaction[]
  readonly nextCursor: string | null
}

/** External accounting clients intentionally expose read operations only. */
export interface AccountingReadClient {
  readonly provider: string
  listTransactions(input: {
    readonly externalCompanyId: string
    readonly cursor: string | null
    readonly pageSize: number
  }): Promise<AccountingTransactionPage>
}

export interface ImportedAccountingTransaction extends ExternalAccountingTransaction {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly connectionId: string
  readonly sourceHash: string
  readonly sourceUpdatedAt: string | null
  readonly valueOn: string | null
  readonly description: string | null
  readonly counterpartyName: string | null
  readonly accountCode: string | null
  readonly costCenter: string | null
  readonly reference: string | null
}

export interface AccountingImportStore {
  beginSync(input: {
    readonly scope: AccountingConnectionScope
    readonly cursor: string | null
  }): Promise<{ readonly syncRunId: string }>

  upsertTransactions(input: {
    readonly scope: AccountingConnectionScope
    readonly syncRunId: string
    readonly transactions: readonly ImportedAccountingTransaction[]
  }): Promise<{ readonly upserted: number; readonly skipped: number }>

  completeSync(input: {
    readonly scope: AccountingConnectionScope
    readonly syncRunId: string
    readonly nextCursor: string | null
    readonly received: number
    readonly upserted: number
    readonly skipped: number
  }): Promise<void>

  failSync(input: {
    readonly scope: AccountingConnectionScope
    readonly syncRunId: string
    readonly errorCode: string
    readonly errorSummary: string
  }): Promise<void>
}

export interface AccountingSyncResult {
  readonly syncRunId: string
  readonly nextCursor: string | null
  readonly pages: number
  readonly received: number
  readonly upserted: number
  readonly skipped: number
}
