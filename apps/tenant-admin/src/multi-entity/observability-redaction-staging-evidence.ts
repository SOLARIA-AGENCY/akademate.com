import { createHash } from 'node:crypto'

import {
  MULTI_ENTITY_SPECIFIC_EVIDENCE_ARTIFACT_POLICIES,
  type MultiEntitySpecificEvidenceArtifactPolicy,
} from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'
import type {
  MultiEntityEntityStagingGate,
  MultiEntityGlobalStagingGate,
} from '../../../../packages/tenant/src/multi-entity-staging-readiness'

export interface ObservabilityRedactionSurfaceInput {
  readonly scope: 'global' | 'entity'
  readonly gate: MultiEntityGlobalStagingGate | MultiEntityEntityStagingGate
  readonly artifactKind: string
  readonly artifactDigest: string
  readonly serializedArtifact: string
}

export interface ObservabilityRedactionStagingEvidenceInput {
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly surfaces: readonly ObservabilityRedactionSurfaceInput[]
}

export interface ObservabilityRedactionSurfaceEvidence {
  readonly scope: 'global' | 'entity'
  readonly gate: MultiEntityGlobalStagingGate | MultiEntityEntityStagingGate
  readonly artifactKind: string
  readonly artifactDigest: string
  readonly serializedArtifactDigest: string
  readonly bytes: number
  readonly nodes: number
}

export interface ObservabilityRedactionStagingEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_observability_redaction_evidence'
  readonly mode: 'exact_bound_artifact_redaction_review'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canEmitTelemetry: false
  readonly canPersistPayload: false
  readonly canReadRuntimeLogs: false
  readonly canDeploy: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly redactionPolicyDigest: string
  readonly surfaces: readonly ObservabilityRedactionSurfaceEvidence[]
  readonly metrics: {
    readonly requiredSurfaces: 55
    readonly reviewedSurfaces: 55
    readonly globalSurfaces: 19
    readonly entitySurfaces: 36
    readonly distinctArtifactKinds: 31
    readonly forbiddenKeyNames: number
    readonly totalBytes: number
    readonly totalNodes: number
    readonly telemetryEmissions: 0
    readonly persistedPayloads: 0
    readonly runtimeLogReads: 0
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

const OBSERVABILITY_GATE = 'observability_redaction_verified' as const
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const EVIDENCE_REFERENCE_PATTERN = /^evidence:\/\/sha256\/[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const ENUM_STRING_PATTERN = /^[a-z][a-z0-9_]{0,199}$/
const SOURCE_SHA_PATTERN = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/
const TOOL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$/
const VERSION_PATTERN = /^v?[0-9]+(?:\.[0-9]+){1,3}(?:[-+][A-Za-z0-9._-]+)?$/
const UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/
const FORBIDDEN_STRING_PATTERNS = [
  /review:\/\//i,
  /bearer\s+/i,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/,
  /^[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}$/,
  /[^\s@]+@[^\s@]+\.[^\s@]+/,
] as const
const FORBIDDEN_KEY_NAMES = Object.freeze([
  'tenantId',
  'legalEntityId',
  'userId',
  'email',
  'nif',
  'vatNumber',
  'iban',
  'accountId',
  'externalAccountId',
  'connectionId',
  'accountingConnectionId',
  'externalId',
  'externalCompanyId',
  'campaignId',
  'metaCampaignId',
  'courseRunId',
  'enrollmentId',
  'recordId',
  'password',
  'accessToken',
  'refreshToken',
  'secret',
  'secretReference',
  'credential',
  'cookie',
  'authorizationHeader',
  'rawPayload',
  'amount',
  'budget',
  'spend',
  'revenue',
  'profit',
  'costPerLead',
  'cpl',
  'cpc',
  'roi',
  'roas',
])
const FORBIDDEN_KEYS = new Set(FORBIDDEN_KEY_NAMES)
const INPUT_KEYS = new Set([
  'campaignReviewReference',
  'readinessReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'surfaces',
])
const SURFACE_INPUT_KEYS = new Set([
  'scope',
  'gate',
  'artifactKind',
  'artifactDigest',
  'serializedArtifact',
])
const ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canBindAutomatically',
  'canMarkVerified',
  'canEmitTelemetry',
  'canPersistPayload',
  'canReadRuntimeLogs',
  'canDeploy',
  'canActivate',
  'canChangePermissions',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'redactionPolicyDigest',
  'surfaces',
  'metrics',
  'artifactDigest',
  'evidenceReference',
])
const SURFACE_EVIDENCE_KEYS = new Set([
  'scope',
  'gate',
  'artifactKind',
  'artifactDigest',
  'serializedArtifactDigest',
  'bytes',
  'nodes',
])
const METRICS_KEYS = new Set([
  'requiredSurfaces',
  'reviewedSurfaces',
  'globalSurfaces',
  'entitySurfaces',
  'distinctArtifactKinds',
  'forbiddenKeyNames',
  'totalBytes',
  'totalNodes',
  'telemetryEmissions',
  'persistedPayloads',
  'runtimeLogReads',
])
const MAX_SERIALIZED_BYTES = 2_000_000
const MAX_DEPTH = 20
const MAX_NODES = 250_000

