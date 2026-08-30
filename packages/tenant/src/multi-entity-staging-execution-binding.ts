import { createHash } from 'node:crypto'

import {
  MULTI_ENTITY_ENTITY_STAGING_GATES,
  MULTI_ENTITY_GLOBAL_STAGING_GATES,
  type MultiEntityEntityStagingGate,
  type MultiEntityGlobalStagingGate,
} from './multi-entity-staging-readiness'
import { getMultiEntitySpecificEvidenceArtifactKind } from './multi-entity-staging-evidence-bundle'

export interface MultiEntityStagingExecutionBindingInput {
  readonly scope: 'global' | 'entity'
  readonly gate: MultiEntityGlobalStagingGate | MultiEntityEntityStagingGate
  readonly reviewReference: string
  readonly evidenceReference: `evidence://sha256/${string}`
  readonly artifactKind: string
  readonly artifactDigest: string
}

export interface MultiEntityStagingShadowExecutionEvidenceInput {
  readonly environment: 'staging'
  readonly sourceSha: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly executionReviewReference: string
  readonly executionReportDigest: string
  readonly inputSnapshotDigest: string
  readonly observedAtUtc: string
  readonly bindings: readonly MultiEntityStagingExecutionBindingInput[]
  readonly metrics: {
    readonly requiredBindings: 56
    readonly observedBindings: 56
    readonly payloadReads: number
    readonly providerReads: number
    readonly writes: 0
    readonly permissionChanges: 0
  }
}

export interface MultiEntityStagingShadowExecutionEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_staging_shadow_execution'
  readonly mode: 'authenticated_shadow_read_only'
  readonly environment: 'staging'
  readonly verdict: 'registered_for_manual_review'
  readonly canDeclareStagingReady: false
  readonly canDeploy: false
  readonly canMigrate: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceSha: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly executionReviewReferenceDigest: string
  readonly executionReportDigest: string
  readonly inputSnapshotDigest: string
  readonly observedAtUtc: string
  readonly metrics: {
    readonly requiredBindings: 56
    readonly observedBindings: 56
    readonly payloadReads: number
    readonly providerReads: number
    readonly writes: 0
    readonly permissionChanges: 0
  }
  readonly bindings: readonly MultiEntityStagingExecutionBindingInput[]
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const SOURCE_SHA_PATTERN = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const EVIDENCE_REFERENCE_PATTERN = /^evidence:\/\/sha256\/[a-f0-9]{64}$/
const UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/
const INPUT_KEYS = new Set([
  'environment',
  'sourceSha',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReference',
  'readinessReviewReference',
  'executionReviewReference',
  'executionReportDigest',
  'inputSnapshotDigest',
  'observedAtUtc',
  'bindings',
  'metrics',
])
const ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'environment',
  'verdict',
  'canDeclareStagingReady',
  'canDeploy',
  'canMigrate',
  'canActivate',
  'canChangePermissions',
  'sourceSha',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'executionReviewReferenceDigest',
  'executionReportDigest',
  'inputSnapshotDigest',
  'observedAtUtc',
  'metrics',
  'bindings',
  'artifactDigest',
  'evidenceReference',
])
const BINDING_KEYS = new Set([
  'scope',
  'gate',
  'reviewReference',
  'evidenceReference',
  'artifactKind',
  'artifactDigest',
])
const METRIC_KEYS = new Set([
  'requiredBindings',
  'observedBindings',
  'payloadReads',
  'providerReads',
  'writes',
  'permissionChanges',
])

