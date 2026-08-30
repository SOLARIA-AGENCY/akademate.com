import type { AccountingConnectionScope, AccountingReadClient } from './contracts'
import { assertAccountingReadBinding } from './sync'
import { AccountingSyncError } from './sync-error'

export interface ReviewedAccountingSourceRegistration extends AccountingConnectionScope {
  /** Opaque locator only. The credential must never be stored in this plan. */
  readonly secretReference: string
  readonly reviewReference: string
}

export interface AccountingReadClientFactoryInput {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly connectionId: string
  readonly provider: string
  readonly externalCompanyId: string
  readonly secretReference: string
}

export interface AccountingReadClientAuthorization {
  readonly access: 'read_only'
  readonly grantedPermissions: readonly ['transactions:read']
  readonly tenantId: string
  readonly legalEntityId: string
  readonly connectionId: string
  readonly externalCompanyId: string
}

export interface AuthorizedAccountingReadClient extends AccountingReadClient {
  readonly authorization: AccountingReadClientAuthorization
}

/**
 * Provider adapters own secret resolution internally. They receive an opaque
 * locator and return only the read-only client contract, never the credential.
 */
export interface AccountingReadClientFactory {
  readonly provider: string
  createReadClient(
    input: AccountingReadClientFactoryInput
  ): Promise<AuthorizedAccountingReadClient> | AuthorizedAccountingReadClient
}

export interface AccountingReadSourceKey {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly connectionId: string
}

export interface ResolvedAccountingReadSource {
  readonly scope: AccountingConnectionScope
  readonly client: AccountingReadClient
}

export interface AccountingReadSourceBatchInput {
  readonly tenantId: string
  readonly sources: readonly AccountingReadSourceKey[]
  readonly maxConnections?: number
}

export interface AccountingReadSourceResolver {
  resolve(key: AccountingReadSourceKey): Promise<ResolvedAccountingReadSource>
  resolveBatch(
    input: AccountingReadSourceBatchInput
  ): Promise<readonly ResolvedAccountingReadSource[]>
}

export interface AccountingReadSourceResolverOptions {
  readonly registrations: readonly ReviewedAccountingSourceRegistration[]
  /** Complete entity roster expected to have one independent connection. */
  readonly requiredEntities: readonly AccountingLegalEntityScope[]
  readonly factories: readonly AccountingReadClientFactory[]
}

export interface AccountingLegalEntityScope {
  readonly tenantId: string
  readonly legalEntityId: string
}

const MAX_REGISTRATIONS = 100
const DEFAULT_MAX_BATCH_CONNECTIONS = 50
const SECRET_REFERENCE_PATTERN = /^(?:op|vault|aws-sm|gcp-sm):\/\/[A-Za-z0-9][^\s]{2,497}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/

/**
 * Builds a fail-closed registry. The complete registration and provider set is
 * validated before any adapter can resolve a secret or create a client.
 */
export function createAccountingReadSourceResolver(
  options: AccountingReadSourceResolverOptions
): AccountingReadSourceResolver {
  const factories = prepareFactories(options.factories)
  const registrations = prepareRegistrations(
    options.registrations,
    prepareRequiredEntities(options.requiredEntities),
    factories
  )

  return Object.freeze({
    async resolve(key: AccountingReadSourceKey): Promise<ResolvedAccountingReadSource> {
      const registration = reviewedRegistration(key, registrations)
      return resolveRegistration(registration, factories)
    },
    async resolveBatch(
      input: AccountingReadSourceBatchInput
    ): Promise<readonly ResolvedAccountingReadSource[]> {
      const reviewed = prepareBatch(input, registrations)
      const resolved: ResolvedAccountingReadSource[] = []
      const sourceClients = new Set<object>()
      for (const registration of reviewed) {
        resolved.push(await resolveRegistration(registration, factories, sourceClients))
      }
      return Object.freeze(resolved)
    },
  })
}

export function isAccountingSecretReference(value: unknown): value is string {
  return typeof value === 'string' && SECRET_REFERENCE_PATTERN.test(value)
}

function prepareFactories(
  sources: readonly AccountingReadClientFactory[]
): ReadonlyMap<string, AccountingReadClientFactory> {
  if (!Array.isArray(sources) || sources.length > MAX_REGISTRATIONS) throw invalidPlanError()
  const factories = new Map<string, AccountingReadClientFactory>()

  for (const source of sources) {
    if (
      !source ||
      typeof source !== 'object' ||
      !validIdentifier(source.provider, 100) ||
      typeof source.createReadClient !== 'function' ||
      factories.has(source.provider)
    ) {
      throw invalidPlanError()
    }
    factories.set(
      source.provider,
      Object.freeze({
        provider: source.provider,
        createReadClient: source.createReadClient.bind(source),
      })
    )
  }

  return factories
}