/**
 * Audits the exact 55 artifacts protected before this gate. It parses canonical
 * JSON and rejects raw identifiers, credentials, financial amounts, arbitrary
 * strings and malformed digest/reference fields. It emits no telemetry.
 */
export function createObservabilityRedactionStagingEvidenceArtifact(
  input: ObservabilityRedactionStagingEvidenceInput
): ObservabilityRedactionStagingEvidenceArtifact {
  validateInput(input)
  const expected = expectedPolicies()
  const occurrences = new Map(expected.map((policy) => [policyKey(policy), 0]))
  const artifactDigests = new Set<string>()
  const serializedDigests = new Set<string>()
  const surfaces = input.surfaces.map((surface) => {
    if (
      !surface ||
      typeof surface !== 'object' ||
      !exactKeys(surface, SURFACE_INPUT_KEYS) ||
      !validScope(surface.scope) ||
      !validArtifactKind(surface.artifactKind) ||
      !validDigest(surface.artifactDigest) ||
      typeof surface.serializedArtifact !== 'string' ||
      Buffer.byteLength(surface.serializedArtifact, 'utf8') === 0 ||
      Buffer.byteLength(surface.serializedArtifact, 'utf8') > MAX_SERIALIZED_BYTES ||
      artifactDigests.has(surface.artifactDigest)
    ) {
      invalidEvidence()
    }
    const key = `${surface.scope}\u0000${surface.gate}`
    const policy = expected.find((candidate) => policyKey(candidate) === key)
    if (!policy || policy.artifactKind !== surface.artifactKind) invalidEvidence()
    occurrences.set(key, (occurrences.get(key) ?? 0) + 1)
    artifactDigests.add(surface.artifactDigest)

    let parsed: unknown
    try {
      parsed = JSON.parse(surface.serializedArtifact)
    } catch {
      invalidEvidence()
    }
    if (
      !isPlainObject(parsed) ||
      JSON.stringify(parsed) !== surface.serializedArtifact ||
      parsed.kind !== surface.artifactKind ||
      parsed.artifactDigest !== surface.artifactDigest ||
      parsed.evidenceReference !== evidenceReference(surface.artifactDigest)
    ) {
      invalidEvidence()
    }
    const inspection = inspectRedactedJson(parsed)
    const serializedArtifactDigest = digest(surface.serializedArtifact)
    if (serializedDigests.has(serializedArtifactDigest)) invalidEvidence()
    serializedDigests.add(serializedArtifactDigest)
    return Object.freeze({
      scope: surface.scope,
      gate: surface.gate,
      artifactKind: surface.artifactKind,
      artifactDigest: surface.artifactDigest,
      serializedArtifactDigest,
      bytes: Buffer.byteLength(surface.serializedArtifact, 'utf8'),
      nodes: inspection.nodes,
    })
  })
  validateOccurrences(expected, occurrences)
  const canonicalSurfaces = Object.freeze(surfaces.sort(compareSurfaces))
  const metrics = Object.freeze({
    requiredSurfaces: 55 as const,
    reviewedSurfaces: 55 as const,
    globalSurfaces: 19 as const,
    entitySurfaces: 36 as const,
    distinctArtifactKinds: 31 as const,
    forbiddenKeyNames: FORBIDDEN_KEY_NAMES.length,
    totalBytes: sum(canonicalSurfaces, 'bytes'),
    totalNodes: sum(canonicalSurfaces, 'nodes'),
    telemetryEmissions: 0 as const,
    persistedPayloads: 0 as const,
    runtimeLogReads: 0 as const,
  })
  const canonical = artifactPayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    redactionPolicyDigest: currentPolicyDigest(expected),
    surfaces: canonicalSurfaces,
    metrics,
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  const artifact = Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
  assertObservabilityRedactionStagingEvidenceArtifact(artifact)
  return artifact
}

