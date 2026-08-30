import { createHash } from 'node:crypto'

import {
  assertMultiEntityAccessSurfaceBaseline,
  compareMultiEntityAccessSurfaceBaselines,
  type AccessSurfaceDigest,
  type AccessSurfaceReference,
  type MultiEntityAccessSurfaceBaselineManifest,
} from './multi-entity-access-surface-baseline'

export interface MultiEntityAccessSurfaceBaselineCaptureEvidenceInput {
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: AccessSurfaceDigest
  readonly targetTenantDigest: AccessSurfaceDigest
  readonly capturedAccess: MultiEntityAccessSurfaceBaselineManifest
}

export interface MultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_access_surface_baseline_capture_evidence'
  readonly mode: 'content_addressed_access_surface_capture'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canReadRuntime: false
  readonly canActivateAuthorization: false
  readonly canChangePermissions: false
  readonly containsSecrets: false
  readonly identifiersPseudonymized: true
  readonly sourceDigest: AccessSurfaceDigest
  readonly targetTenantDigest: AccessSurfaceDigest
  readonly targetTenantRefDigest: AccessSurfaceDigest
  readonly campaignReviewReferenceDigest: AccessSurfaceDigest
  readonly readinessReviewReferenceDigest: AccessSurfaceDigest
  readonly baselineDigest: AccessSurfaceDigest
  readonly sourceAuthorityDigest: AccessSurfaceDigest
  readonly metrics: MultiEntityAccessSurfaceBaselineManifest['metrics']
  readonly artifactDigest: AccessSurfaceDigest
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface MultiEntityAccessSurfaceBaselineUnchangedEvidenceInput {
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: AccessSurfaceDigest
  readonly targetTenantDigest: AccessSurfaceDigest
  readonly captureArtifact: MultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact
  readonly capturedAccess: MultiEntityAccessSurfaceBaselineManifest
  readonly currentAccess: MultiEntityAccessSurfaceBaselineManifest
}

export interface MultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_access_surface_baseline_unchanged_evidence'
  readonly mode: 'content_addressed_exact_access_surface_comparison'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canReadRuntime: false
  readonly canActivateAuthorization: false
  readonly canChangePermissions: false
  readonly containsSecrets: false
  readonly identifiersPseudonymized: true
  readonly sourceDigest: AccessSurfaceDigest
  readonly targetTenantDigest: AccessSurfaceDigest
  readonly targetTenantRefDigest: AccessSurfaceDigest
  readonly campaignReviewReferenceDigest: AccessSurfaceDigest
  readonly readinessReviewReferenceDigest: AccessSurfaceDigest
  readonly captureArtifactDigest: AccessSurfaceDigest
  readonly capturedBaselineDigest: AccessSurfaceDigest
  readonly currentBaselineDigest: AccessSurfaceDigest
  readonly sourceAuthorityDigest: AccessSurfaceDigest
  readonly metrics: {
    readonly capturedUsers: number
    readonly currentUsers: number
    readonly capturedMemberships: number
    readonly currentMemberships: number
    readonly capturedApiKeys: number
    readonly currentApiKeys: number
    readonly userDelta: 0
    readonly membershipDelta: 0
    readonly apiKeyDelta: 0
    readonly sourceAuthoritiesUnchanged: true
  }
  readonly artifactDigest: AccessSurfaceDigest
  readonly evidenceReference: `evidence://sha256/${string}`
}

/**
 * External context required to bind a content-addressed artifact to the
 * reviewed tenant and review references. This context is supplied by the
 * caller that owns the reviewed manifests; it is never read from runtime.
 */
