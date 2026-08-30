import type {
  PublicProjectionSurfaceComparison,
  RedactedPublicProjectionShadowComparison,
} from './multi-entity-public-projection-runner'

export const PUBLIC_PROJECTION_MINIMUM_ALIGNED_STAGING_RUNS = 3

export interface PublicProjectionStagingEvidenceSample {
  readonly evidenceReference: string
  readonly observation: RedactedPublicProjectionShadowComparison
}

export type PublicProjectionStagingEvidenceVerdict =
  | 'insufficient_evidence'
  | 'blocked'
  | 'divergent'
  | 'ready_for_staging_review'

export interface PublicProjectionStagingEvidenceManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_unified_public_projection_staging_evidence'
  readonly mode: 'shadow_evidence_only'
  readonly verdict: PublicProjectionStagingEvidenceVerdict
  readonly canPublish: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly metrics: {
    readonly runs: number
    readonly requiredAlignedRuns: 3
    readonly alignedRuns: number
    readonly divergentRuns: number
    readonly blockedRuns: number
    readonly totalDifferences: number
    readonly maxDifferences: number
    readonly projectedRunsMin: number
    readonly projectedRunsMax: number
  }
}

const MAX_EVIDENCE_SAMPLES = 100
const EVIDENCE_REFERENCE_PATTERN = /^evidence:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const SAMPLE_KEYS = new Set(['evidenceReference', 'observation'])
const OBSERVATION_KEYS = new Set([
  'schemaVersion',
  'kind',
  'verdict',
  'canPublish',
  'canActivate',
  'projection',
  'comparison',
])
const PROJECTION_KEYS = new Set([
  'sourceCourses',
  'sharedPublicCourses',
  'sourceCycles',
  'sharedPublicCycles',
  'sourceCampuses',
  'publicCampuses',
  'sourceRuns',
  'projectedRuns',
  'ignoredNonPublicRuns',
  'blockedIssues',
])
const COMPARISON_KEYS = new Set(['courses', 'cycles', 'campuses', 'runs', 'totalDifferences'])
const SURFACE_KEYS = new Set([
  'baseline',
  'projected',
  'matched',
  'missingFromProjection',
  'newInProjection',
])

/**
 * Aggregates identifier-free staging observations. Three independently
 * referenced aligned samples are required before the result can be reviewed;
 * even then this manifest cannot publish, activate or change permissions.
 */
export function createPublicProjectionStagingEvidenceManifest(
  samples: readonly PublicProjectionStagingEvidenceSample[]
): PublicProjectionStagingEvidenceManifest {
  validateSamples(samples)

  let alignedRuns = 0
  let divergentRuns = 0
  let blockedRuns = 0
  let totalDifferences = 0
  let maxDifferences = 0
  let projectedRunsMin = 0
  let projectedRunsMax = 0

  for (const [index, sample] of samples.entries()) {
    const { observation } = sample
    if (observation.verdict === 'aligned') alignedRuns += 1
    if (observation.verdict === 'divergent') divergentRuns += 1
    if (observation.verdict === 'blocked') blockedRuns += 1
    totalDifferences += observation.comparison.totalDifferences
    maxDifferences = Math.max(maxDifferences, observation.comparison.totalDifferences)
    const projectedRuns = observation.projection.projectedRuns
    projectedRunsMin = index === 0 ? projectedRuns : Math.min(projectedRunsMin, projectedRuns)
    projectedRunsMax = Math.max(projectedRunsMax, projectedRuns)
  }

  const verdict: PublicProjectionStagingEvidenceVerdict =
    blockedRuns > 0
      ? 'blocked'
      : divergentRuns > 0
        ? 'divergent'
        : alignedRuns < PUBLIC_PROJECTION_MINIMUM_ALIGNED_STAGING_RUNS
          ? 'insufficient_evidence'
          : 'ready_for_staging_review'

  return Object.freeze({
    schemaVersion: 1,
    kind: 'cep_unified_public_projection_staging_evidence',
    mode: 'shadow_evidence_only',
    verdict,
    canPublish: false,
    canActivate: false,
    canChangePermissions: false,
    metrics: Object.freeze({
      runs: samples.length,
      requiredAlignedRuns: PUBLIC_PROJECTION_MINIMUM_ALIGNED_STAGING_RUNS,
      alignedRuns,
      divergentRuns,
      blockedRuns,
      totalDifferences,
      maxDifferences,
      projectedRunsMin,
      projectedRunsMax,
    }),
  })
}

