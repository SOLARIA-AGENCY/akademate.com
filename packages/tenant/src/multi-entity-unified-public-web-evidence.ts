import { createHash } from 'node:crypto'

import {
  createPublicProjectionStagingEvidenceManifest,
  type PublicProjectionStagingEvidenceSample,
} from './multi-entity-public-projection-evidence'

export interface UnifiedPublicWebEvidenceInput {
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly PublicProjectionStagingEvidenceSample[]
}

export interface UnifiedPublicWebEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_unified_public_web_review_evidence'
  readonly mode: 'three_sample_unified_public_surface_review'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canReadPayload: false
  readonly canWrite: false
  readonly canPublish: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly canExposeEntityData: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly manifestDigest: string
  readonly sampleObservationDigests: readonly [
    { readonly sampleDigest: string },
    { readonly sampleDigest: string },
    { readonly sampleDigest: string },
  ]
  readonly metrics: {
    readonly requiredSamples: 3
    readonly reviewedSamples: 3
    readonly alignedSamples: 3
    readonly divergentSamples: 0
    readonly blockedSamples: 0
    readonly minimumPublicCampuses: 3
    readonly minimumProjectedRuns: 3
    readonly minimumSharedPublicCourses: 1
    readonly sourceCampusesMin: number
    readonly projectedRunsMin: number
    readonly sharedPublicCoursesMin: number
    readonly ignoredNonPublicRuns: number
    readonly totalDifferences: 0
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set([
  'campaignReviewReference',
  'readinessReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'samples',
])
const ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canBindAutomatically',
  'canMarkVerified',
  'canReadPayload',
  'canWrite',
  'canPublish',
  'canActivate',
  'canChangePermissions',
  'canExposeEntityData',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'manifestDigest',
  'sampleObservationDigests',
  'metrics',
  'artifactDigest',
  'evidenceReference',
])
const METRICS_KEYS = new Set([
  'requiredSamples',
  'reviewedSamples',
  'alignedSamples',
  'divergentSamples',
  'blockedSamples',
  'minimumPublicCampuses',
  'minimumProjectedRuns',
  'minimumSharedPublicCourses',
  'sourceCampusesMin',
  'projectedRunsMin',
  'sharedPublicCoursesMin',
  'ignoredNonPublicRuns',
  'totalDifferences',
])
const SAMPLE_DIGEST_KEYS = new Set(['sampleDigest'])

/** Seals three aligned public projections without publishing or reading Payload. */
export function createUnifiedPublicWebEvidenceArtifact(
  input: UnifiedPublicWebEvidenceInput
): UnifiedPublicWebEvidenceArtifact {
  validateInput(input)
  let manifest
  try {
    manifest = createPublicProjectionStagingEvidenceManifest(input.samples)
  } catch {
    invalidEvidence()
  }
  if (
    manifest.verdict !== 'ready_for_staging_review' ||
    manifest.metrics.runs !== 3 ||
    manifest.metrics.alignedRuns !== 3 ||
    manifest.metrics.divergentRuns !== 0 ||
    manifest.metrics.blockedRuns !== 0 ||
    manifest.metrics.totalDifferences !== 0
  ) {
    invalidEvidence()
  }

  const observations = input.samples.map(({ observation }) => observation)
  const sampleObservationDigests = input.samples
    .map(({ observation }) => ({
      sampleDigest: digest(JSON.stringify(observation)),
    }))
    .sort((left, right) => left.sampleDigest.localeCompare(right.sampleDigest)) as [
    { sampleDigest: string },
    { sampleDigest: string },
    { sampleDigest: string },
  ]
  if (new Set(sampleObservationDigests.map(({ sampleDigest }) => sampleDigest)).size !== 3) {
    invalidEvidence()
  }
  const sourceCampusesMin = Math.min(
    ...observations.map(({ projection }) => projection.sourceCampuses)
  )
  const projectedRunsMin = Math.min(
    ...observations.map(({ projection }) => projection.projectedRuns)
  )
  const sharedPublicCoursesMin = Math.min(
    ...observations.map(({ projection }) => projection.sharedPublicCourses)
  )
  if (sourceCampusesMin < 3 || projectedRunsMin < 3 || sharedPublicCoursesMin < 1) {
    invalidEvidence()
  }

  const canonical = artifactPayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    manifestDigest: digest(JSON.stringify(manifest)),
    sampleObservationDigests,
    metrics: {
      sourceCampusesMin,
      projectedRunsMin,
      sharedPublicCoursesMin,
      ignoredNonPublicRuns: Math.max(
        ...observations.map(({ projection }) => projection.ignoredNonPublicRuns)
      ),
    },
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  const artifact = Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
  assertUnifiedPublicWebEvidenceArtifact(artifact)
  return artifact
}

