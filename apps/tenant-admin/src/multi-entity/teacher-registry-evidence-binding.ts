import { createHash } from 'node:crypto'

import {
  assertSharedTeacherRegistryEvidenceArtifact,
  type SharedTeacherRegistryEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-teacher-registry-evidence'
import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'

export const SHARED_TEACHER_REGISTRY_REVIEWED_READINESS_GATE =
  'shared_teacher_registry_reviewed' as const

export interface SharedTeacherRegistryEvidenceBindingProposalInput {
  readonly artifact: SharedTeacherRegistryEvidenceArtifact
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
}

export interface SharedTeacherRegistryEvidenceBindingProposal {
  readonly schemaVersion: 1
  readonly mode: 'manual_shared_teacher_registry_evidence_binding_proposal'
  readonly status: 'proposed'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canReadPayload: false
  readonly canWrite: false
  readonly canCreateTeacher: false
  readonly canAssignTeacher: false
  readonly canStoreEconomicTerms: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly binding: MultiEntityStagingEvidenceBinding
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set(['artifact', 'campaignReviewReference', 'readinessReviewReference'])

/** Proposes the global review gate without reading or changing teacher data. */
export function createSharedTeacherRegistryEvidenceBindingProposal(
  input: SharedTeacherRegistryEvidenceBindingProposalInput
): SharedTeacherRegistryEvidenceBindingProposal {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference
  ) {
    throw new Error('SHARED_TEACHER_REGISTRY_EVIDENCE_BINDING_INPUT_INVALID')
  }
  try {
    assertSharedTeacherRegistryEvidenceArtifact(input.artifact)
  } catch {
    throw new Error('SHARED_TEACHER_REGISTRY_EVIDENCE_ARTIFACT_INVALID')
  }
  if (
    input.artifact.campaignReviewReferenceDigest !== digest(input.campaignReviewReference) ||
    input.artifact.readinessReviewReferenceDigest !== digest(input.readinessReviewReference)
  ) {
    throw new Error('SHARED_TEACHER_REGISTRY_EVIDENCE_CONTEXT_MISMATCH')
  }
  return Object.freeze({
    schemaVersion: 1,
    mode: 'manual_shared_teacher_registry_evidence_binding_proposal',
    status: 'proposed',
    canBindAutomatically: false,
    canMarkVerified: false,
    canReadPayload: false,
    canWrite: false,
    canCreateTeacher: false,
    canAssignTeacher: false,
    canStoreEconomicTerms: false,
    canActivate: false,
    canChangePermissions: false,
    binding: Object.freeze({
      scope: 'global',
      gate: SHARED_TEACHER_REGISTRY_REVIEWED_READINESS_GATE,
      reviewReference: input.readinessReviewReference,
      evidenceReference: input.artifact.evidenceReference,
      campaignReviewReference: input.campaignReviewReference,
      sourceDigest: input.artifact.sourceDigest,
      targetTenantDigest: input.artifact.targetTenantDigest,
      artifactKind: input.artifact.kind,
      artifactDigest: input.artifact.artifactDigest,
    }),
  })
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return keys.length === expected.size && keys.every((key) => expected.has(key))
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}
