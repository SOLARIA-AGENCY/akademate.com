import { createHash } from 'node:crypto'

import {
  assertSharedCourseCatalogEvidenceArtifact,
  type SharedCourseCatalogEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-course-catalog-evidence'
import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'

export const SHARED_COURSE_CATALOG_REVIEWED_READINESS_GATE =
  'shared_course_catalog_reviewed' as const

export interface SharedCourseCatalogEvidenceBindingProposalInput {
  readonly artifact: SharedCourseCatalogEvidenceArtifact
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
}

export interface SharedCourseCatalogEvidenceBindingProposal {
  readonly schemaVersion: 1
  readonly mode: 'manual_shared_course_catalog_evidence_binding_proposal'
  readonly status: 'proposed'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canReadPayload: false
  readonly canWrite: false
  readonly canCreateCourse: false
  readonly canCreateCourseRun: false
  readonly canAssignCourseRun: false
  readonly canProcessEnrollments: false
  readonly canProcessCampaigns: false
  readonly canProcessFinance: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly binding: MultiEntityStagingEvidenceBinding
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set(['artifact', 'campaignReviewReference', 'readinessReviewReference'])

/** Proposes the global review gate without reading or changing catalog data. */
export function createSharedCourseCatalogEvidenceBindingProposal(
  input: SharedCourseCatalogEvidenceBindingProposalInput
): SharedCourseCatalogEvidenceBindingProposal {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference
  ) {
    throw new Error('SHARED_COURSE_CATALOG_EVIDENCE_BINDING_INPUT_INVALID')
  }
  try {
    assertSharedCourseCatalogEvidenceArtifact(input.artifact)
  } catch {
    throw new Error('SHARED_COURSE_CATALOG_EVIDENCE_ARTIFACT_INVALID')
  }
  if (
    input.artifact.campaignReviewReferenceDigest !== digest(input.campaignReviewReference) ||
    input.artifact.readinessReviewReferenceDigest !== digest(input.readinessReviewReference)
  ) {
    throw new Error('SHARED_COURSE_CATALOG_EVIDENCE_CONTEXT_MISMATCH')
  }
  return Object.freeze({
    schemaVersion: 1,
    mode: 'manual_shared_course_catalog_evidence_binding_proposal',
    status: 'proposed',
    canBindAutomatically: false,
    canMarkVerified: false,
    canReadPayload: false,
    canWrite: false,
    canCreateCourse: false,
    canCreateCourseRun: false,
    canAssignCourseRun: false,
    canProcessEnrollments: false,
    canProcessCampaigns: false,
    canProcessFinance: false,
    canActivate: false,
    canChangePermissions: false,
    binding: Object.freeze({
      scope: 'global',
      gate: SHARED_COURSE_CATALOG_REVIEWED_READINESS_GATE,
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
