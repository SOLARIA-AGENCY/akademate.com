import type { OperationalFinanceRecord } from './reconciliation'
import { AccountingSyncError } from './sync-error'

export type FinanceSnapshotRelationship =
  | string
  | number
  | { readonly id: string | number }
  | null
  | undefined

export interface EnrollmentFinanceSnapshot {
  readonly id: FinanceSnapshotRelationship
  readonly tenantId: string
  readonly legalEntityId: string
  /** Current cumulative Payload amount_paid, used only as a control total. */
  readonly amountPaid?: string | number | null
}

export interface EnrollmentPaymentEventSnapshot {
  readonly id: FinanceSnapshotRelationship
  readonly tenantId: string
  readonly legalEntityId: string
  readonly enrollment: FinanceSnapshotRelationship
  readonly status: 'pending' | 'partial' | 'paid' | 'overdue' | 'refunded'
  readonly amount: string | number
  readonly currency: string
  readonly paidAt?: string | Date | null
  readonly transactionReference?: string | null
}

export interface CampaignFinanceSnapshot {
  readonly id: FinanceSnapshotRelationship
  readonly tenantId: string
  readonly legalEntityId: string
}

export interface AdvertisingSpendSnapshot {
  readonly id: FinanceSnapshotRelationship
  readonly tenantId: string
  readonly legalEntityId: string
  readonly campaign: FinanceSnapshotRelationship
  readonly rangeSince: string
  readonly rangeUntil: string
  readonly amount: string | number | null
  readonly currency: string
  readonly metricState: 'loaded' | 'zero_real' | 'not_available' | 'api_error'
}

export interface OperationalFinanceProjectionInput {
  readonly targetTenantId: string
  readonly targetLegalEntityId: string
  readonly enrollments: readonly EnrollmentFinanceSnapshot[]
  readonly paymentEvents: readonly EnrollmentPaymentEventSnapshot[]
  readonly campaigns: readonly CampaignFinanceSnapshot[]
  readonly advertisingSpend: readonly AdvertisingSpendSnapshot[]
  readonly maxSourceRecords?: number
  readonly maxRelationshipRecords?: number
}

export type OperationalFinanceProjectionRecordType =
  | 'enrollment'
  | 'enrollment_payment'
  | 'campaign'
  | 'advertising_spend'

export type OperationalFinanceProjectionIssueCode =
  | 'scope_mismatch'
  | 'duplicate_record'
  | 'relationship_missing'
  | 'payment_status_invalid'
  | 'payment_refund_unsupported'
  | 'payment_date_missing'
  | 'invalid_amount'
  | 'invalid_currency'
  | 'invalid_date'
  | 'enrollment_payment_total_mismatch'
  | 'advertising_metric_unavailable'
  | 'advertising_range_not_daily'
  | 'advertising_zero_state_mismatch'

export interface OperationalFinanceProjectionIssue {
  readonly code: OperationalFinanceProjectionIssueCode
  readonly recordType: OperationalFinanceProjectionRecordType
  readonly recordId: string
  readonly relatedId?: string
}

export interface OperationalFinanceProjectionSummary {
  readonly sourceRecords: number
  readonly projectedRecords: number
  readonly ignoredRecords: number
  readonly blockedRecords: number
  readonly issues: number
}

export interface OperationalFinanceProjection {
  readonly mode: 'read_only_operational_projection'
  readonly canWrite: false
  readonly canApply: false
  readonly ready: boolean
  readonly records: readonly OperationalFinanceRecord[]
  readonly issues: readonly OperationalFinanceProjectionIssue[]
  readonly summary: OperationalFinanceProjectionSummary
}

interface PaymentCandidate {
  readonly sourceKey: string
  readonly enrollmentId: string
  readonly record: OperationalFinanceRecord
}

const DEFAULT_MAX_SOURCE_RECORDS = 10_000
const HARD_MAX_SOURCE_RECORDS = 100_000
const DEFAULT_MAX_RELATIONSHIP_RECORDS = 20_000
const HARD_MAX_RELATIONSHIP_RECORDS = 200_000
const CURRENCY_PATTERN = /^[A-Z]{3}$/
const MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/
const PAYMENT_STATUSES = new Set(['pending', 'partial', 'paid', 'overdue', 'refunded'])
const SPEND_STATES = new Set(['loaded', 'zero_real', 'not_available', 'api_error'])