export function assertObservabilityRedactionStagingEvidenceArtifact(
  value: unknown
): asserts value is ObservabilityRedactionStagingEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, ARTIFACT_KEYS)) {
    invalidEvidence()
  }
  const artifact = value as ObservabilityRedactionStagingEvidenceArtifact
  const expected = expectedPolicies()
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_multi_entity_observability_redaction_evidence' ||
    artifact.mode !== 'exact_bound_artifact_redaction_review' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canEmitTelemetry !== false ||
    artifact.canPersistPayload !== false ||
    artifact.canReadRuntimeLogs !== false ||
    artifact.canDeploy !== false ||
    artifact.canActivate !== false ||
    artifact.canChangePermissions !== false ||
    !validDigest(artifact.sourceDigest) ||
    !validDigest(artifact.targetTenantDigest) ||
    artifact.sourceDigest === artifact.targetTenantDigest ||
    !validDigest(artifact.campaignReviewReferenceDigest) ||
    !validDigest(artifact.readinessReviewReferenceDigest) ||
    artifact.campaignReviewReferenceDigest === artifact.readinessReviewReferenceDigest ||
    artifact.redactionPolicyDigest !== currentPolicyDigest(expected) ||
    !Array.isArray(artifact.surfaces) ||
    artifact.surfaces.length !== 55 ||
    !artifact.metrics ||
    !exactKeys(artifact.metrics, METRICS_KEYS) ||
    artifact.metrics.requiredSurfaces !== 55 ||
    artifact.metrics.reviewedSurfaces !== 55 ||
    artifact.metrics.globalSurfaces !== 19 ||
    artifact.metrics.entitySurfaces !== 36 ||
    artifact.metrics.distinctArtifactKinds !== 31 ||
    artifact.metrics.forbiddenKeyNames !== FORBIDDEN_KEY_NAMES.length ||
    artifact.metrics.telemetryEmissions !== 0 ||
    artifact.metrics.persistedPayloads !== 0 ||
    artifact.metrics.runtimeLogReads !== 0 ||
    !positiveInteger(artifact.metrics.totalBytes) ||
    !positiveInteger(artifact.metrics.totalNodes) ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }
  validateSealedSurfaces(artifact.surfaces, expected)
  if (
    artifact.metrics.totalBytes !== sum(artifact.surfaces, 'bytes') ||
    artifact.metrics.totalNodes !== sum(artifact.surfaces, 'nodes')
  ) {
    invalidEvidence()
  }
  const canonical = artifactPayload({
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    redactionPolicyDigest: artifact.redactionPolicyDigest,
    surfaces: artifact.surfaces,
    metrics: artifact.metrics,
  })
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

export function serializeObservabilityRedactionStagingEvidenceArtifact(
  input: ObservabilityRedactionStagingEvidenceInput
): string {
  return JSON.stringify(createObservabilityRedactionStagingEvidenceArtifact(input))
}

function validateInput(input: ObservabilityRedactionStagingEvidenceInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference ||
    !validDigest(input.sourceDigest) ||
    !validDigest(input.targetTenantDigest) ||
    input.sourceDigest === input.targetTenantDigest ||
    !Array.isArray(input.surfaces) ||
    input.surfaces.length !== 55
  ) {
    invalidEvidence()
  }
}

