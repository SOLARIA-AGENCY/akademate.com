import {
  createRedactedCourseRunEnrollmentClosureObservation,
  planCourseRunEnrollmentClosure,
  type CourseRunEnrollmentClosureInput,
  type RedactedCourseRunEnrollmentClosureObservation,
} from './course-run-enrollment-closure'

export const COURSE_RUN_ENROLLMENT_CLOSURE_SHADOW_FLAG =
  'AKADEMATE_CEP_ENROLLMENT_CLOSURE_SHADOW_ENABLED' as const
export const COURSE_RUN_ENROLLMENT_CLOSURE_ENVIRONMENT =
  'AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT' as const

export type CourseRunEnrollmentClosureRunnerGateReason =
  | 'flag_disabled'
  | 'environment_missing_or_invalid'
  | 'production_forbidden'
  | 'staging_enabled'

export type CourseRunEnrollmentClosureRunnerGate =
  | {
      readonly enabled: false
      readonly reason: Exclude<CourseRunEnrollmentClosureRunnerGateReason, 'staging_enabled'>
    }
  | { readonly enabled: true; readonly reason: 'staging_enabled' }

export type CourseRunEnrollmentClosureRunnerResult =
  | {
      readonly status: 'skipped'
      readonly reason: Exclude<CourseRunEnrollmentClosureRunnerGateReason, 'staging_enabled'>
      readonly canWrite: false
      readonly canPauseAds: false
    }
  | {
      readonly status: 'failed'
      readonly reason: 'snapshot_load_failed' | 'shadow_plan_failed'
      readonly canWrite: false
      readonly canPauseAds: false
    }
  | {
      readonly status: 'observed'
      readonly reason: 'shadow_observed'
      readonly canWrite: false
      readonly canPauseAds: false
      readonly observation: RedactedCourseRunEnrollmentClosureObservation
      readonly serializedObservation: string
    }

export interface CourseRunEnrollmentClosureRunnerOptions {
  readonly loadSnapshot: () => Promise<CourseRunEnrollmentClosureInput>
  readonly environment?: Readonly<Record<string, string | undefined>>
}

export function resolveCourseRunEnrollmentClosureRunnerGate(
  environment: Readonly<Record<string, string | undefined>> = process.env
): CourseRunEnrollmentClosureRunnerGate {
  if (environment[COURSE_RUN_ENROLLMENT_CLOSURE_SHADOW_FLAG] !== 'true') {
    return { enabled: false, reason: 'flag_disabled' }
  }
  const target = environment[COURSE_RUN_ENROLLMENT_CLOSURE_ENVIRONMENT]?.trim().toLowerCase()
  if (target === 'production') return { enabled: false, reason: 'production_forbidden' }
  if (target !== 'staging') {
    return { enabled: false, reason: 'environment_missing_or_invalid' }
  }
  return { enabled: true, reason: 'staging_enabled' }
}

/** Executes one read-only observation. No returned type exposes an apply path. */
export async function runCourseRunEnrollmentClosureShadow(
  options: CourseRunEnrollmentClosureRunnerOptions
): Promise<CourseRunEnrollmentClosureRunnerResult> {
  if (!options || typeof options.loadSnapshot !== 'function') {
    return failed('snapshot_load_failed')
  }
  const gate = resolveCourseRunEnrollmentClosureRunnerGate(options.environment)
  if (gate.enabled === false) {
    return Object.freeze({
      status: 'skipped',
      reason: gate.reason,
      canWrite: false,
      canPauseAds: false,
    })
  }
  let snapshot: CourseRunEnrollmentClosureInput
  try {
    snapshot = await options.loadSnapshot()
  } catch {
    return failed('snapshot_load_failed')
  }

  try {
    const observation = createRedactedCourseRunEnrollmentClosureObservation(
      planCourseRunEnrollmentClosure(snapshot)
    )
    return Object.freeze({
      status: 'observed',
      reason: 'shadow_observed',
      canWrite: false,
      canPauseAds: false,
      observation,
      serializedObservation: JSON.stringify(observation),
    })
  } catch {
    return failed('shadow_plan_failed')
  }
}

function failed(
  reason: 'snapshot_load_failed' | 'shadow_plan_failed'
): CourseRunEnrollmentClosureRunnerResult {
  return Object.freeze({
    status: 'failed',
    reason,
    canWrite: false,
    canPauseAds: false,
  })
}
