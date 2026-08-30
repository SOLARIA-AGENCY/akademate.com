import { createHash } from 'node:crypto'

import {
  assertMultiEntityAccessBaselineManifest,
  compareMultiEntityAccessBaselines,
  type LegacyAccessRole,
  type MultiEntityAccessBaselineManifest,
} from './multi-entity-access-baseline'

export interface MultiEntityAccessBaselineCaptureEvidenceInput {
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly capturedAccess: MultiEntityAccessBaselineManifest
}

export interface MultiEntityAccessBaselineCaptureEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_access_baseline_capture_evidence'
  readonly mode: 'content_addressed_capture_review'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canActivateAuthorization: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly baselineDigest: string
  readonly policyDigest: string
  readonly metrics: MultiEntityAccessBaselineManifest['metrics']
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface MultiEntityAccessUnchangedEvidenceInput {
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly captureArtifact: MultiEntityAccessBaselineCaptureEvidenceArtifact
  readonly capturedAccess: MultiEntityAccessBaselineManifest
  readonly currentAccess: MultiEntityAccessBaselineManifest
}

export interface MultiEntityAccessUnchangedEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_access_baseline_unchanged_evidence'
  readonly mode: 'content_addressed_exact_access_comparison'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canActivateAuthorization: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly captureArtifactDigest: string
  readonly capturedBaselineDigest: string
  readonly currentBaselineDigest: string
  readonly policyDigest: string
  readonly metrics: {
    readonly capturedUsers: number
    readonly currentUsers: number
    readonly userCountDelta: 0
    readonly policyUnchanged: true
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
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
  'canActivateAuthorization',
  'canChangePermissions',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'baselineDigest',
  'policyDigest',
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
  'canActivateAuthorization',
  'canChangePermissions',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'captureArtifactDigest',
  'capturedBaselineDigest',
  'currentBaselineDigest',
  'policyDigest',
  'metrics',
  'artifactDigest',
  'evidenceReference',
])
const METRICS_KEYS = new Set([
  'users',
  'activeUsers',
  'inactiveUsers',
  'unsetActiveStateUsers',
  'tenantUsers',
  'platformSuperadmins',
  'roles',
])
const COMPARISON_METRICS_KEYS = new Set([
  'capturedUsers',
  'currentUsers',
  'userCountDelta',
  'policyUnchanged',
])
const ROLES: readonly LegacyAccessRole[] = [
  'superadmin',
  'admin',
  'gestor',
  'marketing',
  'asesor',
  'lectura',
]
const ROLE_KEYS = new Set(ROLES)

/**
 * Seals the already anonymized access snapshot for manual review. It proves
 * content consistency only; it is neither signed nor an attestation that the
 * snapshot was read from production.
 */
export function createMultiEntityAccessBaselineCaptureEvidenceArtifact(
  input: MultiEntityAccessBaselineCaptureEvidenceInput
): MultiEntityAccessBaselineCaptureEvidenceArtifact {
  validateCaptureInput(input)
  const metrics = copyMetrics(input.capturedAccess.metrics)
  const canonical = capturePayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    baselineDigest: input.capturedAccess.digest,
    policyDigest: input.capturedAccess.policyDigest,
    metrics,
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

export function assertMultiEntityAccessBaselineCaptureEvidenceArtifact(
  value: unknown
): asserts value is MultiEntityAccessBaselineCaptureEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, CAPTURE_ARTIFACT_KEYS)) {
    invalidEvidence()
  }
  const artifact = value as MultiEntityAccessBaselineCaptureEvidenceArtifact
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_access_baseline_capture_evidence' ||
    artifact.mode !== 'content_addressed_capture_review' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canActivateAuthorization !== false ||
    artifact.canChangePermissions !== false ||
    !validBoundDigests(artifact) ||
    !validMetrics(artifact.metrics) ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }
  const canonical = capturePayload({
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    baselineDigest: artifact.baselineDigest,
    policyDigest: artifact.policyDigest,
    metrics: artifact.metrics,
  })
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

