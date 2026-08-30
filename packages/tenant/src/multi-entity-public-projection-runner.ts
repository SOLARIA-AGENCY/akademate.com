import {
  createRedactedMultiEntityPublicProjectionObservation,
  planMultiEntityPublicProjection,
  type MultiEntityPublicProjectionInput,
  type MultiEntityPublicProjectionPlan,
} from './multi-entity-public-projection'

export const MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_FLAG =
  'AKADEMATE_CEP_PUBLIC_PROJECTION_SHADOW_ENABLED'
export const MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_ENVIRONMENT =
  'AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT'

export interface CurrentPublicProjectionBaseline {
  readonly courseSlugs: readonly string[]
  readonly cycleSlugs: readonly string[]
  readonly campusSlugs: readonly string[]
  readonly runSlugs: readonly string[]
}

export interface PublicProjectionSurfaceComparison {
  readonly baseline: number
  readonly projected: number
  readonly matched: number
  readonly missingFromProjection: number
  readonly newInProjection: number
}

export interface RedactedPublicProjectionShadowComparison {
  readonly schemaVersion: 1
  readonly kind: 'cep_unified_public_projection_comparison'
  readonly verdict: 'aligned' | 'divergent' | 'blocked'
  readonly canPublish: false
  readonly canActivate: false
  readonly projection: MultiEntityPublicProjectionPlan['summary']
  readonly comparison: {
    readonly courses: PublicProjectionSurfaceComparison
    readonly cycles: PublicProjectionSurfaceComparison
    readonly campuses: PublicProjectionSurfaceComparison
    readonly runs: PublicProjectionSurfaceComparison
    readonly totalDifferences: number
  }
}

export type PublicProjectionShadowRunnerGateReason =
  | 'flag_disabled'
  | 'environment_missing_or_invalid'
  | 'production_forbidden'
  | 'staging_enabled'

export type PublicProjectionShadowRunnerGate =
  | {
      readonly enabled: false
      readonly reason: Exclude<PublicProjectionShadowRunnerGateReason, 'staging_enabled'>
    }
  | { readonly enabled: true; readonly reason: 'staging_enabled' }

export interface PublicProjectionShadowRunnerOptions {
  readonly environment?: Readonly<Record<string, string | undefined>>
  readonly loadProjectionInput: () => Promise<MultiEntityPublicProjectionInput>
  readonly loadCurrentBaseline: () => Promise<CurrentPublicProjectionBaseline>
}

export type PublicProjectionShadowRunnerResult =
  | {
      readonly status: 'skipped'
      readonly reason: Exclude<PublicProjectionShadowRunnerGateReason, 'staging_enabled'>
      readonly canPublish: false
      readonly canActivate: false
    }
  | {
      readonly status: 'failed'
      readonly reason:
        | 'projection_snapshot_load_failed'
        | 'baseline_load_failed'
        | 'shadow_comparison_failed'
      readonly canPublish: false
      readonly canActivate: false
    }
  | {
      readonly status: 'observed'
      readonly reason: 'shadow_compared'
      readonly canPublish: false
      readonly canActivate: false
      readonly observation: RedactedPublicProjectionShadowComparison
      readonly serializedObservation: string
    }

const BASELINE_KEYS = new Set(['courseSlugs', 'cycleSlugs', 'campusSlugs', 'runSlugs'])
const MAX_BASELINE_ITEMS = 100_000
const COURSE_OR_CAMPUS_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const RUN_SLUG_PATTERN = /^[A-Za-z0-9]+(?:[-_.][A-Za-z0-9]+)*$/

export function resolvePublicProjectionShadowRunnerGate(
  environment: Readonly<Record<string, string | undefined>> = process.env
): PublicProjectionShadowRunnerGate {
  if (environment[MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_FLAG] !== 'true') {
    return { enabled: false, reason: 'flag_disabled' }
  }
  const explicitEnvironment =
    environment[MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_ENVIRONMENT]?.trim().toLowerCase()
  if (explicitEnvironment === 'production') {
    return { enabled: false, reason: 'production_forbidden' }
  }
  if (explicitEnvironment !== 'staging') {
    return { enabled: false, reason: 'environment_missing_or_invalid' }
  }
  return { enabled: true, reason: 'staging_enabled' }
}

