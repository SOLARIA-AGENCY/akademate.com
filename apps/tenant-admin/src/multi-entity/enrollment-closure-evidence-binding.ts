import { createHash } from 'node:crypto'

import {
  assertCourseRunEnrollmentClosureEvidenceArtifact,
  type CourseRunEnrollmentClosureEvidenceArtifact,
} from '../../../../packages/tenant/src/course-run-enrollment-closure-evidence'
import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'

export const ENROLLMENT_CLOSURE_SHADOW_VERIFIED_READINESS_GATE =
  'enrollment_closure_shadow_verified' as const

export interface EnrollmentClosureEvidenceBindingProposalInput {
  readonly artifact: CourseRunEnrollmentClosureEvidenceArtifact
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
}

export interface EnrollmentClosureEvidenceBindingProposal {
  readonly schemaVersion: 1
  readonly mode: 'manual_enrollment_closure_evidence_binding_proposal'
  readonly status: 'proposed'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canLoadSnapshot: false
  readonly canWrite: false
  readonly canPauseAds: false
  readonly canExecutePause: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly binding: MultiEntityStagingEvidenceBinding
}

export type EnrollmentClosureEvidenceBindingErrorCode =
  | 'ENROLLMENT_CLOSURE_EVIDENCE_BINDING_INPUT_INVALID'
  | 'ENROLLMENT_CLOSURE_EVIDENCE_ARTIFACT_INVALID'
  | 'ENROLLMENT_CLOSURE_EVIDENCE_CONTEXT_MISMATCH'

export class EnrollmentClosureEvidenceBindingError extends Error {
  constructor(readonly code: EnrollmentClosureEvidenceBindingErrorCode) {
    super('Enrollment closure evidence binding is invalid.')
    this.name = 'EnrollmentClosureEvidenceBindingError'
  }
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set(['artifact', 'campaignReviewReference', 'readinessReviewReference'])

/** Proposes one global gate without loading snapshots or applying decisions. */
export function createEnrollmentClosureEvidenceBindingProposal(
  input: EnrollmentClosureEvidenceBindingProposalInput
): EnrollmentClosureEvidenceBindingProposal {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference
  ) {
    throw bindingError('ENROLLMENT_CLOSURE_EVIDENCE_BINDING_INPUT_INVALID')
  }
  try {
    assertCourseRunEnrollmentClosureEvidenceArtifact(input.artifact)
  } catch {
    throw bindingError('ENROLLMENT_CLOSURE_EVIDENCE_ARTIFACT_INVALID')
  }
  if (
    input.artifact.campaignReviewReferenceDigest !== digest(input.campaignReviewReference) ||
    input.artifact.readinessReviewReferenceDigest !== digest(input.readinessReviewReference)
  ) {
    throw bindingError('ENROLLMENT_CLOSURE_EVIDENCE_CONTEXT_MISMATCH')
  }

  const binding = Object.freeze({
    scope: 'global' as const,
    gate: ENROLLMENT_CLOSURE_SHADOW_VERIFIED_READINESS_GATE,
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
    mode: 'manual_enrollment_closure_evidence_binding_proposal',
    status: 'proposed',
    canBindAutomatically: false,
    canMarkVerified: false,
    canLoadSnapshot: false,
    canWrite: false,
    canPauseAds: false,
    canExecutePause: false,
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

function bindingError(code: EnrollmentClosureEvidenceBindingErrorCode) {
  return new EnrollmentClosureEvidenceBindingError(code)
}