export interface MultiEntityAccessSurfaceBaselineEvidenceBindingContext {
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: AccessSurfaceDigest
  readonly targetTenantDigest: AccessSurfaceDigest
  readonly targetTenantRef: AccessSurfaceReference
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const CAPTURE_INPUT_KEYS = new Set([
  'campaignReviewReference',
  'readinessReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'capturedAccess',
])
const UNCHANGED_INPUT_KEYS = new Set([
  'campaignReviewReference',
  'readinessReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'captureArtifact',
  'capturedAccess',
  'currentAccess',
])
const CAPTURE_ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canBindAutomatically',
  'canMarkVerified',
  'canReadRuntime',
  'canActivateAuthorization',
  'canChangePermissions',
  'containsSecrets',
  'identifiersPseudonymized',
  'sourceDigest',
  'targetTenantDigest',
  'targetTenantRefDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'baselineDigest',
  'sourceAuthorityDigest',
  'metrics',
  'artifactDigest',
  'evidenceReference',
])
const UNCHANGED_ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canBindAutomatically',
  'canMarkVerified',
  'canReadRuntime',
  'canActivateAuthorization',
  'canChangePermissions',
  'containsSecrets',
  'identifiersPseudonymized',
  'sourceDigest',
  'targetTenantDigest',
  'targetTenantRefDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'captureArtifactDigest',
  'capturedBaselineDigest',
  'currentBaselineDigest',
  'sourceAuthorityDigest',
  'metrics',
  'artifactDigest',
  'evidenceReference',
])
const CAPTURE_METRICS_KEYS = new Set([
  'users',
  'memberships',
  'apiKeys',
  'activeMemberships',
  'activeApiKeys',
  'grantedRoles',
  'grantedScopes',
])
const UNCHANGED_METRICS_KEYS = new Set([
  'capturedUsers',
  'currentUsers',
  'capturedMemberships',
  'currentMemberships',
  'capturedApiKeys',
  'currentApiKeys',
  'userDelta',
  'membershipDelta',
  'apiKeyDelta',
  'sourceAuthoritiesUnchanged',
])

/**
 * Seals a redacted offline access-surface snapshot for manual review. It does
 * not read runtime state and does not assert that the snapshot came from a
 * particular environment or backup.
 */
export function createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(
  input: MultiEntityAccessSurfaceBaselineCaptureEvidenceInput
): MultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact {
  validateCaptureInput(input)
  const canonical = capturePayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    targetTenantRefDigest: digest(input.capturedAccess.targetTenantRef),
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    baselineDigest: input.capturedAccess.digest,
    sourceAuthorityDigest: sourceAuthorityDigest(input.capturedAccess),
    metrics: copyCaptureMetrics(input.capturedAccess.metrics),
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

export function assertMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(
  value: unknown
): asserts value is MultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, CAPTURE_ARTIFACT_KEYS)) {
    invalidEvidence()
  }
  const artifact = value as MultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact
  if (
    !validCaptureArtifactFlags(artifact) ||
    !validCommonDigests(artifact) ||
    !DIGEST_PATTERN.test(artifact.targetTenantRefDigest) ||
    !DIGEST_PATTERN.test(artifact.baselineDigest) ||
    !DIGEST_PATTERN.test(artifact.sourceAuthorityDigest) ||
    !validCaptureMetrics(artifact.metrics) ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }
  const canonical = capturePayload({
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    targetTenantRefDigest: artifact.targetTenantRefDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    baselineDigest: artifact.baselineDigest,
    sourceAuthorityDigest: artifact.sourceAuthorityDigest,
    metrics: artifact.metrics,
  })
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

/**
 * Verifies a capture artifact against the exact reviewed input and external
 * context. The standalone artifact assertion only proves shape and its own
 * content hash; this bound assertion additionally rejects tenant relabeling
 * and review/source context substitution.
 */
export function assertMultiEntityAccessSurfaceBaselineCaptureEvidenceBoundToInput(
  value: unknown,
  input: MultiEntityAccessSurfaceBaselineCaptureEvidenceInput,
  context: MultiEntityAccessSurfaceBaselineEvidenceBindingContext
): asserts value is MultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact {
  try {
    assertMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(value)
    validateCaptureInput(input)
    validateBindingContext(context)
    if (
      input.campaignReviewReference !== context.campaignReviewReference ||
      input.readinessReviewReference !== context.readinessReviewReference ||
      input.sourceDigest !== context.sourceDigest ||
      input.targetTenantDigest !== context.targetTenantDigest ||
      input.capturedAccess.targetTenantRef !== context.targetTenantRef ||
      value.targetTenantRefDigest !== digest(context.targetTenantRef)
    ) {
      invalidEvidence()
    }
    const expected = createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(input)
    if (JSON.stringify(value) !== JSON.stringify(expected)) invalidEvidence()
  } catch {
    invalidEvidence()
  }
}