/**
 * Projects event-level enrollment payments and daily advertising spend into
 * reconciliation records. Cumulative enrollment totals and multi-day Meta
 * ranges are controls only and are never invented as transaction events.
 */
export function projectOperationalFinanceRecords(
  input: OperationalFinanceProjectionInput
): OperationalFinanceProjection {
  assertProjectionInput(input)
  const issues: OperationalFinanceProjectionIssue[] = []
  const ignoredSourceKeys = new Set<string>()
  const enrollmentMap = buildParentMap(
    input.enrollments,
    'enrollment',
    input.targetTenantId,
    input.targetLegalEntityId,
    issues
  )
  const campaignMap = buildParentMap(
    input.campaigns,
    'campaign',
    input.targetTenantId,
    input.targetLegalEntityId,
    issues
  )
  const paymentCandidates: PaymentCandidate[] = []
  const paidTotalsByEnrollment = new Map<string, bigint>()
  const paymentIds = new Set<string>()

  for (const payment of input.paymentEvents) {
    const id = normalizeId(payment.id)
    const sourceKey = `payment:${id ?? 'invalid'}`
    if (!id) {
      addIssue(issues, {
        code: 'relationship_missing',
        recordType: 'enrollment_payment',
        recordId: 'invalid',
      })
      continue
    }
    if (paymentIds.has(id)) {
      addIssue(issues, {
        code: 'duplicate_record',
        recordType: 'enrollment_payment',
        recordId: id,
      })
      continue
    }
    paymentIds.add(id)
    if (
      payment.tenantId !== input.targetTenantId ||
      payment.legalEntityId !== input.targetLegalEntityId
    ) {
      addIssue(issues, {
        code: 'scope_mismatch',
        recordType: 'enrollment_payment',
        recordId: id,
      })
      continue
    }
    if (!PAYMENT_STATUSES.has(payment.status)) {
      addIssue(issues, {
        code: 'payment_status_invalid',
        recordType: 'enrollment_payment',
        recordId: id,
      })
      continue
    }
    if (payment.status === 'refunded') {
      addIssue(issues, {
        code: 'payment_refund_unsupported',
        recordType: 'enrollment_payment',
        recordId: id,
      })
      continue
    }
    if (payment.status !== 'paid') {
      ignoredSourceKeys.add(sourceKey)
      continue
    }

    const enrollmentId = normalizeId(payment.enrollment)
    if (!enrollmentId || !enrollmentMap.has(enrollmentId)) {
      addIssue(issues, {
        code: 'relationship_missing',
        recordType: 'enrollment_payment',
        recordId: id,
        ...(enrollmentId ? { relatedId: enrollmentId } : {}),
      })
      continue
    }
    const amount = tryMoney(payment.amount)
    if (amount === null || amount === 0n) {
      addIssue(issues, {
        code: 'invalid_amount',
        recordType: 'enrollment_payment',
        recordId: id,
      })
      continue
    }
    if (!CURRENCY_PATTERN.test(payment.currency)) {
      addIssue(issues, {
        code: 'invalid_currency',
        recordType: 'enrollment_payment',
        recordId: id,
      })
      continue
    }
    if (payment.paidAt == null) {
      addIssue(issues, {
        code: 'payment_date_missing',
        recordType: 'enrollment_payment',
        recordId: id,
      })
      continue
    }
    const occurredOn = tryIsoDate(payment.paidAt)
    if (!occurredOn) {
      addIssue(issues, {
        code: 'invalid_date',
        recordType: 'enrollment_payment',
        recordId: id,
      })
      continue
    }

    paidTotalsByEnrollment.set(
      enrollmentId,
      (paidTotalsByEnrollment.get(enrollmentId) ?? 0n) + amount
    )
    paymentCandidates.push({
      sourceKey,
      enrollmentId,
      record: {
        id: sourceKey,
        tenantId: input.targetTenantId,
        legalEntityId: input.targetLegalEntityId,
        source: 'enrollment_payment',
        occurredOn,
        amount: formatMoney(amount),
        currency: payment.currency,
        reference: normalizeReference(payment.transactionReference) ?? sourceKey,
      },
    })
  }

  const mismatchedEnrollments = new Set<string>()
  for (const [enrollmentId, enrollment] of enrollmentMap) {
    if (enrollment.amountPaid == null) continue
    const expected = tryMoney(enrollment.amountPaid)
    const actual = paidTotalsByEnrollment.get(enrollmentId) ?? 0n
    if (expected === null || expected !== actual) {
      mismatchedEnrollments.add(enrollmentId)
      issues.push({
        code: expected === null ? 'invalid_amount' : 'enrollment_payment_total_mismatch',
        recordType: 'enrollment',
        recordId: enrollmentId,
      })
    }
  }

  const records: OperationalFinanceRecord[] = []
  for (const candidate of paymentCandidates) {
    if (mismatchedEnrollments.has(candidate.enrollmentId)) {
      continue
    }
    records.push(candidate.record)
  }

  const spendIds = new Set<string>()
  for (const spend of input.advertisingSpend) {
    const id = normalizeId(spend.id)
    const sourceKey = `advertising_spend:${id ?? 'invalid'}`
    if (!id) {
      addIssue(issues, {
        code: 'relationship_missing',
        recordType: 'advertising_spend',
        recordId: 'invalid',
      })
      continue
    }
    if (spendIds.has(id)) {
      addIssue(issues, {
        code: 'duplicate_record',
        recordType: 'advertising_spend',
        recordId: id,
      })
      continue
    }
    spendIds.add(id)
    if (
      spend.tenantId !== input.targetTenantId ||
      spend.legalEntityId !== input.targetLegalEntityId
    ) {
      addIssue(issues, {
        code: 'scope_mismatch',
        recordType: 'advertising_spend',
        recordId: id,
      })
      continue
    }
    const campaignId = normalizeId(spend.campaign)
    if (!campaignId || !campaignMap.has(campaignId)) {
      addIssue(issues, {
        code: 'relationship_missing',
        recordType: 'advertising_spend',
        recordId: id,
        ...(campaignId ? { relatedId: campaignId } : {}),
      })
      continue
    }
    if (
      !SPEND_STATES.has(spend.metricState) ||
      ['not_available', 'api_error'].includes(spend.metricState)
    ) {
      addIssue(issues, {
        code: 'advertising_metric_unavailable',
        recordType: 'advertising_spend',
        recordId: id,
      })
      continue
    }
    const rangeSince = tryIsoDate(spend.rangeSince)
    const rangeUntil = tryIsoDate(spend.rangeUntil)
    if (!rangeSince || !rangeUntil) {
      addIssue(issues, {
        code: 'invalid_date',
        recordType: 'advertising_spend',
        recordId: id,
      })
      continue
    }
    if (rangeSince !== rangeUntil) {
      addIssue(issues, {
        code: 'advertising_range_not_daily',
        recordType: 'advertising_spend',
        recordId: id,
      })
      continue
    }
    const amount = tryMoney(spend.amount)
    if (amount === null) {
      addIssue(issues, {
        code: 'invalid_amount',
        recordType: 'advertising_spend',
        recordId: id,
      })
      continue
    }
    if (!CURRENCY_PATTERN.test(spend.currency)) {
      addIssue(issues, {
        code: 'invalid_currency',
        recordType: 'advertising_spend',
        recordId: id,
      })
      continue
    }
    if (spend.metricState === 'zero_real' && amount !== 0n) {
      addIssue(issues, {
        code: 'advertising_zero_state_mismatch',
        recordType: 'advertising_spend',
        recordId: id,
      })
      continue
    }
    if (amount === 0n) {
      ignoredSourceKeys.add(sourceKey)
      continue
    }
    records.push({
      id: sourceKey,
      tenantId: input.targetTenantId,
      legalEntityId: input.targetLegalEntityId,
      source: 'advertising_spend',
      occurredOn: rangeUntil,
      amount: formatMoney(amount),
      currency: spend.currency,
      reference: `meta:${campaignId}:${rangeUntil}`,
    })
  }

  records.sort(
    (left, right) => left.source.localeCompare(right.source) || left.id.localeCompare(right.id)
  )
  issues.sort(
    (left, right) =>
      left.recordType.localeCompare(right.recordType) ||
      left.recordId.localeCompare(right.recordId) ||
      left.code.localeCompare(right.code)
  )
  const sourceRecords = input.paymentEvents.length + input.advertisingSpend.length

  return {
    mode: 'read_only_operational_projection',
    canWrite: false,
    canApply: false,
    ready: issues.length === 0,
    records,
    issues,
    summary: {
      sourceRecords,
      projectedRecords: records.length,
      ignoredRecords: ignoredSourceKeys.size,
      blockedRecords: Math.max(0, sourceRecords - records.length - ignoredSourceKeys.size),
      issues: issues.length,
    },
  }
}