function prepareRegistrations(
  sources: readonly ReviewedAccountingSourceRegistration[],
  requiredEntities: ReadonlySet<string>,
  factories: ReadonlyMap<string, AccountingReadClientFactory>
): ReadonlyMap<string, ReviewedAccountingSourceRegistration> {
  if (
    !Array.isArray(sources) ||
    sources.length !== requiredEntities.size ||
    sources.length > MAX_REGISTRATIONS
  ) {
    throw registryError(
      'ACCOUNTING_SOURCE_ENTITY_COVERAGE_MISMATCH',
      'Accounting source plan must cover every required entity exactly once.'
    )
  }
  const registrations = new Map<string, ReviewedAccountingSourceRegistration>()
  const entityKeys = new Set<string>()
  const connectionIds = new Set<string>()
  const externalAccounts = new Set<string>()
  const secretReferences = new Set<string>()
  const reviewReferences = new Set<string>()

  for (const source of sources) {
    validateRegistration(source)
    if (!factories.has(source.provider)) {
      throw registryError(
        'ACCOUNTING_SOURCE_PROVIDER_NOT_REGISTERED',
        'Accounting source provider is not registered.'
      )
    }

    const key = scopeKey(source)
    const entityKey = `${source.tenantId}\u0000${source.legalEntityId}`
    const externalAccountKey = `${source.provider}\u0000${source.externalCompanyId}`
    if (!requiredEntities.has(entityKey)) {
      throw registryError(
        'ACCOUNTING_SOURCE_ENTITY_COVERAGE_MISMATCH',
        'Accounting source plan must cover every required entity exactly once.'
      )
    }
    if (registrations.has(key) || entityKeys.has(entityKey)) {
      throw registryError(
        'ACCOUNTING_SOURCE_DUPLICATE_ENTITY',
        'Accounting source plan contains more than one connection for an entity.'
      )
    }
    if (connectionIds.has(source.connectionId)) {
      throw registryError(
        'ACCOUNTING_SOURCE_SHARED_CONNECTION',
        'Accounting source connection is assigned to more than one entity.'
      )
    }
    if (externalAccounts.has(externalAccountKey)) {
      throw registryError(
        'ACCOUNTING_SOURCE_SHARED_EXTERNAL_COMPANY',
        'Accounting source company is assigned to more than one entity.'
      )
    }
    if (secretReferences.has(source.secretReference)) {
      throw registryError(
        'ACCOUNTING_SOURCE_SHARED_SECRET_REFERENCE',
        'Accounting source secret reference is assigned to more than one entity.'
      )
    }
    if (reviewReferences.has(source.reviewReference)) {
      throw registryError(
        'ACCOUNTING_SOURCE_SHARED_REVIEW_REFERENCE',
        'Accounting source review reference is assigned to more than one entity.'
      )
    }

    registrations.set(key, Object.freeze({ ...source }))
    entityKeys.add(entityKey)
    connectionIds.add(source.connectionId)
    externalAccounts.add(externalAccountKey)
    secretReferences.add(source.secretReference)
    reviewReferences.add(source.reviewReference)
  }

  return registrations
}

function prepareRequiredEntities(
  sources: readonly AccountingLegalEntityScope[]
): ReadonlySet<string> {
  if (!Array.isArray(sources) || sources.length === 0 || sources.length > MAX_REGISTRATIONS) {
    throw invalidPlanError()
  }
  const entities = new Set<string>()
  for (const source of sources) {
    if (
      !source ||
      typeof source !== 'object' ||
      !validIdentifier(source.tenantId, 500) ||
      !validIdentifier(source.legalEntityId, 500)
    ) {
      throw invalidPlanError()
    }
    const key = `${source.tenantId}\u0000${source.legalEntityId}`
    if (entities.has(key)) {
      throw registryError(
        'ACCOUNTING_SOURCE_REQUIRED_ENTITY_DUPLICATE',
        'Accounting source required entity roster contains a duplicate.'
      )
    }
    entities.add(key)
  }
  return entities
}