function inspectRedactedJson(value: unknown): { readonly nodes: number } {
  const state = { nodes: 0 }
  inspectNode(value, null, 0, state)
  if (state.nodes === 0 || state.nodes > MAX_NODES) invalidEvidence()
  return Object.freeze({ nodes: state.nodes })
}

function inspectNode(
  value: unknown,
  key: string | null,
  depth: number,
  state: { nodes: number }
): void {
  state.nodes += 1
  if (state.nodes > MAX_NODES || depth > MAX_DEPTH) invalidEvidence()
  if (value === null || typeof value === 'boolean') return
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) invalidEvidence()
    return
  }
  if (typeof value === 'string') {
    validateString(value, key)
    return
  }
  if (Array.isArray(value)) {
    if (value.length > 100_000) invalidEvidence()
    value.forEach((entry) => inspectNode(entry, null, depth + 1, state))
    return
  }
  if (!isPlainObject(value)) invalidEvidence()
  const entries = Object.entries(value)
  if (entries.length > 10_000) invalidEvidence()
  for (const [childKey, childValue] of entries) {
    if (FORBIDDEN_KEYS.has(childKey) && !childKey.endsWith('Digest')) invalidEvidence()
    inspectNode(childValue, childKey, depth + 1, state)
  }
}

function validateString(value: string, key: string | null): void {
  if (value.length === 0 || value.length > 500 || /[\u0000-\u001f\u007f]/.test(value)) {
    invalidEvidence()
  }
  if (key?.endsWith('Digest')) {
    if (!validDigest(value)) invalidEvidence()
    return
  }
  if (key === 'evidenceReference') {
    if (!EVIDENCE_REFERENCE_PATTERN.test(value)) invalidEvidence()
    return
  }
  if (FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(value))) invalidEvidence()
  if (key === 'sourceSha') {
    if (!SOURCE_SHA_PATTERN.test(value)) invalidEvidence()
    return
  }
  if (key === 'tool') {
    if (!TOOL_PATTERN.test(value)) invalidEvidence()
    return
  }
  if (key === 'toolVersion') {
    if (!VERSION_PATTERN.test(value)) invalidEvidence()
    return
  }
  if (key === 'startedAtUtc' || key === 'finishedAtUtc') {
    if (!UTC_PATTERN.test(value)) invalidEvidence()
    return
  }
  if (!ENUM_STRING_PATTERN.test(value)) invalidEvidence()
}

function validateSealedSurfaces(
  surfaces: readonly ObservabilityRedactionSurfaceEvidence[],
  expected: readonly MultiEntitySpecificEvidenceArtifactPolicy[]
): void {
  const occurrences = new Map(expected.map((policy) => [policyKey(policy), 0]))
  const artifacts = new Set<string>()
  const serialized = new Set<string>()
  let previous = ''
  for (const surface of surfaces) {
    const encoded = JSON.stringify(surface)
    if (
      !surface ||
      typeof surface !== 'object' ||
      !exactKeys(surface, SURFACE_EVIDENCE_KEYS) ||
      !validScope(surface.scope) ||
      !validArtifactKind(surface.artifactKind) ||
      !validDigest(surface.artifactDigest) ||
      artifacts.has(surface.artifactDigest) ||
      !validDigest(surface.serializedArtifactDigest) ||
      serialized.has(surface.serializedArtifactDigest) ||
      !positiveInteger(surface.bytes) ||
      !positiveInteger(surface.nodes) ||
      (previous !== '' && previous.localeCompare(encoded) >= 0)
    ) {
      invalidEvidence()
    }
    const key = `${surface.scope}\u0000${surface.gate}`
    const policy = expected.find((candidate) => policyKey(candidate) === key)
    if (!policy || policy.artifactKind !== surface.artifactKind) invalidEvidence()
    occurrences.set(key, (occurrences.get(key) ?? 0) + 1)
    artifacts.add(surface.artifactDigest)
    serialized.add(surface.serializedArtifactDigest)
    previous = encoded
  }
  validateOccurrences(expected, occurrences)
}

