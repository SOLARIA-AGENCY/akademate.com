import { createHash } from 'node:crypto'

export type MultiEntityLegalProfileRole = 'norte' | 'santa_cruz' | 'sur'

export interface MultiEntityLegalAddress {
  readonly line1: string
  readonly postalCode: string
  readonly locality: string
  readonly region: string
  readonly countryCode: string
}

export interface MultiEntityLegalContact {
  readonly fullName: string
  readonly email: string
  readonly phone: string
}

export interface MultiEntityLegalProfileReviewEntity {
  readonly id: string
  readonly tenantId: string
  readonly role: MultiEntityLegalProfileRole
  readonly pilot: boolean
  readonly reviewReference: string
  readonly legalName: string
  readonly nif: string
  readonly registeredAddress: MultiEntityLegalAddress
  readonly legalContact: MultiEntityLegalContact
}

export interface MultiEntityLegalProfileReviewEvidenceInput {
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly entities: readonly MultiEntityLegalProfileReviewEntity[]
}

export interface MultiEntityLegalProfileEntityEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_legal_profile_entity_evidence'
  readonly role: MultiEntityLegalProfileRole
  readonly pilot: boolean
  readonly reviewReferenceDigest: string
  readonly legalProfileDigest: string
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface MultiEntityLegalProfileReviewEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_legal_profile_review_evidence'
  readonly gate: 'legal_profile_reviewed'
  readonly mode: 'three_entity_redacted_legal_profile_review'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canReadPayload: false
  readonly canWrite: false
  readonly canApply: false
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canDeploy: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly entities: readonly MultiEntityLegalProfileEntityEvidenceArtifact[]
  readonly metrics: {
    readonly requiredEntities: 3
    readonly reviewedEntities: 3
    readonly pilotEntities: 1
    readonly normalizedLegalProfiles: 3
    readonly payloadReads: 0
    readonly writes: 0
    readonly applies: 0
    readonly deployments: 0
    readonly activations: 0
    readonly permissionChanges: 0
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

type SealedEntity = MultiEntityLegalProfileEntityEvidenceArtifact

const ROLES: readonly MultiEntityLegalProfileRole[] = ['norte', 'santa_cruz', 'sur']
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const INPUT_KEYS = new Set([
  'campaignReviewReference',
  'readinessReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'entities',
])
const ENTITY_KEYS = new Set([
  'id',
  'tenantId',
  'role',
  'pilot',
  'reviewReference',
  'legalName',
  'nif',
  'registeredAddress',
  'legalContact',
])
const ADDRESS_KEYS = new Set(['line1', 'postalCode', 'locality', 'region', 'countryCode'])
const CONTACT_KEYS = new Set(['fullName', 'email', 'phone'])
const ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'gate',
  'mode',
  'verdict',
  'canReadPayload',
  'canWrite',
  'canApply',
  'canBindAutomatically',
  'canMarkVerified',
  'canDeploy',
  'canActivate',
  'canChangePermissions',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'entities',
  'metrics',
  'artifactDigest',
  'evidenceReference',
])
const SEALED_ENTITY_KEYS = new Set([
  'schemaVersion',
  'kind',
  'role',
  'pilot',
  'reviewReferenceDigest',
  'legalProfileDigest',
  'artifactDigest',
  'evidenceReference',
])
const METRICS_KEYS = new Set([
  'requiredEntities',
  'reviewedEntities',
  'pilotEntities',
  'normalizedLegalProfiles',
  'payloadReads',
  'writes',
  'applies',
  'deployments',
  'activations',
  'permissionChanges',
])

/**
 * Seals a local, redacted review of the three CEP legal profiles. This is a
 * pure evidence contract: it neither reads Payload nor changes legal, tenant,
 * deployment, activation, or authorization state.
 */