/** Seals an exact unchanged comparison bound to the expanded capture artifact. */
export function createMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact(
  input: MultiEntityAccessSurfaceBaselineUnchangedEvidenceInput
): MultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact {
  validateUnchangedInput(input)
  const comparison = compareMultiEntityAccessSurfaceBaselines(
    input.capturedAccess,
    input.currentAccess
  )
  if (
    comparison.verdict !== 'unchanged' ||
    comparison.metrics.sourceAuthoritiesUnchanged !== true ||
    comparison.metrics.userDelta !== 0 ||
    comparison.metrics.membershipDelta !== 0 ||
    comparison.metrics.apiKeyDelta !== 0
  ) {
    invalidEvidence()
  }
  const metrics = Object.freeze({
    capturedUsers: input.capturedAccess.metrics.users,
    currentUsers: input.currentAccess.metrics.users,
    capturedMemberships: input.capturedAccess.metrics.memberships,
    currentMemberships: input.currentAccess.metrics.memberships,
    capturedApiKeys: input.capturedAccess.metrics.apiKeys,
    currentApiKeys: input.currentAccess.metrics.apiKeys,
    userDelta: 0 as const,
    membershipDelta: 0 as const,
    apiKeyDelta: 0 as const,
    sourceAuthoritiesUnchanged: true as const,
  })
  const canonical = unchangedPayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    targetTenantRefDigest: digest(input.capturedAccess.targetTenantRef),
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    captureArtifactDigest: input.captureArtifact.artifactDigest,
    capturedBaselineDigest: input.capturedAccess.digest,
    currentBaselineDigest: input.currentAccess.digest,
    sourceAuthorityDigest: sourceAuthorityDigest(input.capturedAccess),
    metrics,
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

export function assertMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact(
  value: unknown
): asserts value is MultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, UNCHANGED_ARTIFACT_KEYS)) {
    invalidEvidence()
  }
  const artifact = value as MultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact
  if (
    !validUnchangedArtifactFlags(artifact) ||
    !validCommonDigests(artifact) ||
    !DIGEST_PATTERN.test(artifact.targetTenantRefDigest) ||
    !DIGEST_PATTERN.test(artifact.captureArtifactDigest) ||
    !DIGEST_PATTERN.test(artifact.capturedBaselineDigest) ||
    !DIGEST_PATTERN.test(artifact.currentBaselineDigest) ||
    !DIGEST_PATTERN.test(artifact.sourceAuthorityDigest) ||
    !validUnchangedMetrics(artifact.metrics) ||
    artifact.capturedBaselineDigest !== artifact.currentBaselineDigest ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }
  const canonical = unchangedPayload({
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    targetTenantRefDigest: artifact.targetTenantRefDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    captureArtifactDigest: artifact.captureArtifactDigest,
    capturedBaselineDigest: artifact.capturedBaselineDigest,
    currentBaselineDigest: artifact.currentBaselineDigest,
    sourceAuthorityDigest: artifact.sourceAuthorityDigest,
    metrics: artifact.metrics,
  })
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

/**
 * Verifies an unchanged artifact against the exact capture/current manifests,
 * capture chain and external context. It remains a source-level check and
 * cannot attest staging, read runtime state or change authorization.
 */
export function assertMultiEntityAccessSurfaceBaselineUnchangedEvidenceBoundToInput(
  value: unknown,
  input: MultiEntityAccessSurfaceBaselineUnchangedEvidenceInput,
  context: MultiEntityAccessSurfaceBaselineEvidenceBindingContext
): asserts value is MultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact {
  try {
    assertMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact(value)
    validateUnchangedInput(input)
    validateBindingContext(context)
    if (
      input.campaignReviewReference !== context.campaignReviewReference ||
      input.readinessReviewReference !== context.readinessReviewReference ||
      input.sourceDigest !== context.sourceDigest ||
      input.targetTenantDigest !== context.targetTenantDigest ||
      input.capturedAccess.targetTenantRef !== context.targetTenantRef ||
      input.currentAccess.targetTenantRef !== context.targetTenantRef ||
      value.targetTenantRefDigest !== digest(context.targetTenantRef)
    ) {
      invalidEvidence()
    }
    const expected = createMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact(input)
    if (JSON.stringify(value) !== JSON.stringify(expected)) invalidEvidence()
  } catch {
    invalidEvidence()
  }
}

export function serializeMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(
  input: MultiEntityAccessSurfaceBaselineCaptureEvidenceInput
): string {
  return JSON.stringify(createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(input))
}

export function serializeMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact(
  input: MultiEntityAccessSurfaceBaselineUnchangedEvidenceInput
): string {
  return JSON.stringify(createMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact(input))
}

