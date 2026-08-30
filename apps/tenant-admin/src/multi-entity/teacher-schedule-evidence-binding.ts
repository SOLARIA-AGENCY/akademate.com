import { createHash } from 'node:crypto'

import {
  assertTeacherScheduleShadowEvidenceArtifact,
  type TeacherScheduleShadowEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-teacher-schedule-evidence'
import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'

export const TEACHER_SCHEDULE_SHADOW_VERIFIED_READINESS_GATE =
  'teacher_schedule_shadow_verified' as const

export interface TeacherScheduleEvidenceBindingProposalInput {
  readonly artifact: TeacherScheduleShadowEvidenceArtifact
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
}

export interface TeacherScheduleEvidenceBindingProposal {
  readonly schemaVersion: 1
  readonly mode: 'manual_teacher_schedule_evidence_binding_proposal'
  readonly status: 'proposed'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canLoadSnapshot: false
  readonly canWrite: false
  readonly canApply: false
  readonly canAssignTeacher: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly binding: MultiEntityStagingEvidenceBinding
}

export type TeacherScheduleEvidenceBindingErrorCode =
  | 'TEACHER_SCHEDULE_EVIDENCE_BINDING_INPUT_INVALID'
  | 'TEACHER_SCHEDULE_EVIDENCE_ARTIFACT_INVALID'
  | 'TEACHER_SCHEDULE_EVIDENCE_CONTEXT_MISMATCH'

export class TeacherScheduleEvidenceBindingError extends Error {
  constructor(readonly code: TeacherScheduleEvidenceBindingErrorCode) {
    super('Teacher schedule evidence binding is invalid.')
    this.name = 'TeacherScheduleEvidenceBindingError'
  }
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set(['artifact', 'campaignReviewReference', 'readinessReviewReference'])

/** Proposes one global gate without loading schedules or assigning teachers. */
export function createTeacherScheduleEvidenceBindingProposal(
  input: TeacherScheduleEvidenceBindingProposalInput
): TeacherScheduleEvidenceBindingProposal {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference
  ) {
    throw bindingError('TEACHER_SCHEDULE_EVIDENCE_BINDING_INPUT_INVALID')
  }
  try {
    assertTeacherScheduleShadowEvidenceArtifact(input.artifact)
  } catch {
    throw bindingError('TEACHER_SCHEDULE_EVIDENCE_ARTIFACT_INVALID')
  }
  if (
    input.artifact.campaignReviewReferenceDigest !== digest(input.campaignReviewReference) ||
    input.artifact.readinessReviewReferenceDigest !== digest(input.readinessReviewReference)
  ) {
    throw bindingError('TEACHER_SCHEDULE_EVIDENCE_CONTEXT_MISMATCH')
  }
  const binding = Object.freeze({
    scope: 'global' as const,
    gate: TEACHER_SCHEDULE_SHADOW_VERIFIED_READINESS_GATE,
    reviewReference: input.readinessReviewReference,
    evidenceReference: input.artifact.evidenceReference,
    campaignReviewReference: input.campaignReviewReference,
    sourceDigest: input.artifact.sourceDigest,
    targetTenantDigest: input.artifact.targetTenantDigest,
    artifactKind: input.artifact.kind,
    artifactDigest: input.artifact.artifactDigest,
  })
  return Object.freeze({
    schemaVersion: 1,
    mode: 'manual_teacher_schedule_evidence_binding_proposal',
    status: 'proposed',
    canBindAutomatically: false,
    canMarkVerified: false,
    canLoadSnapshot: false,
    canWrite: false,
    canApply: false,
    canAssignTeacher: false,
    canActivate: false,
    canChangePermissions: false,
    binding,
  })
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

function bindingError(code: TeacherScheduleEvidenceBindingErrorCode) {
  return new TeacherScheduleEvidenceBindingError(code)
}