function buildParentMap<T extends EnrollmentFinanceSnapshot | CampaignFinanceSnapshot>(
  records: readonly T[],
  recordType: 'enrollment' | 'campaign',
  targetTenantId: string,
  targetLegalEntityId: string,
  issues: OperationalFinanceProjectionIssue[]
): Map<string, T> {
  const result = new Map<string, T>()
  for (const record of records) {
    const id = normalizeId(record.id)
    if (!id) {
      issues.push({ code: 'relationship_missing', recordType, recordId: 'invalid' })
      continue
    }
    if (result.has(id)) {
      issues.push({ code: 'duplicate_record', recordType, recordId: id })
      continue
    }
    if (record.tenantId !== targetTenantId || record.legalEntityId !== targetLegalEntityId) {
      issues.push({ code: 'scope_mismatch', recordType, recordId: id })
      continue
    }
    result.set(id, record)
  }
  return result
}

function assertProjectionInput(input: OperationalFinanceProjectionInput): void {
  if (!validIdentifier(input.targetTenantId) || !validIdentifier(input.targetLegalEntityId)) {
    throw new AccountingSyncError(
      'FINANCE_OPERATIONAL_PROJECTION_INVALID_SCOPE',
      'Operational finance projection scope is invalid.'
    )
  }
  const maxSourceRecords = input.maxSourceRecords ?? DEFAULT_MAX_SOURCE_RECORDS
  if (
    !Number.isSafeInteger(maxSourceRecords) ||
    maxSourceRecords < 1 ||
    maxSourceRecords > HARD_MAX_SOURCE_RECORDS
  ) {
    throw new AccountingSyncError(
      'FINANCE_OPERATIONAL_PROJECTION_INVALID_LIMIT',
      'Operational finance projection limit is invalid.'
    )
  }
  if (input.paymentEvents.length + input.advertisingSpend.length > maxSourceRecords) {
    throw new AccountingSyncError(
      'FINANCE_OPERATIONAL_PROJECTION_LIMIT_EXCEEDED',
      'Operational finance projection exceeds its bounded size.'
    )
  }

  const maxRelationshipRecords = input.maxRelationshipRecords ?? DEFAULT_MAX_RELATIONSHIP_RECORDS
  if (
    !Number.isSafeInteger(maxRelationshipRecords) ||
    maxRelationshipRecords < 1 ||
    maxRelationshipRecords > HARD_MAX_RELATIONSHIP_RECORDS
  ) {
    throw new AccountingSyncError(
      'FINANCE_OPERATIONAL_PROJECTION_INVALID_RELATIONSHIP_LIMIT',
      'Operational finance projection relationship limit is invalid.'
    )
  }
  if (input.enrollments.length + input.campaigns.length > maxRelationshipRecords) {
    throw new AccountingSyncError(
      'FINANCE_OPERATIONAL_PROJECTION_RELATIONSHIP_LIMIT_EXCEEDED',
      'Operational finance projection relationships exceed their bounded size.'
    )
  }
}