export function assertUnifiedPublicWebEvidenceArtifact(
  value: unknown
): asserts value is UnifiedPublicWebEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, ARTIFACT_KEYS)) invalidEvidence()
  const artifact = value as UnifiedPublicWebEvidenceArtifact
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_unified_public_web_review_evidence' ||
    artifact.mode !== 'three_sample_unified_public_surface_review' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canReadPayload !== false ||
    artifact.canWrite !== false ||
    artifact.canPublish !== false ||
    artifact.canActivate !== false ||
    artifact.canChangePermissions !== false ||
    artifact.canExposeEntityData !== false ||
    !validDigest(artifact.sourceDigest) ||
    !validDigest(artifact.targetTenantDigest) ||
    artifact.sourceDigest === artifact.targetTenantDigest ||
    !validDigest(artifact.campaignReviewReferenceDigest) ||
    !validDigest(artifact.readinessReviewReferenceDigest) ||
    artifact.campaignReviewReferenceDigest === artifact.readinessReviewReferenceDigest ||
    !validDigest(artifact.manifestDigest) ||
    !Array.isArray(artifact.sampleObservationDigests) ||
    artifact.sampleObservationDigests.length !== 3 ||
    artifact.sampleObservationDigests.some(
      (value) =>
        !value ||
        typeof value !== 'object' ||
        !exactKeys(value, SAMPLE_DIGEST_KEYS) ||
        !validDigest(value.sampleDigest)
    ) ||
    new Set(artifact.sampleObservationDigests.map(({ sampleDigest }) => sampleDigest)).size !== 3 ||
    !isSortedSampleDigests(artifact.sampleObservationDigests) ||
    !artifact.metrics ||
    !exactKeys(artifact.metrics, METRICS_KEYS) ||
    artifact.metrics.requiredSamples !== 3 ||
    artifact.metrics.reviewedSamples !== 3 ||
    artifact.metrics.alignedSamples !== 3 ||
    artifact.metrics.divergentSamples !== 0 ||
    artifact.metrics.blockedSamples !== 0 ||
    artifact.metrics.minimumPublicCampuses !== 3 ||
    artifact.metrics.minimumProjectedRuns !== 3 ||
    artifact.metrics.minimumSharedPublicCourses !== 1 ||
    artifact.metrics.sourceCampusesMin < 3 ||
    artifact.metrics.projectedRunsMin < 3 ||
    artifact.metrics.sharedPublicCoursesMin < 1 ||
    !nonNegativeInteger(artifact.metrics.ignoredNonPublicRuns) ||
    artifact.metrics.totalDifferences !== 0 ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }
  const canonical = artifactPayload({
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    manifestDigest: artifact.manifestDigest,
    sampleObservationDigests: artifact.sampleObservationDigests,
    metrics: {
      sourceCampusesMin: artifact.metrics.sourceCampusesMin,
      projectedRunsMin: artifact.metrics.projectedRunsMin,
      sharedPublicCoursesMin: artifact.metrics.sharedPublicCoursesMin,
      ignoredNonPublicRuns: artifact.metrics.ignoredNonPublicRuns,
    },
  })
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

export function serializeUnifiedPublicWebEvidenceArtifact(
  input: UnifiedPublicWebEvidenceInput
): string {
  return JSON.stringify(createUnifiedPublicWebEvidenceArtifact(input))
}

function artifactPayload(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly manifestDigest: string
  readonly sampleObservationDigests: readonly [
    { readonly sampleDigest: string },
    { readonly sampleDigest: string },
    { readonly sampleDigest: string },
  ]
  readonly metrics: {
    readonly sourceCampusesMin: number
    readonly projectedRunsMin: number
    readonly sharedPublicCoursesMin: number
    readonly ignoredNonPublicRuns: number
  }
}) {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_unified_public_web_review_evidence' as const,
    mode: 'three_sample_unified_public_surface_review' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canReadPayload: false as const,
    canWrite: false as const,
    canPublish: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    canExposeEntityData: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: input.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: input.readinessReviewReferenceDigest,
    manifestDigest: input.manifestDigest,
    sampleObservationDigests: input.sampleObservationDigests,
    metrics: Object.freeze({
      requiredSamples: 3 as const,
      reviewedSamples: 3 as const,
      alignedSamples: 3 as const,
      divergentSamples: 0 as const,
      blockedSamples: 0 as const,
      minimumPublicCampuses: 3 as const,
      minimumProjectedRuns: 3 as const,
      minimumSharedPublicCourses: 1 as const,
      sourceCampusesMin: input.metrics.sourceCampusesMin,
      projectedRunsMin: input.metrics.projectedRunsMin,
      sharedPublicCoursesMin: input.metrics.sharedPublicCoursesMin,
      ignoredNonPublicRuns: input.metrics.ignoredNonPublicRuns,
      totalDifferences: 0 as const,
    }),
  })
}

function validateInput(input: UnifiedPublicWebEvidenceInput): void {
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
    !Array.isArray(input.samples) ||
    input.samples.length !== 3
  ) {
    invalidEvidence()
  }
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return (
    keys.length === expected.size &&
    keys.every((key) => expected.has(key)) &&
    [...expected].every((key) => Object.prototype.hasOwnProperty.call(value, key))
  )
}

function validDigest(value: string): boolean {
  return DIGEST_PATTERN.test(value)
}

function nonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0
}

function isSortedSampleDigests(values: readonly { readonly sampleDigest: string }[]): boolean {
  return values.every(
    (value, index) =>
      index === 0 || values[index - 1]!.sampleDigest.localeCompare(value.sampleDigest) < 0
  )
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(value: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${value.slice('sha256:'.length)}`
}

function invalidEvidence(): never {
  throw new Error('UNIFIED_PUBLIC_WEB_EVIDENCE_INVALID')
}