function prepareBatch(
  input: AccountingReadSourceBatchInput,
  registrations: ReadonlyMap<string, ReviewedAccountingSourceRegistration>
): readonly ReviewedAccountingSourceRegistration[] {
  const maximum = input?.maxConnections ?? DEFAULT_MAX_BATCH_CONNECTIONS
  if (
    !input ||
    typeof input !== 'object' ||
    !validIdentifier(input.tenantId, 500) ||
    !Number.isSafeInteger(maximum) ||
    maximum < 1 ||
    maximum > MAX_REGISTRATIONS ||
    !Array.isArray(input.sources) ||
    input.sources.length === 0 ||
    input.sources.length > maximum
  ) {
    throw registryError('ACCOUNTING_SOURCE_BATCH_INVALID', 'Accounting source batch is invalid.')
  }

  const reviewed: ReviewedAccountingSourceRegistration[] = []
  const entityIds = new Set<string>()
  const connectionIds = new Set<string>()
  for (const key of input.sources) {
    validateKey(key)
    if (key.tenantId !== input.tenantId) {
      throw registryError(
        'ACCOUNTING_SOURCE_BATCH_TENANT_MISMATCH',
        'Accounting source batch contains another tenant.'
      )
    }
    if (entityIds.has(key.legalEntityId)) {
      throw registryError(
        'ACCOUNTING_SOURCE_BATCH_DUPLICATE_ENTITY',
        'Accounting source batch contains a duplicate entity.'
      )
    }
    if (connectionIds.has(key.connectionId)) {
      throw registryError(
        'ACCOUNTING_SOURCE_BATCH_DUPLICATE_CONNECTION',
        'Accounting source batch contains a duplicate connection.'
      )
    }

    reviewed.push(reviewedRegistration(key, registrations))
    entityIds.add(key.legalEntityId)
    connectionIds.add(key.connectionId)
  }

  return Object.freeze(
    reviewed.sort(
      (left, right) =>
        left.legalEntityId.localeCompare(right.legalEntityId) ||
        left.connectionId.localeCompare(right.connectionId)
    )
  )
}

function reviewedRegistration(
  key: AccountingReadSourceKey,
  registrations: ReadonlyMap<string, ReviewedAccountingSourceRegistration>
): ReviewedAccountingSourceRegistration {
  validateKey(key)
  const registration = registrations.get(scopeKey(key))
  if (!registration) {
    throw registryError(
      'ACCOUNTING_SOURCE_SCOPE_NOT_REVIEWED',
      'Accounting source scope has not been reviewed.'
    )
  }
  return registration
}

async function resolveRegistration(
  registration: ReviewedAccountingSourceRegistration,
  factories: ReadonlyMap<string, AccountingReadClientFactory>,
  sourceClients?: Set<object>
): Promise<ResolvedAccountingReadSource> {
  const factory = factories.get(registration.provider)
  if (!factory) {
    throw registryError(
      'ACCOUNTING_SOURCE_PROVIDER_NOT_REGISTERED',
      'Accounting source provider is not registered.'
    )
  }

  let client: AuthorizedAccountingReadClient
  try {
    client = await factory.createReadClient({
      tenantId: registration.tenantId,
      legalEntityId: registration.legalEntityId,
      connectionId: registration.connectionId,
      provider: registration.provider,
      externalCompanyId: registration.externalCompanyId,
      secretReference: registration.secretReference,
    })
  } catch {
    throw registryError(
      'ACCOUNTING_SOURCE_CLIENT_CREATION_FAILED',
      'Accounting read client creation failed.'
    )
  }

  if (sourceClients && client && typeof client === 'object') {
    if (sourceClients.has(client)) {
      throw registryError(
        'ACCOUNTING_SOURCE_SHARED_CLIENT',
        'Accounting read client is shared by more than one entity.'
      )
    }
    sourceClients.add(client)
  }

  let projectedClient: AccountingReadClient
  try {
    assertClientAuthorization(registration, client)
    projectedClient = projectClient(client)
    assertAccountingReadBinding(registration, projectedClient)
  } catch (error) {
    if (error instanceof AccountingSyncError) throw error
    throw registryError('ACCOUNTING_SOURCE_CLIENT_INVALID', 'Accounting read client is invalid.')
  }

  return Object.freeze({
    scope: projectScope(registration),
    client: projectedClient,
  })
}

function validateRegistration(source: ReviewedAccountingSourceRegistration): void {
  if (
    !source ||
    typeof source !== 'object' ||
    !isAccountingSecretReference(source.secretReference) ||
    typeof source.reviewReference !== 'string' ||
    !REVIEW_REFERENCE_PATTERN.test(source.reviewReference)
  ) {
    throw invalidPlanError()
  }

  try {
    assertAccountingReadBinding(source, {
      provider: source.provider,
      listTransactions: async () => ({ items: [], nextCursor: null }),
    })
  } catch (error) {
    if (error instanceof AccountingSyncError) throw error
    throw invalidPlanError()
  }
}

