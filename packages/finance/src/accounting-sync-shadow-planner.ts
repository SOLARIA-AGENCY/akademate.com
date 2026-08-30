import type {
  AccountingReadSourceKey,
  AccountingReadSourceResolver,
  ResolvedAccountingReadSource,
} from './accounting-source-registry'
import type { AccountingImportStore } from './contracts'
import { assertAccountingReadBinding, type SynchronizeAccountingInput } from './sync'
import { AccountingSyncError } from './sync-error'

export const ACCOUNTING_SYNC_SHADOW_PLANNER_FLAG =
  'AKADEMATE_CEP_FINANCE_ACCOUNTING_SYNC_SHADOW_ENABLED'
export const ACCOUNTING_SYNC_SHADOW_PLANNER_ENVIRONMENT = 'AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT'
export const ACCOUNTING_SYNC_SHADOW_EXPECTED_ENTITIES = 3

export type AccountingSyncShadowCandidateRole = 'existing_entity' | 'cep_sur_pilot_candidate'

export interface AccountingSyncShadowCandidate {
  readonly source: AccountingReadSourceKey
  readonly role: AccountingSyncShadowCandidateRole
  readonly reviewReference: string
  readonly pilotReviewReference?: string
  readonly store: AccountingImportStore
}

export interface AccountingSyncShadowPlannerOptions {
  readonly resolver: Pick<AccountingReadSourceResolver, 'resolveBatch'>
  readonly candidates: readonly AccountingSyncShadowCandidate[]
}

export type AccountingSyncShadowPlannerGateReason =
  | 'flag_disabled'
  | 'environment_missing_or_invalid'
  | 'production_forbidden'
  | 'staging_enabled'

export type AccountingSyncShadowPlannerGate =
  | {
      readonly enabled: false
      readonly reason: Exclude<AccountingSyncShadowPlannerGateReason, 'staging_enabled'>
    }
  | { readonly enabled: true; readonly reason: 'staging_enabled' }

export interface AccountingSyncShadowPlanObservation {
  readonly schemaVersion: 1
  readonly mode: 'three_entity_accounting_sync_shadow_plan'
  readonly verdict: 'prepared'
  readonly canReadProvider: false
  readonly canWriteProvider: false
  readonly canWriteLocal: false
  readonly canApply: false
  readonly metrics: {
    readonly expectedEntities: 3
    readonly preparedEntities: 3
    readonly isolatedSources: 3
    readonly isolatedStores: 3
    readonly pilotCandidates: 1
  }
}

export type AccountingSyncShadowPlannerResult =
  | {
      readonly status: 'skipped'
      readonly reason: Exclude<AccountingSyncShadowPlannerGateReason, 'staging_enabled'>
      readonly canReadProvider: false
      readonly canWriteProvider: false
      readonly canWriteLocal: false
      readonly canApply: false
    }
  | {
      readonly status: 'failed'
      readonly reason: 'source_resolution_failed' | 'source_validation_failed'
      readonly canReadProvider: false
      readonly canWriteProvider: false
      readonly canWriteLocal: false
      readonly canApply: false
    }
  | {
      readonly status: 'observed'
      readonly reason: 'sync_plan_prepared'
      readonly canReadProvider: false
      readonly canWriteProvider: false
      readonly canWriteLocal: false
      readonly canApply: false
      readonly observation: AccountingSyncShadowPlanObservation
      readonly serializedObservation: string
    }

export interface AccountingSyncShadowPlanner {
  readonly schemaVersion: 1
  readonly mode: 'three_entity_accounting_sync_shadow_plan'
  readonly canReadProvider: false
  readonly canWriteProvider: false
  readonly canWriteLocal: false
  readonly canApply: false
  run(
    environment?: Readonly<Record<string, string | undefined>>
  ): Promise<AccountingSyncShadowPlannerResult>
}