export function registerMultiEntityStagingShadowExecutionEvidence(
  input: MultiEntityStagingShadowExecutionEvidenceInput
): MultiEntityStagingShadowExecutionEvidenceArtifact {
  validateInput(input)
  const bindings = [...input.bindings].sort(compareBindings)
  const canonical = canonicalPayload(input, bindings)
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

export function assertMultiEntityStagingShadowExecutionEvidenceArtifact(
  value: unknown
): asserts value is MultiEntityStagingShadowExecutionEvidenceArtifact {
  if (!value || typeof value !== 'object') invalid()
  const artifact = value as MultiEntityStagingShadowExecutionEvidenceArtifact
  if (
    !exactKeys(artifact, ARTIFACT_KEYS) ||
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_multi_entity_staging_shadow_execution' ||
    artifact.mode !== 'authenticated_shadow_read_only' ||
    artifact.environment !== 'staging' ||
    artifact.verdict !== 'registered_for_manual_review' ||
    artifact.canDeclareStagingReady !== false ||
    artifact.canDeploy !== false ||
    artifact.canMigrate !== false ||
    artifact.canActivate !== false ||
    artifact.canChangePermissions !== false
  ) {
    invalid()
  }

  validateArtifactFields(artifact)
}

function validateInput(input: MultiEntityStagingShadowExecutionEvidenceInput): void {
  if (!input || typeof input !== 'object' || !exactKeys(input, INPUT_KEYS)) invalid()
  if (
    input.environment !== 'staging' ||
    !SOURCE_SHA_PATTERN.test(input.sourceSha) ||
    !DIGEST_PATTERN.test(input.sourceDigest) ||
    !DIGEST_PATTERN.test(input.targetTenantDigest) ||
    !validReview(input.campaignReviewReference) ||
    !validReview(input.readinessReviewReference) ||
    !validReview(input.executionReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference ||
    input.campaignReviewReference === input.executionReviewReference ||
    input.readinessReviewReference === input.executionReviewReference ||
    !DIGEST_PATTERN.test(input.executionReportDigest) ||
    !DIGEST_PATTERN.test(input.inputSnapshotDigest) ||
    !validUtc(input.observedAtUtc) ||
    !input.metrics ||
    !exactKeys(input.metrics, METRIC_KEYS) ||
    input.metrics.requiredBindings !== 56 ||
    input.metrics.observedBindings !== 56 ||
    !nonNegativeInteger(input.metrics.payloadReads) ||
    !nonNegativeInteger(input.metrics.providerReads) ||
    input.metrics.writes !== 0 ||
    input.metrics.permissionChanges !== 0
  ) {
    invalid()
  }
  validateBindings(input.bindings, digest(input.readinessReviewReference))
}

function validateBindings(
  bindings: readonly MultiEntityStagingExecutionBindingInput[],
  readinessReviewReferenceDigest: string
): void {
  if (!Array.isArray(bindings) || bindings.length !== 56) invalid()
  if (!DIGEST_PATTERN.test(readinessReviewReferenceDigest)) invalid()
  const seen = new Set<string>()
  const entityReviewReferencesByGate = new Map<string, Set<string>>()
  const gateCounts = new Map<string, number>()
  let expectedEntityReviewReferences: Set<string> | undefined
  const expected = expectedBindings()
  for (const binding of bindings) {
    if (
      !binding ||
      typeof binding !== 'object' ||
      !exactKeys(binding, BINDING_KEYS) ||
      !['global', 'entity'].includes(binding.scope) ||
      !validReview(binding.reviewReference) ||
      !EVIDENCE_REFERENCE_PATTERN.test(binding.evidenceReference) ||
      !DIGEST_PATTERN.test(binding.artifactDigest) ||
      binding.evidenceReference !== evidenceReference(binding.artifactDigest)
    ) {
      // The execution binding intentionally carries no tenant/source copies;
      // those are sealed once at the execution envelope above.
      invalid()
    }
    const key = `${binding.scope}\u0000${binding.gate}\u0000${binding.reviewReference}`
    const gateKey = `${binding.scope}\u0000${binding.gate}`
    const expectedArtifactKind = expected.get(`${binding.scope}\u0000${binding.gate}`)
    if (
      seen.has(key) ||
      !expectedArtifactKind ||
      binding.artifactKind !== expectedArtifactKind ||
      !validGate(binding.scope, binding.gate)
    ) {
      invalid()
    }
    gateCounts.set(gateKey, (gateCounts.get(gateKey) ?? 0) + 1)
    if (binding.scope === 'global') {
      if (digest(binding.reviewReference) !== readinessReviewReferenceDigest) invalid()
    } else {
      if (digest(binding.reviewReference) === readinessReviewReferenceDigest) invalid()
      const references = entityReviewReferencesByGate.get(gateKey) ?? new Set<string>()
      references.add(binding.reviewReference)
      entityReviewReferencesByGate.set(gateKey, references)
    }
    seen.add(key)
  }
  if (seen.size !== 56) invalid()
  for (const gate of MULTI_ENTITY_GLOBAL_STAGING_GATES) {
    if (gateCounts.get(`global\u0000${gate}`) !== 1) invalid()
  }
  for (const gate of MULTI_ENTITY_ENTITY_STAGING_GATES) {
    const gateKey = `entity\u0000${gate}`
    const references = entityReviewReferencesByGate.get(gateKey)
    if (gateCounts.get(gateKey) !== 3 || references?.size !== 3) {
      invalid()
    }
    if (!expectedEntityReviewReferences) {
      expectedEntityReviewReferences = new Set(references)
    } else if (!sameSet(expectedEntityReviewReferences, references)) {
      invalid()
    }
  }
}

function canonicalPayload(
  input: MultiEntityStagingShadowExecutionEvidenceInput,
  bindings: readonly MultiEntityStagingExecutionBindingInput[]
) {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_staging_shadow_execution' as const,
    mode: 'authenticated_shadow_read_only' as const,
    environment: 'staging' as const,
    verdict: 'registered_for_manual_review' as const,
    canDeclareStagingReady: false as const,
    canDeploy: false as const,
    canMigrate: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    sourceSha: input.sourceSha,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    executionReviewReferenceDigest: digest(input.executionReviewReference),
    executionReportDigest: input.executionReportDigest,
    inputSnapshotDigest: input.inputSnapshotDigest,
    observedAtUtc: input.observedAtUtc,
    metrics: Object.freeze({ ...input.metrics }),
    bindings: Object.freeze(bindings.map((binding) => Object.freeze({ ...binding }))),
  })
}