/** Seals an exact unchanged comparison bound to the reviewed capture artifact. */
export function createMultiEntityAccessUnchangedEvidenceArtifact(
  input: MultiEntityAccessUnchangedEvidenceInput
): MultiEntityAccessUnchangedEvidenceArtifact {
  validateUnchangedInput(input)
  const comparison = compareMultiEntityAccessBaselines(input.capturedAccess, input.currentAccess)
  if (
    comparison.verdict !== 'unchanged' ||
    comparison.metrics.policyUnchanged !== true ||
    comparison.metrics.userCountDelta !== 0
  ) {
    invalidEvidence()
  }
  const metrics = Object.freeze({
    capturedUsers: comparison.metrics.capturedUsers,
    currentUsers: comparison.metrics.currentUsers,
    userCountDelta: 0 as const,
    policyUnchanged: true as const,
  })
  const canonical = unchangedPayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    captureArtifactDigest: input.captureArtifact.artifactDigest,
    capturedBaselineDigest: comparison.capturedDigest,
    currentBaselineDigest: comparison.currentDigest,
    policyDigest: input.capturedAccess.policyDigest,
    metrics,
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

export function assertMultiEntityAccessUnchangedEvidenceArtifact(
  value: unknown
): asserts value is MultiEntityAccessUnchangedEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, UNCHANGED_ARTIFACT_KEYS)) {
    invalidEvidence()
  }
  const artifact = value as MultiEntityAccessUnchangedEvidenceArtifact
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_access_baseline_unchanged_evidence' ||
    artifact.mode !== 'content_addressed_exact_access_comparison' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canActivateAuthorization !== false ||
    artifact.canChangePermissions !== false ||
    !validUnchangedDigests(artifact) ||
    !artifact.metrics ||
    !exactKeys(artifact.metrics, COMPARISON_METRICS_KEYS) ||
    !nonNegativeInteger(artifact.metrics.capturedUsers) ||
    artifact.metrics.currentUsers !== artifact.metrics.capturedUsers ||
    artifact.metrics.userCountDelta !== 0 ||
    artifact.metrics.policyUnchanged !== true ||
    artifact.capturedBaselineDigest !== artifact.currentBaselineDigest ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }
  const canonical = unchangedPayload({
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    captureArtifactDigest: artifact.captureArtifactDigest,
    capturedBaselineDigest: artifact.capturedBaselineDigest,
    currentBaselineDigest: artifact.currentBaselineDigest,
    policyDigest: artifact.policyDigest,
    metrics: artifact.metrics,
  })
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

function validateCaptureInput(input: MultiEntityAccessBaselineCaptureEvidenceInput): void {
  if (!validEnvelope(input, CAPTURE_INPUT_KEYS)) invalidEvidence()
  try {
    assertMultiEntityAccessBaselineManifest(input.capturedAccess)
  } catch {
    invalidEvidence()
  }
}

function validateUnchangedInput(input: MultiEntityAccessUnchangedEvidenceInput): void {
  if (!validEnvelope(input, UNCHANGED_INPUT_KEYS)) invalidEvidence()
  try {
    assertMultiEntityAccessBaselineCaptureEvidenceArtifact(input.captureArtifact)
    assertMultiEntityAccessBaselineManifest(input.capturedAccess)
    assertMultiEntityAccessBaselineManifest(input.currentAccess)
  } catch {
    invalidEvidence()
  }
  if (
    input.captureArtifact.sourceDigest !== input.sourceDigest ||
    input.captureArtifact.targetTenantDigest !== input.targetTenantDigest ||
    input.captureArtifact.campaignReviewReferenceDigest !== digest(input.campaignReviewReference) ||
    input.captureArtifact.readinessReviewReferenceDigest !==
      digest(input.readinessReviewReference) ||
    input.captureArtifact.baselineDigest !== input.capturedAccess.digest ||
    input.captureArtifact.policyDigest !== input.capturedAccess.policyDigest
  ) {
    invalidEvidence()
  }
}

function validEnvelope(
  input: MultiEntityAccessBaselineCaptureEvidenceInput | MultiEntityAccessUnchangedEvidenceInput,
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
    MultiEntityAccessBaselineCaptureEvidenceArtifact,
    | 'sourceDigest'
    | 'targetTenantDigest'
    | 'campaignReviewReferenceDigest'
    | 'readinessReviewReferenceDigest'
    | 'baselineDigest'
    | 'policyDigest'
    | 'metrics'
  >
) {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_access_baseline_capture_evidence' as const,
    mode: 'content_addressed_capture_review' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canActivateAuthorization: false as const,
    canChangePermissions: false as const,
    ...input,
  })
}