export function compareMultiEntityPublicProjection(
  plan: MultiEntityPublicProjectionPlan,
  baseline: CurrentPublicProjectionBaseline
): RedactedPublicProjectionShadowComparison {
  createRedactedMultiEntityPublicProjectionObservation(plan)
  validateBaseline(baseline)
  const projectedCourseSlugs = plan.courses.map(({ slug }) => slug)
  const projectedCycleSlugs = plan.cycles.map(({ slug }) => slug)
  const projectedCampusSlugs = plan.campuses.map(({ slug }) => slug)
  const projectedRunSlugs = [...plan.courses, ...plan.cycles].flatMap(({ runs }) =>
    runs.map(({ slug }) => slug)
  )
  const courses = compareSurface(baseline.courseSlugs, projectedCourseSlugs)
  const cycles = compareSurface(baseline.cycleSlugs, projectedCycleSlugs)
  const campuses = compareSurface(baseline.campusSlugs, projectedCampusSlugs)
  const runs = compareSurface(baseline.runSlugs, projectedRunSlugs)
  const totalDifferences =
    courses.missingFromProjection +
    courses.newInProjection +
    cycles.missingFromProjection +
    cycles.newInProjection +
    campuses.missingFromProjection +
    campuses.newInProjection +
    runs.missingFromProjection +
    runs.newInProjection

  return Object.freeze({
    schemaVersion: 1,
    kind: 'cep_unified_public_projection_comparison',
    verdict: !plan.ready ? 'blocked' : totalDifferences === 0 ? 'aligned' : 'divergent',
    canPublish: false,
    canActivate: false,
    projection: Object.freeze({ ...plan.summary }),
    comparison: Object.freeze({ courses, cycles, campuses, runs, totalDifferences }),
  })
}

export async function runPublicProjectionShadowComparison(
  options: PublicProjectionShadowRunnerOptions
): Promise<PublicProjectionShadowRunnerResult> {
  const gate = resolvePublicProjectionShadowRunnerGate(options.environment)
  if (gate.enabled === false) {
    return Object.freeze({
      status: 'skipped',
      reason: gate.reason,
      canPublish: false,
      canActivate: false,
    })
  }

  let input: MultiEntityPublicProjectionInput
  try {
    input = await options.loadProjectionInput()
  } catch {
    return failed('projection_snapshot_load_failed')
  }

  let baseline: CurrentPublicProjectionBaseline
  try {
    baseline = await options.loadCurrentBaseline()
  } catch {
    return failed('baseline_load_failed')
  }

  try {
    const observation = compareMultiEntityPublicProjection(
      planMultiEntityPublicProjection(input),
      baseline
    )
    return Object.freeze({
      status: 'observed',
      reason: 'shadow_compared',
      canPublish: false,
      canActivate: false,
      observation,
      serializedObservation: JSON.stringify(observation),
    })
  } catch {
    return failed('shadow_comparison_failed')
  }
}

function compareSurface(
  baselineValues: readonly string[],
  projectedValues: readonly string[]
): PublicProjectionSurfaceComparison {
  const baseline = new Set(baselineValues)
  const projected = new Set(projectedValues)
  let matched = 0
  for (const value of baseline) if (projected.has(value)) matched += 1
  return Object.freeze({
    baseline: baseline.size,
    projected: projected.size,
    matched,
    missingFromProjection: baseline.size - matched,
    newInProjection: projected.size - matched,
  })
}

function validateBaseline(baseline: CurrentPublicProjectionBaseline): void {
  if (
    !baseline ||
    typeof baseline !== 'object' ||
    !exactKeys(baseline, BASELINE_KEYS) ||
    !validSlugList(baseline.courseSlugs, COURSE_OR_CAMPUS_SLUG_PATTERN, 500) ||
    !validSlugList(baseline.cycleSlugs, COURSE_OR_CAMPUS_SLUG_PATTERN, 500) ||
    !validSlugList(baseline.campusSlugs, COURSE_OR_CAMPUS_SLUG_PATTERN, 500) ||
    !validSlugList(baseline.runSlugs, RUN_SLUG_PATTERN, 255) ||
    baseline.courseSlugs.length +
      baseline.cycleSlugs.length +
      baseline.campusSlugs.length +
      baseline.runSlugs.length >
      MAX_BASELINE_ITEMS
  ) {
    throw new Error('MULTI_ENTITY_PUBLIC_BASELINE_INVALID')
  }
}

function validSlugList(
  value: unknown,
  pattern: RegExp,
  maxLength: number
): value is readonly string[] {
  if (!Array.isArray(value)) return false
  const seen = new Set<string>()
  for (const item of value) {
    if (
      typeof item !== 'string' ||
      item.length > maxLength ||
      !pattern.test(item) ||
      seen.has(item)
    ) {
      return false
    }
    seen.add(item)
  }
  return true
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return (
    keys.length === expected.size &&
    keys.every((key) => expected.has(key)) &&
    [...expected].every((key) => Object.prototype.hasOwnProperty.call(value, key))
  )
}

function failed(
  reason: Extract<PublicProjectionShadowRunnerResult, { status: 'failed' }>['reason']
): PublicProjectionShadowRunnerResult {
  return Object.freeze({ status: 'failed', reason, canPublish: false, canActivate: false })
}