export function createMultiEntityLegalProfileReviewEvidenceArtifact(
  input: MultiEntityLegalProfileReviewEvidenceInput
): MultiEntityLegalProfileReviewEvidenceArtifact {
  validateInput(input)
  const tenantIds = new Set<string>()
  const identifiers = new Set<string>()
  const nifs = new Set<string>()
  const roles = new Set<MultiEntityLegalProfileRole>()
  const reviews = new Set([input.campaignReviewReference, input.readinessReviewReference])

  const entities = input.entities.map((entity) => {
    validateEntityShape(entity)
    const normalized = normalizeLegalProfile(entity)
    if (
      (tenantIds.has(normalized.tenantId) === false && tenantIds.size > 0) ||
      identifiers.has(normalized.id) ||
      nifs.has(normalized.nif) ||
      roles.has(entity.role) ||
      reviews.has(entity.reviewReference)
    ) {
      invalidEvidence()
    }
    tenantIds.add(normalized.tenantId)
    identifiers.add(normalized.id)
    nifs.add(normalized.nif)
    roles.add(entity.role)
    reviews.add(entity.reviewReference)
    if ((entity.role === 'sur') !== entity.pilot) invalidEvidence()
    const entityCanonical = Object.freeze({
      schemaVersion: 1 as const,
      kind: 'cep_multi_entity_legal_profile_entity_evidence' as const,
      role: entity.role,
      pilot: entity.pilot,
      reviewReferenceDigest: digest(entity.reviewReference),
      legalProfileDigest: digest(JSON.stringify(normalized)),
    })
    const entityArtifactDigest = digest(JSON.stringify(entityCanonical))
    return Object.freeze({
      ...entityCanonical,
      artifactDigest: entityArtifactDigest,
      evidenceReference: evidenceReference(entityArtifactDigest),
    })
  })
  if (!ROLES.every((role) => roles.has(role))) invalidEvidence()

  const canonical = artifactPayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    entities: Object.freeze(entities.sort(compareEntities)),
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  const artifact = Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
  assertMultiEntityLegalProfileReviewEvidenceArtifact(artifact)
  return artifact
}

export function assertMultiEntityLegalProfileReviewEvidenceArtifact(
  value: unknown
): asserts value is MultiEntityLegalProfileReviewEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, ARTIFACT_KEYS)) invalidEvidence()
  const artifact = value as MultiEntityLegalProfileReviewEvidenceArtifact
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_multi_entity_legal_profile_review_evidence' ||
    artifact.gate !== 'legal_profile_reviewed' ||
    artifact.mode !== 'three_entity_redacted_legal_profile_review' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canReadPayload !== false ||
    artifact.canWrite !== false ||
    artifact.canApply !== false ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canDeploy !== false ||
    artifact.canActivate !== false ||
    artifact.canChangePermissions !== false ||
    !validDigestFields(artifact) ||
    !validSealedEntities(artifact.entities) ||
    !validMetrics(artifact.metrics) ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }
  const canonical = artifactPayload({
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    entities: artifact.entities,
  })
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

export function serializeMultiEntityLegalProfileReviewEvidenceArtifact(
  input: MultiEntityLegalProfileReviewEvidenceInput
): string {
  return JSON.stringify(createMultiEntityLegalProfileReviewEvidenceArtifact(input))
}

function validateInput(input: MultiEntityLegalProfileReviewEvidenceInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference ||
    !DIGEST_PATTERN.test(input.sourceDigest) ||
    !DIGEST_PATTERN.test(input.targetTenantDigest) ||
    input.sourceDigest === input.targetTenantDigest ||
    !Array.isArray(input.entities) ||
    input.entities.length !== 3
  ) {
    invalidEvidence()
  }
}

function validateEntityShape(entity: MultiEntityLegalProfileReviewEntity): void {
  if (
    !entity ||
    typeof entity !== 'object' ||
    !exactKeys(entity, ENTITY_KEYS) ||
    !ROLES.includes(entity.role) ||
    typeof entity.pilot !== 'boolean' ||
    !REVIEW_REFERENCE_PATTERN.test(entity.reviewReference) ||
    !exactKeys(entity.registeredAddress, ADDRESS_KEYS) ||
    !exactKeys(entity.legalContact, CONTACT_KEYS)
  ) {
    invalidEvidence()
  }
}