export interface PreparedAccountingSyncCandidate extends AccountingSyncShadowCandidate {
  readonly source: AccountingReadSourceKey
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/

/**
 * Prepares, but never executes, three independent accounting synchronization
 * jobs. Provider reads and local store methods remain unreachable by design.
 */
export function createAccountingSyncShadowPlanner(
  options: AccountingSyncShadowPlannerOptions
): AccountingSyncShadowPlanner {
  const candidates = prepareAccountingSyncCandidates(options?.candidates)
  const resolveBatch = captureResolver(options?.resolver)

  return Object.freeze({
    schemaVersion: 1,
    mode: 'three_entity_accounting_sync_shadow_plan',
    canReadProvider: false,
    canWriteProvider: false,
    canWriteLocal: false,
    canApply: false,
    run: (environment?: Readonly<Record<string, string | undefined>>) =>
      runPreparedPlanner(candidates, resolveBatch, environment),
  })
}

export function resolveAccountingSyncShadowPlannerGate(
  environment: Readonly<Record<string, string | undefined>> = process.env
): AccountingSyncShadowPlannerGate {
  if (environment[ACCOUNTING_SYNC_SHADOW_PLANNER_FLAG] !== 'true') {
    return { enabled: false, reason: 'flag_disabled' }
  }
  const explicitEnvironment =
    environment[ACCOUNTING_SYNC_SHADOW_PLANNER_ENVIRONMENT]?.trim().toLowerCase()
  if (explicitEnvironment === 'production') {
    return { enabled: false, reason: 'production_forbidden' }
  }
  if (explicitEnvironment !== 'staging') {
    return { enabled: false, reason: 'environment_missing_or_invalid' }
  }
  return { enabled: true, reason: 'staging_enabled' }
}

async function runPreparedPlanner(
  candidates: readonly PreparedAccountingSyncCandidate[],
  resolveBatch: AccountingReadSourceResolver['resolveBatch'],
  environment?: Readonly<Record<string, string | undefined>>
): Promise<AccountingSyncShadowPlannerResult> {
  const gate = resolveAccountingSyncShadowPlannerGate(environment)
  if (gate.enabled === false) return skippedResult(gate.reason)

  let sources: readonly ResolvedAccountingReadSource[]
  try {
    sources = await resolveBatch({
      tenantId: candidates[0]!.source.tenantId,
      sources: candidates.map(({ source }) => source),
      maxConnections: ACCOUNTING_SYNC_SHADOW_EXPECTED_ENTITIES,
    })
  } catch {
    return failedResult('source_resolution_failed')
  }

  let jobs: readonly SynchronizeAccountingInput[]
  try {
    jobs = prepareAccountingSyncJobs(candidates, sources)
  } catch {
    return failedResult('source_validation_failed')
  }

  if (jobs.length !== ACCOUNTING_SYNC_SHADOW_EXPECTED_ENTITIES) {
    return failedResult('source_validation_failed')
  }
  const observation = createObservation()
  return Object.freeze({
    status: 'observed',
    reason: 'sync_plan_prepared',
    canReadProvider: false,
    canWriteProvider: false,
    canWriteLocal: false,
    canApply: false,
    observation,
    serializedObservation: JSON.stringify(observation),
  })
}

export function prepareAccountingSyncCandidates(
  sources: readonly AccountingSyncShadowCandidate[] | undefined
): readonly PreparedAccountingSyncCandidate[] {
  if (!Array.isArray(sources) || sources.length !== ACCOUNTING_SYNC_SHADOW_EXPECTED_ENTITIES) {
    throw plannerError(
      'ACCOUNTING_SYNC_SHADOW_ENTITY_COUNT_INVALID',
      'Accounting sync shadow plan requires exactly three entities.'
    )
  }

  const entityIds = new Set<string>()
  const connectionIds = new Set<string>()
  const reviewReferences = new Set<string>()
  const stores = new Set<object>()
  const prepared: PreparedAccountingSyncCandidate[] = []
  let tenantId: string | null = null
  let pilotCandidates = 0

  for (const candidate of sources) {
    validateCandidate(candidate)
    tenantId ??= candidate.source.tenantId
    if (candidate.source.tenantId !== tenantId) {
      throw plannerError(
        'ACCOUNTING_SYNC_SHADOW_TENANT_MISMATCH',
        'Accounting sync shadow candidates must share one tenant.'
      )
    }
    if (entityIds.has(candidate.source.legalEntityId)) {
      throw plannerError(
        'ACCOUNTING_SYNC_SHADOW_DUPLICATE_ENTITY',
        'Accounting sync shadow plan contains a duplicate entity.'
      )
    }
    if (connectionIds.has(candidate.source.connectionId)) {
      throw plannerError(
        'ACCOUNTING_SYNC_SHADOW_SHARED_CONNECTION',
        'Accounting sync shadow plan contains a shared connection.'
      )
    }
    if (stores.has(candidate.store)) {
      throw plannerError(
        'ACCOUNTING_SYNC_SHADOW_SHARED_STORE',
        'Accounting sync shadow plan contains a shared store.'
      )
    }
    if (
      reviewReferences.has(candidate.reviewReference) ||
      (candidate.pilotReviewReference !== undefined &&
        reviewReferences.has(candidate.pilotReviewReference))
    ) {
      throw plannerError(
        'ACCOUNTING_SYNC_SHADOW_REVIEW_REUSED',
        'Accounting sync shadow review references must be unique.'
      )
    }

    entityIds.add(candidate.source.legalEntityId)
    connectionIds.add(candidate.source.connectionId)
    stores.add(candidate.store)
    reviewReferences.add(candidate.reviewReference)
    if (candidate.pilotReviewReference !== undefined) {
      reviewReferences.add(candidate.pilotReviewReference)
    }
    if (candidate.role === 'cep_sur_pilot_candidate') pilotCandidates += 1
    prepared.push(
      Object.freeze({
        source: Object.freeze({ ...candidate.source }),
        role: candidate.role,
        reviewReference: candidate.reviewReference,
        ...(candidate.pilotReviewReference === undefined
          ? {}
          : { pilotReviewReference: candidate.pilotReviewReference }),
        store: candidate.store,
      })
    )
  }

  if (pilotCandidates !== 1) {
    throw plannerError(
      'ACCOUNTING_SYNC_SHADOW_PILOT_COUNT_INVALID',
      'Accounting sync shadow plan requires exactly one CEP Sur pilot candidate.'
    )
  }

  return Object.freeze(
    prepared.sort(
      (left, right) =>
        left.source.legalEntityId.localeCompare(right.source.legalEntityId) ||
        left.source.connectionId.localeCompare(right.source.connectionId)
    )
  )
}

function validateCandidate(candidate: AccountingSyncShadowCandidate): void {
  if (
    !candidate ||
    typeof candidate !== 'object' ||
    !validSource(candidate.source) ||
    !validReviewReference(candidate.reviewReference) ||
    !validStore(candidate.store) ||
    !['existing_entity', 'cep_sur_pilot_candidate'].includes(candidate.role)
  ) {
    throw invalidCandidateError()
  }

  if (
    candidate.role === 'cep_sur_pilot_candidate'
      ? !validReviewReference(candidate.pilotReviewReference) ||
        candidate.pilotReviewReference === candidate.reviewReference
      : candidate.pilotReviewReference !== undefined
  ) {
    throw plannerError(
      'ACCOUNTING_SYNC_SHADOW_PILOT_REVIEW_INVALID',
      'Accounting sync shadow pilot review is invalid.'
    )
  }
}

export function prepareAccountingSyncJobs(
  candidates: readonly PreparedAccountingSyncCandidate[],
  sources: readonly ResolvedAccountingReadSource[]
): readonly SynchronizeAccountingInput[] {
  if (!Array.isArray(sources) || sources.length !== candidates.length) throw invalidSourceError()
  const candidatesByScope = new Map(
    candidates.map((candidate) => [scopeKey(candidate.source), candidate])
  )
  const sourceClients = new Set<object>()
  const jobs: SynchronizeAccountingInput[] = []

  for (const source of sources) {
    if (!source || typeof source !== 'object') throw invalidSourceError()
    const candidate = candidatesByScope.get(scopeKey(source.scope))
    if (!candidate || sourceClients.has(source.client)) throw invalidSourceError()
    assertAccountingReadBinding(source.scope, source.client)
    sourceClients.add(source.client)
    candidatesByScope.delete(scopeKey(source.scope))
    jobs.push(
      Object.freeze({
        scope: source.scope,
        client: source.client,
        store: candidate.store,
      })
    )
  }

  if (candidatesByScope.size !== 0) throw invalidSourceError()
  return Object.freeze(jobs)
}

function captureResolver(
  resolver: Pick<AccountingReadSourceResolver, 'resolveBatch'> | undefined
): AccountingReadSourceResolver['resolveBatch'] {
  if (!resolver || typeof resolver.resolveBatch !== 'function') {
    throw plannerError(
      'ACCOUNTING_SYNC_SHADOW_RESOLVER_INVALID',
      'Accounting sync shadow resolver is invalid.'
    )
  }
  return resolver.resolveBatch.bind(resolver)
}

function validSource(source: AccountingReadSourceKey): boolean {
  return (
    !!source &&
    typeof source === 'object' &&
    validIdentifier(source.tenantId) &&
    validIdentifier(source.legalEntityId) &&
    validIdentifier(source.connectionId)
  )
}

function validStore(store: AccountingImportStore): store is AccountingImportStore & object {
  return (
    !!store &&
    typeof store === 'object' &&
    typeof store.beginSync === 'function' &&
    typeof store.upsertTransactions === 'function' &&
    typeof store.completeSync === 'function' &&
    typeof store.failSync === 'function'
  )
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 500 && value.trim() === value
  )
}