function validateOccurrences(
  expected: readonly MultiEntitySpecificEvidenceArtifactPolicy[],
  occurrences: ReadonlyMap<string, number>
): void {
  for (const policy of expected) {
    if (occurrences.get(policyKey(policy)) !== (policy.scope === 'global' ? 1 : 3)) {
      invalidEvidence()
    }
  }
}

function expectedPolicies(): readonly MultiEntitySpecificEvidenceArtifactPolicy[] {
  const policies = MULTI_ENTITY_SPECIFIC_EVIDENCE_ARTIFACT_POLICIES.filter(
    ({ gate }) => gate !== OBSERVABILITY_GATE
  )
  const requiredSurfaces = policies.reduce(
    (total, policy) => total + (policy.scope === 'global' ? 1 : 3),
    0
  )
  if (policies.length !== 31 || requiredSurfaces !== 55) invalidEvidence()
  return policies
}

function currentPolicyDigest(
  expected: readonly MultiEntitySpecificEvidenceArtifactPolicy[]
): string {
  return digest(
    JSON.stringify({
      schemaVersion: 1,
      expected: [...expected].sort((left, right) =>
        policyKey(left).localeCompare(policyKey(right))
      ),
      forbiddenKeyNames: FORBIDDEN_KEY_NAMES,
      enumStringPattern: ENUM_STRING_PATTERN.source,
      sourceShaPattern: SOURCE_SHA_PATTERN.source,
      toolPattern: TOOL_PATTERN.source,
      versionPattern: VERSION_PATTERN.source,
      utcPattern: UTC_PATTERN.source,
      forbiddenStringPatterns: FORBIDDEN_STRING_PATTERNS.map(({ source }) => source),
      maximumSerializedBytes: MAX_SERIALIZED_BYTES,
      maximumDepth: MAX_DEPTH,
      maximumNodes: MAX_NODES,
    })
  )
}

function artifactPayload(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly redactionPolicyDigest: string
  readonly surfaces: readonly ObservabilityRedactionSurfaceEvidence[]
  readonly metrics: ObservabilityRedactionStagingEvidenceArtifact['metrics']
}) {
  return {
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_observability_redaction_evidence' as const,
    mode: 'exact_bound_artifact_redaction_review' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canEmitTelemetry: false as const,
    canPersistPayload: false as const,
    canReadRuntimeLogs: false as const,
    canDeploy: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: input.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: input.readinessReviewReferenceDigest,
    redactionPolicyDigest: input.redactionPolicyDigest,
    surfaces: input.surfaces,
    metrics: input.metrics,
  }
}

function compareSurfaces(
  left: ObservabilityRedactionSurfaceEvidence,
  right: ObservabilityRedactionSurfaceEvidence
): number {
  return JSON.stringify(left).localeCompare(JSON.stringify(right))
}

function sum(
  surfaces: readonly ObservabilityRedactionSurfaceEvidence[],
  field: 'bytes' | 'nodes'
): number {
  return surfaces.reduce((total, surface) => {
    const next = total + surface[field]
    if (!Number.isSafeInteger(next)) invalidEvidence()
    return next
  }, 0)
}

function policyKey(policy: MultiEntitySpecificEvidenceArtifactPolicy): string {
  return `${policy.scope}\u0000${policy.gate}`
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function validScope(value: unknown): value is 'global' | 'entity' {
  return value === 'global' || value === 'entity'
}

function validArtifactKind(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z][a-z0-9_]{2,99}$/.test(value)
}

function validDigest(value: unknown): value is string {
  return typeof value === 'string' && DIGEST_PATTERN.test(value)
}

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return (
    keys.length === expected.size &&
    keys.every((key) => expected.has(key)) &&
    [...expected].every((key) => Object.prototype.hasOwnProperty.call(value, key))
  )
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(value: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${value.slice('sha256:'.length)}`
}

function invalidEvidence(): never {
  throw new Error('OBSERVABILITY_REDACTION_STAGING_EVIDENCE_INVALID')
}