function validateArtifactFields(artifact: MultiEntityStagingShadowExecutionEvidenceArtifact): void {
  if (
    !SOURCE_SHA_PATTERN.test(artifact.sourceSha) ||
    !DIGEST_PATTERN.test(artifact.sourceDigest) ||
    !DIGEST_PATTERN.test(artifact.targetTenantDigest) ||
    !DIGEST_PATTERN.test(artifact.campaignReviewReferenceDigest) ||
    !DIGEST_PATTERN.test(artifact.readinessReviewReferenceDigest) ||
    !DIGEST_PATTERN.test(artifact.executionReviewReferenceDigest) ||
    !DIGEST_PATTERN.test(artifact.executionReportDigest) ||
    !DIGEST_PATTERN.test(artifact.inputSnapshotDigest) ||
    artifact.campaignReviewReferenceDigest === artifact.readinessReviewReferenceDigest ||
    artifact.campaignReviewReferenceDigest === artifact.executionReviewReferenceDigest ||
    artifact.readinessReviewReferenceDigest === artifact.executionReviewReferenceDigest ||
    !validUtc(artifact.observedAtUtc) ||
    !validMetrics(artifact.metrics)
  ) {
    invalid()
  }
  validateBindings(artifact.bindings, artifact.readinessReviewReferenceDigest)
  const sortedBindings = [...artifact.bindings].sort(compareBindings)
  if (JSON.stringify(artifact.bindings) !== JSON.stringify(sortedBindings)) invalid()
  const canonical = canonicalArtifactPayload(artifact)
  if (
    artifact.artifactDigest !== digest(JSON.stringify(canonical)) ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalid()
  }
}

function validMetrics(
  value: unknown
): value is MultiEntityStagingShadowExecutionEvidenceInput['metrics'] {
  if (!value || typeof value !== 'object' || !exactKeys(value, METRIC_KEYS)) return false
  const metrics = value as MultiEntityStagingShadowExecutionEvidenceInput['metrics']
  return (
    metrics.requiredBindings === 56 &&
    metrics.observedBindings === 56 &&
    nonNegativeInteger(metrics.payloadReads) &&
    nonNegativeInteger(metrics.providerReads) &&
    metrics.writes === 0 &&
    metrics.permissionChanges === 0
  )
}

function canonicalArtifactPayload(artifact: MultiEntityStagingShadowExecutionEvidenceArtifact) {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_staging_shadow_execution' as const,
    mode: 'authenticated_shadow_read_only' as const,
    environment: 'staging' as const,
    verdict: 'registered_for_manual_review' as const,
    canDeclareStagingReady: false as const,
    canDeploy: false as const,
    canMigrate: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    sourceSha: artifact.sourceSha,
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    executionReviewReferenceDigest: artifact.executionReviewReferenceDigest,
    executionReportDigest: artifact.executionReportDigest,
    inputSnapshotDigest: artifact.inputSnapshotDigest,
    observedAtUtc: artifact.observedAtUtc,
    metrics: Object.freeze({ ...artifact.metrics }),
    bindings: Object.freeze(artifact.bindings.map((binding) => Object.freeze({ ...binding }))),
  })
}

function expectedBindings(): ReadonlyMap<string, string> {
  const entries: Array<[string, string]> = []
  for (const gate of MULTI_ENTITY_GLOBAL_STAGING_GATES) {
    const artifactKind = getMultiEntitySpecificEvidenceArtifactKind('global', gate)
    if (!artifactKind) invalid()
    entries.push([`global\u0000${gate}`, artifactKind])
  }
  for (const gate of MULTI_ENTITY_ENTITY_STAGING_GATES) {
    const artifactKind = getMultiEntitySpecificEvidenceArtifactKind('entity', gate)
    if (!artifactKind) invalid()
    entries.push([`entity\u0000${gate}`, artifactKind])
  }
  if (entries.length !== 32) invalid()
  return new Map(entries)
}

function validGate(
  scope: 'global' | 'entity',
  gate: MultiEntityGlobalStagingGate | MultiEntityEntityStagingGate
): boolean {
  return scope === 'global'
    ? (MULTI_ENTITY_GLOBAL_STAGING_GATES as readonly string[]).includes(gate)
    : (MULTI_ENTITY_ENTITY_STAGING_GATES as readonly string[]).includes(gate)
}

function compareBindings(
  left: MultiEntityStagingExecutionBindingInput,
  right: MultiEntityStagingExecutionBindingInput
): number {
  return `${left.scope}\u0000${left.gate}\u0000${left.reviewReference}`.localeCompare(
    `${right.scope}\u0000${right.gate}\u0000${right.reviewReference}`
  )
}

function sameSet(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  return left.size === right.size && [...left].every((value) => right.has(value))
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return keys.length === expected.size && keys.every((key) => expected.has(key))
}

function validReview(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_REFERENCE_PATTERN.test(value)
}

function validUtc(value: unknown): value is string {
  if (typeof value !== 'string' || !UTC_PATTERN.test(value)) return false
  return !Number.isNaN(new Date(value).getTime())
}

function nonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(value: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${value.slice('sha256:'.length)}`
}

function invalid(): never {
  throw new Error('MULTI_ENTITY_STAGING_SHADOW_EXECUTION_EVIDENCE_INVALID')
}
