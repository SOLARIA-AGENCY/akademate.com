import { createHash } from 'node:crypto'

import {
  assertMultiEntityAuthorizationShadowEvidenceArtifact,
  assertMultiEntityFeatureFlagsDefaultOffEvidenceArtifact,
  type MultiEntityAuthorizationShadowEvidenceArtifact,
  type MultiEntityFeatureFlagsDefaultOffEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-safety-mode-evidence'
import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'

export const FEATURE_FLAGS_DEFAULT_OFF_READINESS_GATE = 'all_feature_flags_default_off' as const
export const AUTHORIZATION_SHADOW_VERIFIED_READINESS_GATE = 'authorization_shadow_verified' as const

export interface SafetyModeEvidenceBindingProposalInput {
  readonly featureFlagsArtifact: MultiEntityFeatureFlagsDefaultOffEvidenceArtifact
  readonly authorizationShadowArtifact: MultiEntityAuthorizationShadowEvidenceArtifact
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
}

export interface SafetyModeEvidenceBindingProposal {
  readonly schemaVersion: 1
  readonly mode: 'manual_safety_mode_evidence_binding_proposal'
  readonly status: 'proposed'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canEnableFlags: false
  readonly canEnforceProposedAuthorization: false
  readonly canActivateAuthorization: false
  readonly canChangePermissions: false
  readonly bindings: readonly [MultiEntityStagingEvidenceBinding, MultiEntityStagingEvidenceBinding]
}

export type SafetyModeEvidenceBindingErrorCode =
  | 'SAFETY_MODE_EVIDENCE_BINDING_INPUT_INVALID'
  | 'FEATURE_FLAGS_DEFAULT_OFF_EVIDENCE_ARTIFACT_INVALID'
  | 'AUTHORIZATION_SHADOW_EVIDENCE_ARTIFACT_INVALID'
  | 'SAFETY_MODE_EVIDENCE_CONTEXT_MISMATCH'

export class SafetyModeEvidenceBindingError extends Error {
  constructor(readonly code: SafetyModeEvidenceBindingErrorCode) {
    super('Safety mode evidence binding is invalid.')
    this.name = 'SafetyModeEvidenceBindingError'
  }
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set([
  'featureFlagsArtifact',
  'authorizationShadowArtifact',
  'campaignReviewReference',
  'readinessReviewReference',
])

/** Proposes two safety gates without changing flags, authorization or readiness. */
export function createSafetyModeEvidenceBindingProposal(
  input: SafetyModeEvidenceBindingProposalInput
): SafetyModeEvidenceBindingProposal {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference
  ) {
    throw bindingError('SAFETY_MODE_EVIDENCE_BINDING_INPUT_INVALID')
  }
  try {
    assertMultiEntityFeatureFlagsDefaultOffEvidenceArtifact(input.featureFlagsArtifact)
  } catch {
    throw bindingError('FEATURE_FLAGS_DEFAULT_OFF_EVIDENCE_ARTIFACT_INVALID')
  }
  try {
    assertMultiEntityAuthorizationShadowEvidenceArtifact(input.authorizationShadowArtifact)
  } catch {
    throw bindingError('AUTHORIZATION_SHADOW_EVIDENCE_ARTIFACT_INVALID')
  }

  const campaignDigest = digest(input.campaignReviewReference)
  const readinessDigest = digest(input.readinessReviewReference)
  const artifacts = [input.featureFlagsArtifact, input.authorizationShadowArtifact]
  if (
    artifacts.some(
      (artifact) =>
        artifact.campaignReviewReferenceDigest !== campaignDigest ||
        artifact.readinessReviewReferenceDigest !== readinessDigest ||
        artifact.sourceDigest !== input.featureFlagsArtifact.sourceDigest ||
        artifact.targetTenantDigest !== input.featureFlagsArtifact.targetTenantDigest
    )
  ) {
    throw bindingError('SAFETY_MODE_EVIDENCE_CONTEXT_MISMATCH')
  }

  const shared = {
    scope: 'global' as const,
    reviewReference: input.readinessReviewReference,
    campaignReviewReference: input.campaignReviewReference,
    sourceDigest: input.featureFlagsArtifact.sourceDigest,
    targetTenantDigest: input.featureFlagsArtifact.targetTenantDigest,
  }
  const bindings = Object.freeze([
    Object.freeze({
      ...shared,
      gate: FEATURE_FLAGS_DEFAULT_OFF_READINESS_GATE,
      evidenceReference: input.featureFlagsArtifact.evidenceReference,
      artifactKind: input.featureFlagsArtifact.kind,
      artifactDigest: input.featureFlagsArtifact.artifactDigest,
    }),
    Object.freeze({
      ...shared,
      gate: AUTHORIZATION_SHADOW_VERIFIED_READINESS_GATE,
      evidenceReference: input.authorizationShadowArtifact.evidenceReference,
      artifactKind: input.authorizationShadowArtifact.kind,
      artifactDigest: input.authorizationShadowArtifact.artifactDigest,
    }),
  ] as const)

  return Object.freeze({
    schemaVersion: 1,
    mode: 'manual_safety_mode_evidence_binding_proposal',
    status: 'proposed',
    canBindAutomatically: false,
    canMarkVerified: false,
    canEnableFlags: false,
    canEnforceProposedAuthorization: false,
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

function bindingError(code: SafetyModeEvidenceBindingErrorCode) {
  return new SafetyModeEvidenceBindingError(code)
}
