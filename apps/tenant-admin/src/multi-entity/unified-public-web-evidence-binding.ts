import { createHash } from 'node:crypto'

import {
  assertUnifiedPublicWebEvidenceArtifact,
  type UnifiedPublicWebEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-unified-public-web-evidence'
import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'

export const UNIFIED_PUBLIC_WEB_REVIEWED_READINESS_GATE = 'unified_public_web_reviewed' as const

export interface UnifiedPublicWebEvidenceBindingProposalInput {
  readonly artifact: UnifiedPublicWebEvidenceArtifact
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
}

export interface UnifiedPublicWebEvidenceBindingProposal {
  readonly schemaVersion: 1
  readonly mode: 'manual_unified_public_web_evidence_binding_proposal'
  readonly status: 'proposed'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canReadPayload: false
  readonly canWrite: false
  readonly canPublish: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly binding: MultiEntityStagingEvidenceBinding
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set(['artifact', 'campaignReviewReference', 'readinessReviewReference'])

/** Proposes the public-web gate without publishing or changing access. */
export function createUnifiedPublicWebEvidenceBindingProposal(
  input: UnifiedPublicWebEvidenceBindingProposalInput
): UnifiedPublicWebEvidenceBindingProposal {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference
  ) {
    throw new Error('UNIFIED_PUBLIC_WEB_EVIDENCE_BINDING_INPUT_INVALID')
  }
  try {
    assertUnifiedPublicWebEvidenceArtifact(input.artifact)
  } catch {
    throw new Error('UNIFIED_PUBLIC_WEB_EVIDENCE_ARTIFACT_INVALID')
  }
  if (
    input.artifact.campaignReviewReferenceDigest !== digest(input.campaignReviewReference) ||
    input.artifact.readinessReviewReferenceDigest !== digest(input.readinessReviewReference)
  ) {
    throw new Error('UNIFIED_PUBLIC_WEB_EVIDENCE_CONTEXT_MISMATCH')
  }
  return Object.freeze({
    schemaVersion: 1,
    mode: 'manual_unified_public_web_evidence_binding_proposal',
    status: 'proposed',
    canBindAutomatically: false,
    canMarkVerified: false,
    canReadPayload: false,
    canWrite: false,
    canPublish: false,
    canActivate: false,
    canChangePermissions: false,
    binding: Object.freeze({
      scope: 'global',
      gate: UNIFIED_PUBLIC_WEB_REVIEWED_READINESS_GATE,
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