export function serializePublicProjectionStagingEvidenceManifest(
  samples: readonly PublicProjectionStagingEvidenceSample[]
): string {
  return JSON.stringify(createPublicProjectionStagingEvidenceManifest(samples))
}

function validateSamples(samples: readonly PublicProjectionStagingEvidenceSample[]): void {
  if (!Array.isArray(samples) || samples.length > MAX_EVIDENCE_SAMPLES) invalidEvidence()
  const references = new Set<string>()
  for (const sample of samples) {
    if (
      !sample ||
      typeof sample !== 'object' ||
      !exactKeys(sample, SAMPLE_KEYS) ||
      !EVIDENCE_REFERENCE_PATTERN.test(sample.evidenceReference) ||
      references.has(sample.evidenceReference)
    ) {
      invalidEvidence()
    }
    references.add(sample.evidenceReference)
    validateObservation(sample.observation)
  }
}

function validateObservation(observation: RedactedPublicProjectionShadowComparison): void {
  if (
    !observation ||
    typeof observation !== 'object' ||
    !exactKeys(observation, OBSERVATION_KEYS) ||
    observation.schemaVersion !== 1 ||
    observation.kind !== 'cep_unified_public_projection_comparison' ||
    !['aligned', 'divergent', 'blocked'].includes(observation.verdict) ||
    observation.canPublish !== false ||
    observation.canActivate !== false ||
    !observation.projection ||
    !exactKeys(observation.projection, PROJECTION_KEYS) ||
    !Object.values(observation.projection).every(nonNegativeInteger) ||
    observation.projection.sharedPublicCourses > observation.projection.sourceCourses ||
    observation.projection.sharedPublicCycles > observation.projection.sourceCycles ||
    observation.projection.publicCampuses > observation.projection.sourceCampuses ||
    observation.projection.projectedRuns > observation.projection.sourceRuns ||
    !observation.comparison ||
    !exactKeys(observation.comparison, COMPARISON_KEYS)
  ) {
    invalidEvidence()
  }

  const surfaces = [
    observation.comparison.courses,
    observation.comparison.cycles,
    observation.comparison.campuses,
    observation.comparison.runs,
  ]
  surfaces.forEach(validateSurface)
  const calculatedDifferences = surfaces.reduce(
    (total, surface) => total + surface.missingFromProjection + surface.newInProjection,
    0
  )
  if (
    observation.comparison.totalDifferences !== calculatedDifferences ||
    (observation.verdict === 'aligned' && calculatedDifferences !== 0) ||
    (observation.verdict === 'divergent' && calculatedDifferences === 0)
  ) {
    invalidEvidence()
  }
}

function validateSurface(surface: PublicProjectionSurfaceComparison): void {
  if (
    !surface ||
    typeof surface !== 'object' ||
    !exactKeys(surface, SURFACE_KEYS) ||
    !Object.values(surface).every(nonNegativeInteger) ||
    surface.matched > surface.baseline ||
    surface.matched > surface.projected ||
    surface.missingFromProjection !== surface.baseline - surface.matched ||
    surface.newInProjection !== surface.projected - surface.matched
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

function nonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0
}

function invalidEvidence(): never {
  throw new Error('MULTI_ENTITY_PUBLIC_PROJECTION_EVIDENCE_INVALID')
}