function validReviewReference(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_REFERENCE_PATTERN.test(value)
}

function scopeKey(source: AccountingReadSourceKey): string {
  return `${source.tenantId}\u0000${source.legalEntityId}\u0000${source.connectionId}`
}

function createObservation(): AccountingSyncShadowPlanObservation {
  return Object.freeze({
    schemaVersion: 1,
    mode: 'three_entity_accounting_sync_shadow_plan',
    verdict: 'prepared',
    canReadProvider: false,
    canWriteProvider: false,
    canWriteLocal: false,
    canApply: false,
    metrics: Object.freeze({
      expectedEntities: 3,
      preparedEntities: 3,
      isolatedSources: 3,
      isolatedStores: 3,
      pilotCandidates: 1,
    }),
  })
}

function skippedResult(
  reason: Exclude<AccountingSyncShadowPlannerGateReason, 'staging_enabled'>
): AccountingSyncShadowPlannerResult {
  return Object.freeze({
    status: 'skipped',
    reason,
    canReadProvider: false,
    canWriteProvider: false,
    canWriteLocal: false,
    canApply: false,
  })
}

function failedResult(
  reason: 'source_resolution_failed' | 'source_validation_failed'
): AccountingSyncShadowPlannerResult {
  return Object.freeze({
    status: 'failed',
    reason,
    canReadProvider: false,
    canWriteProvider: false,
    canWriteLocal: false,
    canApply: false,
  })
}

function invalidCandidateError(): AccountingSyncError {
  return plannerError(
    'ACCOUNTING_SYNC_SHADOW_CANDIDATE_INVALID',
    'Accounting sync shadow candidate is invalid.'
  )
}

function invalidSourceError(): AccountingSyncError {
  return plannerError(
    'ACCOUNTING_SYNC_SHADOW_SOURCE_INVALID',
    'Accounting sync shadow source is invalid.'
  )
}

function plannerError(code: string, summary: string): AccountingSyncError {
  return new AccountingSyncError(code, summary)
}