function validateCaptureInput(input: MultiEntityAccessSurfaceBaselineCaptureEvidenceInput): void {
  if (!validEnvelope(input, CAPTURE_INPUT_KEYS)) invalidEvidence()
  try {
    assertMultiEntityAccessSurfaceBaseline(input.capturedAccess)
  } catch {
    invalidEvidence()
  }
}

function validateUnchangedInput(
  input: MultiEntityAccessSurfaceBaselineUnchangedEvidenceInput
): void {
  if (!validEnvelope(input, UNCHANGED_INPUT_KEYS)) invalidEvidence()
  try {
    assertMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(input.captureArtifact)
    assertMultiEntityAccessSurfaceBaseline(input.capturedAccess)
    assertMultiEntityAccessSurfaceBaseline(input.currentAccess)
  } catch {
    invalidEvidence()
  }
  if (
    input.captureArtifact.sourceDigest !== input.sourceDigest ||
    input.captureArtifact.targetTenantDigest !== input.targetTenantDigest ||
    input.captureArtifact.targetTenantRefDigest !== digest(input.capturedAccess.targetTenantRef) ||
    input.captureArtifact.campaignReviewReferenceDigest !== digest(input.campaignReviewReference) ||
    input.captureArtifact.readinessReviewReferenceDigest !==
      digest(input.readinessReviewReference) ||
    input.captureArtifact.baselineDigest !== input.capturedAccess.digest ||
    input.captureArtifact.sourceAuthorityDigest !== sourceAuthorityDigest(input.capturedAccess)
  ) {
    invalidEvidence()
  }
}

function validateBindingContext(
  context: MultiEntityAccessSurfaceBaselineEvidenceBindingContext
): void {
  if (
    !context ||
    typeof context !== 'object' ||
    !REVIEW_REFERENCE_PATTERN.test(context.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(context.readinessReviewReference) ||
    context.campaignReviewReference === context.readinessReviewReference ||
    !DIGEST_PATTERN.test(context.sourceDigest) ||
    !DIGEST_PATTERN.test(context.targetTenantDigest) ||
    context.sourceDigest === context.targetTenantDigest ||
    !/^ref:sha256:[a-f0-9]{64}$/.test(context.targetTenantRef)
  ) {
    invalidEvidence()
  }
}

function validEnvelope(
  input:
    | MultiEntityAccessSurfaceBaselineCaptureEvidenceInput
    | MultiEntityAccessSurfaceBaselineUnchangedEvidenceInput,
  keys: ReadonlySet<string>
): boolean {
  return (
    Boolean(input) &&
    typeof input === 'object' &&
    exactKeys(input, keys) &&
    REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) &&
    REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) &&
    input.campaignReviewReference !== input.readinessReviewReference &&
    DIGEST_PATTERN.test(input.sourceDigest) &&
    DIGEST_PATTERN.test(input.targetTenantDigest) &&
    input.sourceDigest !== input.targetTenantDigest
  )
}

function capturePayload(
  input: Pick<
    MultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact,
    | 'sourceDigest'
    | 'targetTenantDigest'
    | 'targetTenantRefDigest'
    | 'campaignReviewReferenceDigest'
    | 'readinessReviewReferenceDigest'
    | 'baselineDigest'
    | 'sourceAuthorityDigest'
    | 'metrics'
  >
) {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_access_surface_baseline_capture_evidence' as const,
    mode: 'content_addressed_access_surface_capture' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canReadRuntime: false as const,
    canActivateAuthorization: false as const,
    canChangePermissions: false as const,
    containsSecrets: false as const,
    identifiersPseudonymized: true as const,
    ...input,
  })
}

function unchangedPayload(
  input: Pick<
    MultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact,
    | 'sourceDigest'
    | 'targetTenantDigest'
    | 'targetTenantRefDigest'
    | 'campaignReviewReferenceDigest'
    | 'readinessReviewReferenceDigest'
    | 'captureArtifactDigest'
    | 'capturedBaselineDigest'
    | 'currentBaselineDigest'
    | 'sourceAuthorityDigest'
    | 'metrics'
  >
) {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_access_surface_baseline_unchanged_evidence' as const,
    mode: 'content_addressed_exact_access_surface_comparison' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canReadRuntime: false as const,
    canActivateAuthorization: false as const,
    canChangePermissions: false as const,
    containsSecrets: false as const,
    identifiersPseudonymized: true as const,
    ...input,
  })
}

function copyCaptureMetrics(
  metrics: MultiEntityAccessSurfaceBaselineManifest['metrics']
): MultiEntityAccessSurfaceBaselineManifest['metrics'] {
  return Object.freeze({ ...metrics })
}

