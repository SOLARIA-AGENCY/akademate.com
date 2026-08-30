import { createRedactedTeacherScheduleObservation } from './multi-entity-teacher-schedule-observability'
import {
  planPayloadTeacherScheduleShadow,
  type PayloadTeacherScheduleSnapshot,
} from './multi-entity-teacher-schedule-projection'
import type { RedactedTeacherScheduleObservation } from './multi-entity-teacher-schedule-observability'

export const MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_FLAG =
  'AKADEMATE_CEP_TEACHER_SCHEDULE_SHADOW_ENABLED'
export const MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_ENVIRONMENT =
  'AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT'

export type TeacherScheduleShadowRunnerGateReason =
  | 'flag_disabled'
  | 'environment_missing_or_invalid'
  | 'production_forbidden'
  | 'staging_enabled'

export type TeacherScheduleShadowRunnerGate =
  | {
      readonly enabled: false
      readonly reason: Exclude<TeacherScheduleShadowRunnerGateReason, 'staging_enabled'>
    }
  | {
      readonly enabled: true
      readonly reason: 'staging_enabled'
    }

export interface TeacherScheduleShadowRunnerOptions {
  readonly environment?: Readonly<Record<string, string | undefined>>
  readonly loadSnapshot: () => Promise<PayloadTeacherScheduleSnapshot>
}

export interface TeacherScheduleShadowRunnerSkipped {
  readonly status: 'skipped'
  readonly reason: Exclude<TeacherScheduleShadowRunnerGateReason, 'staging_enabled'>
  readonly canWrite: false
  readonly canApply: false
}

export interface TeacherScheduleShadowRunnerFailed {
  readonly status: 'failed'
  readonly reason: 'snapshot_load_failed' | 'shadow_planning_failed'
  readonly canWrite: false
  readonly canApply: false
}

export interface TeacherScheduleShadowRunnerObserved {
  readonly status: 'observed'
  readonly reason: 'shadow_observed'
  readonly canWrite: false
  readonly canApply: false
  readonly observation: RedactedTeacherScheduleObservation
  readonly serializedObservation: string
}

export type TeacherScheduleShadowRunnerResult =
  | TeacherScheduleShadowRunnerSkipped
  | TeacherScheduleShadowRunnerFailed
  | TeacherScheduleShadowRunnerObserved

export function resolveTeacherScheduleShadowRunnerGate(
  environment: Readonly<Record<string, string | undefined>> = process.env
): TeacherScheduleShadowRunnerGate {
  if (environment[MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_FLAG] !== 'true') {
    return { enabled: false, reason: 'flag_disabled' }
  }

  const explicitEnvironment =
    environment[MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_ENVIRONMENT]?.trim().toLowerCase()

  if (explicitEnvironment === 'production') {
    return { enabled: false, reason: 'production_forbidden' }
  }
  if (explicitEnvironment !== 'staging') {
    return { enabled: false, reason: 'environment_missing_or_invalid' }
  }
  return { enabled: true, reason: 'staging_enabled' }
}

/**
 * Runs one injected staging snapshot without persistence or an apply callback.
 * Only aggregate allow-listed telemetry leaves the planning boundary.
 */
export async function runTeacherScheduleShadowEvidence(
  options: TeacherScheduleShadowRunnerOptions
): Promise<TeacherScheduleShadowRunnerResult> {
  const gate = resolveTeacherScheduleShadowRunnerGate(options.environment)
  if (gate.enabled === false) {
    return Object.freeze({
      status: 'skipped',
      reason: gate.reason,
      canWrite: false,
      canApply: false,
    })
  }

  let snapshot: PayloadTeacherScheduleSnapshot
  try {
    snapshot = await options.loadSnapshot()
  } catch {
    return Object.freeze({
      status: 'failed',
      reason: 'snapshot_load_failed',
      canWrite: false,
      canApply: false,
    })
  }

  try {
    const plan = planPayloadTeacherScheduleShadow(snapshot)
    const observation = createRedactedTeacherScheduleObservation(plan)
    return Object.freeze({
      status: 'observed',
      reason: 'shadow_observed',
      canWrite: false,
      canApply: false,
      observation,
      serializedObservation: JSON.stringify(observation),
    })
  } catch {
    return Object.freeze({
      status: 'failed',
      reason: 'shadow_planning_failed',
      canWrite: false,
      canApply: false,
    })
  }
}