function normalizeLegalProfile(entity: MultiEntityLegalProfileReviewEntity) {
  const normalized = {
    id: normalizeText(entity.id),
    tenantId: normalizeText(entity.tenantId),
    legalName: normalizeText(entity.legalName),
    nif: normalizeNif(entity.nif),
    registeredAddress: {
      line1: normalizeText(entity.registeredAddress.line1),
      postalCode: normalizeText(entity.registeredAddress.postalCode)
        .replace(/\s/g, '')
        .toUpperCase(),
      locality: normalizeText(entity.registeredAddress.locality),
      region: normalizeText(entity.registeredAddress.region),
      countryCode: normalizeText(entity.registeredAddress.countryCode).toUpperCase(),
    },
    legalContact: {
      fullName: normalizeText(entity.legalContact.fullName),
      email: normalizeText(entity.legalContact.email).toLowerCase(),
      phone: normalizeText(entity.legalContact.phone).replace(/[\s().-]/g, ''),
    },
  }
  if (
    !normalized.id ||
    !normalized.tenantId ||
    !normalized.legalName ||
    !normalized.registeredAddress.line1 ||
    !normalized.registeredAddress.postalCode ||
    !normalized.registeredAddress.locality ||
    !normalized.registeredAddress.region ||
    !/^[A-Z]{2}$/.test(normalized.registeredAddress.countryCode) ||
    !normalized.legalContact.fullName ||
    !EMAIL_PATTERN.test(normalized.legalContact.email) ||
    !normalized.legalContact.phone
  ) {
    invalidEvidence()
  }
  return normalized
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/g, ' ') : ''
}

function normalizeNif(value: unknown): string {
  const nif = normalizeText(value)
    .toUpperCase()
    .replace(/[\s.-]/g, '')
  if (!isValidSpanishTaxIdentifier(nif)) invalidEvidence()
  return nif
}

function isValidSpanishTaxIdentifier(value: string): boolean {
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE'
  if (/^\d{8}[A-Z]$/.test(value)) return value[8] === letters[Number(value.slice(0, 8)) % 23]
  if (/^[XYZ]\d{7}[A-Z]$/.test(value)) {
    const prefix = { X: '0', Y: '1', Z: '2' }[value[0]!]
    return value[8] === letters[Number(`${prefix}${value.slice(1, 8)}`) % 23]
  }
  if (!/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/.test(value)) return false
  const digits = value.slice(1, 8)
  let sum = 0
  for (let index = 0; index < digits.length; index += 1) {
    const digit = Number(digits[index])
    if (index % 2 === 0) sum += Math.floor((digit * 2) / 10) + ((digit * 2) % 10)
    else sum += digit
  }
  const control = (10 - (sum % 10)) % 10
  const letter = 'JABCDEFGHI'[control]!
  const type = value[0]!
  const received = value[8]!
  return type === 'P' || type === 'Q' || type === 'S' || type === 'N' || type === 'W'
    ? received === letter
    : type === 'A' || type === 'B' || type === 'E' || type === 'H'
      ? received === String(control)
      : received === String(control) || received === letter
}

function artifactPayload(input: {
  sourceDigest: string
  targetTenantDigest: string
  campaignReviewReferenceDigest: string
  readinessReviewReferenceDigest: string
  entities: readonly SealedEntity[]
}) {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_legal_profile_review_evidence' as const,
    gate: 'legal_profile_reviewed' as const,
    mode: 'three_entity_redacted_legal_profile_review' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canReadPayload: false as const,
    canWrite: false as const,
    canApply: false as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canDeploy: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: input.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: input.readinessReviewReferenceDigest,
    entities: Object.freeze(input.entities.map((entity) => Object.freeze({ ...entity }))),
    metrics: Object.freeze({
      requiredEntities: 3 as const,
      reviewedEntities: 3 as const,
      pilotEntities: 1 as const,
      normalizedLegalProfiles: 3 as const,
      payloadReads: 0 as const,
      writes: 0 as const,
      applies: 0 as const,
      deployments: 0 as const,
      activations: 0 as const,
      permissionChanges: 0 as const,
    }),
  })
}