function unchangedPayload(
  input: Pick<
    MultiEntityAccessUnchangedEvidenceArtifact,
    | 'sourceDigest'
    | 'targetTenantDigest'
    | 'campaignReviewReferenceDigest'
    | 'readinessReviewReferenceDigest'
    | 'captureArtifactDigest'
    | 'capturedBaselineDigest'
    | 'currentBaselineDigest'
    | 'policyDigest'
    | 'metrics'
  >
) {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_access_baseline_unchanged_evidence' as const,
    mode: 'content_addressed_exact_access_comparison' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canActivateAuthorization: false as const,
    canChangePermissions: false as const,
    ...input,
  })
}

function copyMetrics(metrics: MultiEntityAccessBaselineManifest['metrics']) {
  return Object.freeze({
    users: metrics.users,
    activeUsers: metrics.activeUsers,
    inactiveUsers: metrics.inactiveUsers,
    unsetActiveStateUsers: metrics.unsetActiveStateUsers,
    tenantUsers: metrics.tenantUsers,
    platformSuperadmins: metrics.platformSuperadmins,
    roles: Object.freeze(
      Object.fromEntries(ROLES.map((role) => [role, metrics.roles[role]])) as Record<
        LegacyAccessRole,
        number
      >
    ),
  })
}

function validBoundDigests(artifact: MultiEntityAccessBaselineCaptureEvidenceArtifact): boolean {
  return (
    [
      artifact.sourceDigest,
      artifact.targetTenantDigest,
      artifact.campaignReviewReferenceDigest,
      artifact.readinessReviewReferenceDigest,
      artifact.baselineDigest,
      artifact.policyDigest,
      artifact.artifactDigest,
    ].every((value) => DIGEST_PATTERN.test(value)) &&
    artifact.sourceDigest !== artifact.targetTenantDigest &&
    artifact.campaignReviewReferenceDigest !== artifact.readinessReviewReferenceDigest
  )
}

function validUnchangedDigests(artifact: MultiEntityAccessUnchangedEvidenceArtifact): boolean {
  return (
    [
      artifact.sourceDigest,
      artifact.targetTenantDigest,
      artifact.campaignReviewReferenceDigest,
      artifact.readinessReviewReferenceDigest,
      artifact.captureArtifactDigest,
      artifact.capturedBaselineDigest,
      artifact.currentBaselineDigest,
      artifact.policyDigest,
      artifact.artifactDigest,
    ].every((value) => DIGEST_PATTERN.test(value)) &&
    artifact.sourceDigest !== artifact.targetTenantDigest &&
    artifact.campaignReviewReferenceDigest !== artifact.readinessReviewReferenceDigest
  )
}

function validMetrics(metrics: MultiEntityAccessBaselineManifest['metrics']): boolean {
  if (
    !metrics ||
    !exactKeys(metrics, METRICS_KEYS) ||
    !metrics.roles ||
    !exactKeys(metrics.roles, ROLE_KEYS) ||
    ![
      metrics.users,
      metrics.activeUsers,
      metrics.inactiveUsers,
      metrics.unsetActiveStateUsers,
      metrics.tenantUsers,
      metrics.platformSuperadmins,
      ...ROLES.map((role) => metrics.roles[role]),
    ].every(nonNegativeInteger)
  ) {
    return false
  }
  return (
    metrics.activeUsers + metrics.inactiveUsers + metrics.unsetActiveStateUsers === metrics.users &&
    metrics.tenantUsers + metrics.platformSuperadmins === metrics.users &&
    ROLES.reduce((total, role) => total + metrics.roles[role], 0) === metrics.users
  )
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

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(artifactDigest: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${artifactDigest.slice('sha256:'.length)}`
}

function invalidEvidence(): never {
  throw new Error('MULTI_ENTITY_ACCESS_BASELINE_EVIDENCE_INVALID')
}