function validateKey(key: AccountingReadSourceKey): void {
  if (
    !key ||
    typeof key !== 'object' ||
    !validIdentifier(key.tenantId, 500) ||
    !validIdentifier(key.legalEntityId, 500) ||
    !validIdentifier(key.connectionId, 500)
  ) {
    throw registryError('ACCOUNTING_SOURCE_SCOPE_INVALID', 'Accounting source scope is invalid.')
  }
}

function projectScope(source: ReviewedAccountingSourceRegistration): AccountingConnectionScope {
  return Object.freeze({
    tenantId: source.tenantId,
    legalEntityId: source.legalEntityId,
    connectionId: source.connectionId,
    provider: source.provider,
    externalCompanyId: source.externalCompanyId,
    integrationMode: 'read_only',
    connectionStatus: 'active',
  })
}

function projectClient(source: AuthorizedAccountingReadClient): AccountingReadClient {
  if (
    !source ||
    typeof source !== 'object' ||
    !hasExactKeys(source, ['provider', 'listTransactions', 'authorization']) ||
    !validIdentifier(source.provider, 100) ||
    typeof source.listTransactions !== 'function' ||
    !validAuthorization(source.authorization)
  ) {
    throw registryError('ACCOUNTING_SOURCE_CLIENT_INVALID', 'Accounting read client is invalid.')
  }

  return Object.freeze({
    provider: source.provider,
    listTransactions: source.listTransactions.bind(source),
  })
}

function assertClientAuthorization(
  registration: ReviewedAccountingSourceRegistration,
  client: AuthorizedAccountingReadClient
): void {
  if (!validAuthorization(client?.authorization)) {
    throw registryError(
      'ACCOUNTING_SOURCE_AUTHORIZATION_INVALID',
      'Accounting read client authorization is invalid.'
    )
  }
  if (
    client.authorization.access !== 'read_only' ||
    client.authorization.grantedPermissions.some((permission) => permission.endsWith(':write'))
  ) {
    throw registryError(
      'ACCOUNTING_SOURCE_WRITE_PERMISSION_FORBIDDEN',
      'Accounting read client must not have provider write permission.'
    )
  }
  if (
    client.authorization.grantedPermissions.length !== 1 ||
    client.authorization.grantedPermissions[0] !== 'transactions:read'
  ) {
    throw registryError(
      'ACCOUNTING_SOURCE_READ_PERMISSION_REQUIRED',
      'Accounting read client must have only transaction read permission.'
    )
  }
  if (
    client.authorization.tenantId !== registration.tenantId ||
    client.authorization.legalEntityId !== registration.legalEntityId ||
    client.authorization.connectionId !== registration.connectionId ||
    client.authorization.externalCompanyId !== registration.externalCompanyId
  ) {
    throw registryError(
      'ACCOUNTING_SOURCE_AUTHORIZATION_SCOPE_MISMATCH',
      'Accounting read client authorization does not match the reviewed scope.'
    )
  }
}

function validAuthorization(value: unknown): value is AccountingReadClientAuthorization {
  if (!value || typeof value !== 'object') return false
  const authorization = value as Record<string, unknown>
  return (
    hasExactKeys(authorization, [
      'access',
      'grantedPermissions',
      'tenantId',
      'legalEntityId',
      'connectionId',
      'externalCompanyId',
    ]) &&
    typeof authorization.access === 'string' &&
    Array.isArray(authorization.grantedPermissions) &&
    authorization.grantedPermissions.every((permission) => typeof permission === 'string') &&
    validIdentifier(authorization.tenantId, 500) &&
    validIdentifier(authorization.legalEntityId, 500) &&
    validIdentifier(authorization.connectionId, 500) &&
    validIdentifier(authorization.externalCompanyId, 255)
  )
}

function hasExactKeys(source: object, expected: readonly string[]): boolean {
  const actual = Object.keys(source).sort()
  const sortedExpected = [...expected].sort()
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  )
}

function scopeKey(source: AccountingReadSourceKey): string {
  return `${source.tenantId}\u0000${source.legalEntityId}\u0000${source.connectionId}`
}

function validIdentifier(value: unknown, maximum: number): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= maximum &&
    value.trim() === value
  )
}

function invalidPlanError(): AccountingSyncError {
  return registryError('ACCOUNTING_SOURCE_PLAN_INVALID', 'Accounting source plan is invalid.')
}

function registryError(code: string, summary: string): AccountingSyncError {
  return new AccountingSyncError(code, summary)
}