function addIssue(
  issues: OperationalFinanceProjectionIssue[],
  issue: OperationalFinanceProjectionIssue
): void {
  issues.push(issue)
}

function normalizeId(value: FinanceSnapshotRelationship): string | null {
  const raw = typeof value === 'object' && value !== null ? value.id : value
  if ((typeof raw !== 'string' && typeof raw !== 'number') || !validIdentifier(String(raw))) {
    return null
  }
  return String(raw)
}

function validIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 255
}

function tryMoney(value: string | number | null): bigint | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) return null
    const scaled = value * 100
    const rounded = Math.round(scaled)
    if (!Number.isSafeInteger(rounded) || Math.abs(scaled - rounded) > 1e-7) return null
    return BigInt(rounded)
  }
  if (typeof value !== 'string' || !MONEY_PATTERN.test(value)) return null
  const [integer, decimals = ''] = value.split('.')
  return BigInt(integer!) * 100n + BigInt(decimals.padEnd(2, '0'))
}

function formatMoney(value: bigint): string {
  const integer = value / 100n
  const decimals = String(value % 100n).padStart(2, '0')
  return `${integer}.${decimals}`
}

function tryIsoDate(value: string | Date): string | null {
  const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (parsed.toISOString().slice(0, 10) !== value) return null
  }
  return parsed.toISOString().slice(0, 10)
}

function normalizeReference(value: string | null | undefined): string | null {
  if (value == null) return null
  const normalized = value.trim()
  return normalized.length > 0 && normalized.length <= 255 ? normalized : null
}
