import { createHash } from 'node:crypto'
import type {
  AccountingConnectionScope,
  ExternalAccountingTransaction,
  ImportedAccountingTransaction,
} from './contracts'
import { AccountingSyncError } from './sync-error'

const AMOUNT_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d{1,2})?$/
const CURRENCY_PATTERN = /^[A-Z]{3}$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TRANSACTION_KINDS = new Set(['income', 'expense', 'transfer', 'adjustment'])
const TRANSACTION_STATUSES = new Set(['pending', 'posted', 'voided'])

export function normalizeAccountingTransactions(
  scope: AccountingConnectionScope,
  items: readonly ExternalAccountingTransaction[]
): readonly ImportedAccountingTransaction[] {
  const externalIds = new Set<string>()

  return items.map((item, index) => {
    const externalId = requireText(item.externalId, `items[${index}].externalId`, 255)

    if (externalIds.has(externalId)) {
      throw new AccountingSyncError(
        'ACCOUNTING_DUPLICATE_EXTERNAL_ID',
        `Duplicate external transaction at item ${index}.`
      )
    }
    externalIds.add(externalId)

    if (!AMOUNT_PATTERN.test(item.amount)) {
      throw invalidRecord(index, 'amount must be a canonical decimal with at most two places')
    }
    if (!TRANSACTION_KINDS.has(item.kind)) {
      throw invalidRecord(index, 'kind is unsupported')
    }
    if (!TRANSACTION_STATUSES.has(item.status)) {
      throw invalidRecord(index, 'status is unsupported')
    }
    if (!CURRENCY_PATTERN.test(item.currency)) {
      throw invalidRecord(index, 'currency must be an uppercase ISO-4217 code')
    }
    if (!isValidIsoDate(item.bookedOn)) {
      throw invalidRecord(index, 'bookedOn must be a real ISO date')
    }
    if (item.valueOn != null && !isValidIsoDate(item.valueOn)) {
      throw invalidRecord(index, 'valueOn must be a real ISO date')
    }

    const sourceUpdatedAt = normalizeTimestamp(item.sourceUpdatedAt, index)
    const normalizedSource = {
      externalId,
      kind: item.kind,
      status: item.status,
      bookedOn: item.bookedOn,
      valueOn: item.valueOn ?? null,
      amount: item.amount,
      currency: item.currency,
      description: optionalText(item.description, `items[${index}].description`, 2_000),
      counterpartyName: optionalText(
        item.counterpartyName,
        `items[${index}].counterpartyName`,
        500
      ),
      accountCode: optionalText(item.accountCode, `items[${index}].accountCode`, 100),
      costCenter: optionalText(item.costCenter, `items[${index}].costCenter`, 100),
      reference: optionalText(item.reference, `items[${index}].reference`, 500),
      sourceUpdatedAt,
    } as const

    return {
      tenantId: scope.tenantId,
      legalEntityId: scope.legalEntityId,
      connectionId: scope.connectionId,
      ...normalizedSource,
      sourceHash: createHash('sha256').update(JSON.stringify(normalizedSource)).digest('hex'),
    }
  })
}

function normalizeTimestamp(value: string | null | undefined, index: number): string | null {
  if (value == null) {
    return null
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw invalidRecord(index, 'sourceUpdatedAt must be an ISO timestamp')
  }

  return parsed.toISOString()
}

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function requireText(value: string, field: string, maxLength: number): string {
  const normalized = value.trim()
  if (normalized.length === 0 || normalized.length > maxLength) {
    throw new AccountingSyncError('ACCOUNTING_INVALID_RECORD', `${field} is invalid.`)
  }
  return normalized
}

function optionalText(
  value: string | null | undefined,
  field: string,
  maxLength: number
): string | null {
  if (value == null) {
    return null
  }

  const normalized = value.trim()
  if (normalized.length > maxLength) {
    throw new AccountingSyncError('ACCOUNTING_INVALID_RECORD', `${field} is too long.`)
  }
  return normalized.length === 0 ? null : normalized
}

function invalidRecord(index: number, reason: string): AccountingSyncError {
  return new AccountingSyncError(
    'ACCOUNTING_INVALID_RECORD',
    `Invalid external accounting item ${index}: ${reason}.`
  )
}
