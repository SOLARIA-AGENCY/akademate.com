import { createHash } from 'node:crypto'

import {
  assertMultiEntityAccessBaselineCaptureEvidenceArtifact,
  assertMultiEntityAccessUnchangedEvidenceArtifact,
  type MultiEntityAccessBaselineCaptureEvidenceArtifact,
  type MultiEntityAccessUnchangedEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-access-baseline-evidence'
import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'

export const ACCESS_BASELINE_CAPTURED_READINESS_GATE = 'access_baseline_captured' as const
export const ACCESS_UNCHANGED_VERIFIED_READINESS_GATE = 'access_unchanged_verified' as const

export interface AccessBaselineEvidenceBindingProposalInput {
  readonly captureArtifact: MultiEntityAccessBaselineCaptureEvidenceArtifact
  readonly unchangedArtifact: MultiEntityAccessUnchangedEvidenceArtifact
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
}

export interface AccessBaselineEvidenceBindingProposal {
  readonly schemaVersion: 1
  readonly mode: 'manual_access_baseline_evidence_binding_proposal'
  readonly status: 'proposed'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canActivateAuthorization: false
  readonly canChangePermissions: false
  readonly bindings: readonly [MultiEntityStagingEvidenceBinding, MultiEntityStagingEvidenceBinding]
}

export type AccessBaselineEvidenceBindingErrorCode =
  | 'ACCESS_BASELINE_EVIDENCE_BINDING_INPUT_INVALID'
  | 'ACCESS_BASELINE_CAPTURE_EVIDENCE_ARTIFACT_INVALID'
  | 'ACCESS_BASELINE_UNCHANGED_EVIDENCE_ARTIFACT_INVALID'
  | 'ACCESS_BASELINE_EVIDENCE_CONTEXT_MISMATCH'
  | 'ACCESS_BASELINE_EVIDENCE_CHAIN_MISMATCH'

export class AccessBaselineEvidenceBindingError extends Error {
  constructor(readonly code: AccessBaselineEvidenceBindingErrorCode) {
    super('Access baseline evidence binding is invalid.')
    this.name = 'AccessBaselineEvidenceBindingError'
  }
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set([
  'captureArtifact',
  'unchangedArtifact',
  'campaignReviewReference',
  'readinessReviewReference',
])

/**
 * Proposes the two global access-preservation bindings. It cannot capture a
 * baseline, mutate readiness, activate authorization or change permissions.
 */
export function createAccessBaselineEvidenceBindingProposal(
  input: AccessBaselineEvidenceBindingProposalInput
): AccessBaselineEvidenceBindingProposal {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference
  ) {
    throw bindingError('ACCESS_BASELINE_EVIDENCE_BINDING_INPUT_INVALID')
  }
  try {
    assertMultiEntityAccessBaselineCaptureEvidenceArtifact(input.captureArtifact)
  } catch {
    throw bindingError('ACCESS_BASELINE_CAPTURE_EVIDENCE_ARTIFACT_INVALID')
  }
  try {
    assertMultiEntityAccessUnchangedEvidenceArtifact(input.unchangedArtifact)
  } catch {
    throw bindingError('ACCESS_BASELINE_UNCHANGED_EVIDENCE_ARTIFACT_INVALID')
  }

  const campaignDigest = digest(input.campaignReviewReference)
  const readinessDigest = digest(input.readinessReviewReference)
  if (
    input.captureArtifact.campaignReviewReferenceDigest !== campaignDigest ||
    input.captureArtifact.readinessReviewReferenceDigest !== readinessDigest ||
    input.unchangedArtifact.campaignReviewReferenceDigest !== campaignDigest ||
    input.unchangedArtifact.readinessReviewReferenceDigest !== readinessDigest ||
    input.captureArtifact.sourceDigest !== input.unchangedArtifact.sourceDigest ||
    input.captureArtifact.targetTenantDigest !== input.unchangedArtifact.targetTenantDigest
  ) {
    throw bindingError('ACCESS_BASELINE_EVIDENCE_CONTEXT_MISMATCH')
  }
  if (
    input.unchangedArtifact.captureArtifactDigest !== input.captureArtifact.artifactDigest ||
    input.unchangedArtifact.capturedBaselineDigest !== input.captureArtifact.baselineDigest ||
    input.unchangedArtifact.currentBaselineDigest !== input.captureArtifact.baselineDigest ||
    input.unchangedArtifact.policyDigest !== input.captureArtifact.policyDigest
  ) {
    throw bindingError('ACCESS_BASELINE_EVIDENCE_CHAIN_MISMATCH')
  }

  const shared = {
    scope: 'global' as const,
    reviewReference: input.readinessReviewReference,
    campaignReviewReference: input.campaignReviewReference,
    sourceDigest: input.captureArtifact.sourceDigest,
    targetTenantDigest: input.captureArtifact.targetTenantDigest,
  }
  const bindings = Object.freeze([
    Object.freeze({
      ...shared,
      gate: ACCESS_BASELINE_CAPTURED_READINESS_GATE,
      evidenceReference: input.captureArtifact.evidenceReference,
      artifactKind: input.captureArtifact.kind,
      artifactDigest: input.captureArtifact.artifactDigest,
    }),
    Object.freeze({
      ...shared,
      gate: ACCESS_UNCHANGED_VERIFIED_READINESS_GATE,
      evidenceReference: input.unchangedArtifact.evidenceReference,
      artifactKind: input.unchangedArtifact.kind,
      artifactDigest: input.unchangedArtifact.artifactDigest,
    }),
  ] as const)

  return Object.freeze({
    schemaVersion: 1,
    mode: 'manual_access_baseline_evidence_binding_proposal',
    status: 'proposed',
    canBindAutomatically: false,
    canMarkVerified: false,
    canActivateAuthorization: false,
    canChangePermissions: false,
    bindings,
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

function bindingError(code: AccessBaselineEvidenceBindingErrorCode) {
  return new AccessBaselineEvidenceBindingError(code)
}
