import { createHash } from 'node:crypto'

import {
  assertMultiEntityRollbackRehearsalEvidenceArtifact,
  type MultiEntityRollbackRehearsalEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-rollback-rehearsal-evidence'
import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'

export const ROLLBACK_REHEARSED_READINESS_GATE = 'rollback_rehearsed' as const

export interface RollbackRehearsalEvidenceBindingProposalInput {
  readonly artifact: MultiEntityRollbackRehearsalEvidenceArtifact
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
}

export interface RollbackRehearsalEvidenceBindingProposal {
  readonly schemaVersion: 1
  readonly mode: 'manual_rollback_rehearsal_evidence_binding_proposal'
  readonly status: 'proposed'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canWrite: false
  readonly canApply: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly binding: MultiEntityStagingEvidenceBinding
}

export type RollbackRehearsalEvidenceBindingErrorCode =
  | 'ROLLBACK_REHEARSAL_EVIDENCE_BINDING_INPUT_INVALID'
  | 'ROLLBACK_REHEARSAL_EVIDENCE_ARTIFACT_INVALID'
  | 'ROLLBACK_REHEARSAL_EVIDENCE_CONTEXT_MISMATCH'

export class RollbackRehearsalEvidenceBindingError extends Error {
  constructor(readonly code: RollbackRehearsalEvidenceBindingErrorCode) {
    super('Rollback rehearsal evidence binding is invalid.')
    this.name = 'RollbackRehearsalEvidenceBindingError'
  }
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set(['artifact', 'campaignReviewReference', 'readinessReviewReference'])

/** Proposes one global readiness binding without executing or applying rollback. */
export function createRollbackRehearsalEvidenceBindingProposal(
  input: RollbackRehearsalEvidenceBindingProposalInput
): RollbackRehearsalEvidenceBindingProposal {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference
  ) {
    throw bindingError('ROLLBACK_REHEARSAL_EVIDENCE_BINDING_INPUT_INVALID')
  }
  try {
    assertMultiEntityRollbackRehearsalEvidenceArtifact(input.artifact)
  } catch {
    throw bindingError('ROLLBACK_REHEARSAL_EVIDENCE_ARTIFACT_INVALID')
  }
  if (
    input.artifact.campaignReviewReferenceDigest !== digest(input.campaignReviewReference) ||
    input.artifact.readinessReviewReferenceDigest !== digest(input.readinessReviewReference)
  ) {
    throw bindingError('ROLLBACK_REHEARSAL_EVIDENCE_CONTEXT_MISMATCH')
  }

  const binding = Object.freeze({
    scope: 'global' as const,
    gate: ROLLBACK_REHEARSED_READINESS_GATE,
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
    mode: 'manual_rollback_rehearsal_evidence_binding_proposal',
    status: 'proposed',
    canBindAutomatically: false,
    canMarkVerified: false,
    canWrite: false,
    canApply: false,
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

function bindingError(code: RollbackRehearsalEvidenceBindingErrorCode) {
  return new RollbackRehearsalEvidenceBindingError(code)
}