function validDigestFields(artifact: MultiEntityLegalProfileReviewEvidenceArtifact): boolean {
  return [
    artifact.sourceDigest,
    artifact.targetTenantDigest,
    artifact.campaignReviewReferenceDigest,
    artifact.readinessReviewReferenceDigest,
    artifact.artifactDigest,
  ].every((value) => DIGEST_PATTERN.test(value))
}

function validSealedEntities(entities: readonly SealedEntity[]): boolean {
  if (!Array.isArray(entities) || entities.length !== 3) return false
  const roles = new Set<MultiEntityLegalProfileRole>()
  let pilots = 0
  for (const entity of entities) {
    if (
      !entity ||
      typeof entity !== 'object' ||
      !exactKeys(entity, SEALED_ENTITY_KEYS) ||
      !ROLES.includes(entity.role) ||
      roles.has(entity.role) ||
      typeof entity.pilot !== 'boolean' ||
      (entity.role === 'sur') !== entity.pilot ||
      entity.schemaVersion !== 1 ||
      entity.kind !== 'cep_multi_entity_legal_profile_entity_evidence' ||
      !DIGEST_PATTERN.test(entity.reviewReferenceDigest) ||
      !DIGEST_PATTERN.test(entity.legalProfileDigest) ||
      !DIGEST_PATTERN.test(entity.artifactDigest) ||
      entity.evidenceReference !== evidenceReference(entity.artifactDigest)
    ) {
      return false
    }
    const canonical = {
      schemaVersion: entity.schemaVersion,
      kind: entity.kind,
      role: entity.role,
      pilot: entity.pilot,
      reviewReferenceDigest: entity.reviewReferenceDigest,
      legalProfileDigest: entity.legalProfileDigest,
    }
    if (entity.artifactDigest !== digest(JSON.stringify(canonical))) return false
    roles.add(entity.role)
    if (entity.pilot) pilots += 1
  }
  return ROLES.every((role) => roles.has(role)) && pilots === 1 && ordered(entities)
}

function validMetrics(metrics: MultiEntityLegalProfileReviewEvidenceArtifact['metrics']): boolean {
  return (
    !!metrics &&
    exactKeys(metrics, METRICS_KEYS) &&
    metrics.requiredEntities === 3 &&
    metrics.reviewedEntities === 3 &&
    metrics.pilotEntities === 1 &&
    metrics.normalizedLegalProfiles === 3 &&
    metrics.payloadReads === 0 &&
    metrics.writes === 0 &&
    metrics.applies === 0 &&
    metrics.deployments === 0 &&
    metrics.activations === 0 &&
    metrics.permissionChanges === 0
  )
}

function compareEntities(left: SealedEntity, right: SealedEntity): number {
  return left.role.localeCompare(right.role)
}

function ordered(entities: readonly SealedEntity[]): boolean {
  return entities.every(
    (entity, index) => index === 0 || compareEntities(entities[index - 1]!, entity) < 0
  )
}

function exactKeys(value: object, keys: ReadonlySet<string>): boolean {
  const valueKeys = Object.keys(value)
  return valueKeys.length === keys.size && valueKeys.every((key) => keys.has(key))
}

function digest(value: string): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(digestValue: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${digestValue.slice('sha256:'.length)}`
}

function invalidEvidence(): never {
  throw new Error('MULTI_ENTITY_LEGAL_PROFILE_EVIDENCE_INVALID')
}