function validCaptureArtifactFlags(
  artifact: MultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact
): boolean {
  return (
    artifact.schemaVersion === 1 &&
    artifact.kind === 'cep_access_surface_baseline_capture_evidence' &&
    artifact.mode === 'content_addressed_access_surface_capture' &&
    artifact.verdict === 'eligible_for_manual_staging_binding' &&
    artifact.canBindAutomatically === false &&
    artifact.canMarkVerified === false &&
    artifact.canReadRuntime === false &&
    artifact.canActivateAuthorization === false &&
    artifact.canChangePermissions === false &&
    artifact.containsSecrets === false &&
    artifact.identifiersPseudonymized === true
  )
}

function validUnchangedArtifactFlags(
  artifact: MultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact
): boolean {
  return (
    artifact.schemaVersion === 1 &&
    artifact.kind === 'cep_access_surface_baseline_unchanged_evidence' &&
    artifact.mode === 'content_addressed_exact_access_surface_comparison' &&
    artifact.verdict === 'eligible_for_manual_staging_binding' &&
    artifact.canBindAutomatically === false &&
    artifact.canMarkVerified === false &&
    artifact.canReadRuntime === false &&
    artifact.canActivateAuthorization === false &&
    artifact.canChangePermissions === false &&
    artifact.containsSecrets === false &&
    artifact.identifiersPseudonymized === true
  )
}

function validCommonDigests(
  artifact:
    | MultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact
    | MultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact
): boolean {
  return (
    DIGEST_PATTERN.test(artifact.sourceDigest) &&
    DIGEST_PATTERN.test(artifact.targetTenantDigest) &&
    DIGEST_PATTERN.test(artifact.campaignReviewReferenceDigest) &&
    DIGEST_PATTERN.test(artifact.readinessReviewReferenceDigest) &&
    artifact.sourceDigest !== artifact.targetTenantDigest &&
    artifact.campaignReviewReferenceDigest !== artifact.readinessReviewReferenceDigest &&
    DIGEST_PATTERN.test(artifact.artifactDigest)
  )
}

function validCaptureMetrics(
  metrics: MultiEntityAccessSurfaceBaselineManifest['metrics']
): boolean {
  return (
    Boolean(metrics) &&
    exactKeys(metrics, CAPTURE_METRICS_KEYS) &&
    [
      metrics.users,
      metrics.memberships,
      metrics.apiKeys,
      metrics.activeMemberships,
      metrics.activeApiKeys,
      metrics.grantedRoles,
      metrics.grantedScopes,
    ].every(nonNegativeInteger) &&
    metrics.activeMemberships <= metrics.memberships &&
    metrics.activeApiKeys <= metrics.apiKeys
  )
}

function validUnchangedMetrics(
  metrics: MultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact['metrics']
): boolean {
  return (
    Boolean(metrics) &&
    exactKeys(metrics, UNCHANGED_METRICS_KEYS) &&
    [
      metrics.capturedUsers,
      metrics.currentUsers,
      metrics.capturedMemberships,
      metrics.currentMemberships,
      metrics.capturedApiKeys,
      metrics.currentApiKeys,
    ].every(nonNegativeInteger) &&
    metrics.userDelta === 0 &&
    metrics.membershipDelta === 0 &&
    metrics.apiKeyDelta === 0 &&
    metrics.capturedUsers === metrics.currentUsers &&
    metrics.capturedMemberships === metrics.currentMemberships &&
    metrics.capturedApiKeys === metrics.currentApiKeys &&
    metrics.sourceAuthoritiesUnchanged === true
  )
}

function sourceAuthorityDigest(
  manifest: MultiEntityAccessSurfaceBaselineManifest
): AccessSurfaceDigest {
  return digest(JSON.stringify(manifest.sourceDigests))
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return (
    keys.length === expected.size &&
    keys.every((key) => expected.has(key)) &&
    [...expected].every((key) => Object.prototype.hasOwnProperty.call(value, key))
  )
}

function nonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0
}

function digest(value: string): AccessSurfaceDigest {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(artifactDigest: AccessSurfaceDigest): `evidence://sha256/${string}` {
  return `evidence://sha256/${artifactDigest.slice('sha256:'.length)}`
}

function invalidEvidence(): never {
  throw new Error('MULTI_ENTITY_ACCESS_SURFACE_BASELINE_EVIDENCE_INVALID')
}
