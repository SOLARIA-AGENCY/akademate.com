import { createHash } from 'node:crypto'

import {
  assertNominalPermissionPhaseLockEvidenceArtifact,
  type NominalPermissionPhaseLockEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-nominal-permission-phase-lock-evidence'
import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'

export const NOMINAL_PERMISSION_PHASE_LOCK_READINESS_GATE =
  'nominal_permission_phase_lock_verified' as const

export interface NominalPermissionPhaseLockBindingProposalInput {
  readonly artifact: NominalPermissionPhaseLockEvidenceArtifact
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
}

export interface NominalPermissionPhaseLockBindingProposal {
  readonly schemaVersion: 1
  readonly mode: 'manual_nominal_permission_lock_binding_proposal'
  readonly status: 'proposed'
  readonly canGenerateNominalMatrix: false
  readonly canApplyPermissionChange: false
  readonly canBulkChangePermissions: false
  readonly canUsePlatformSuperadmin: false
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canDeploy: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly binding: MultiEntityStagingEvidenceBinding
}

export type NominalPermissionPhaseLockBindingErrorCode =
  | 'NOMINAL_PERMISSION_PHASE_LOCK_BINDING_INPUT_INVALID'
  | 'NOMINAL_PERMISSION_PHASE_LOCK_ARTIFACT_INVALID'
  | 'NOMINAL_PERMISSION_PHASE_LOCK_CAMPAIGN_MISMATCH'

export class NominalPermissionPhaseLockBindingError extends Error {
  constructor(readonly code: NominalPermissionPhaseLockBindingErrorCode) {
    super('Nominal permission phase lock evidence binding is invalid.')
    this.name = 'NominalPermissionPhaseLockBindingError'
  }
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set(['artifact', 'campaignReviewReference', 'readinessReviewReference'])

/**
 * Proposes the global deny-only phase-lock binding. This bridge has no unlock,
 * permission generation, apply or readiness mutation branch.
 */
export function createNominalPermissionPhaseLockBindingProposal(
  input: NominalPermissionPhaseLockBindingProposalInput
): NominalPermissionPhaseLockBindingProposal {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !validReviewReference(input.campaignReviewReference) ||
    !validReviewReference(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference
  ) {
    throw bindingError('NOMINAL_PERMISSION_PHASE_LOCK_BINDING_INPUT_INVALID')
  }
  try {
    assertNominalPermissionPhaseLockEvidenceArtifact(input.artifact)
  } catch {
    throw bindingError('NOMINAL_PERMISSION_PHASE_LOCK_ARTIFACT_INVALID')
  }
  if (
    digest(input.campaignReviewReference) !== input.artifact.campaignReviewReferenceDigest ||
    digest(input.readinessReviewReference) !== input.artifact.readinessReviewReferenceDigest
  ) {
    throw bindingError('NOMINAL_PERMISSION_PHASE_LOCK_CAMPAIGN_MISMATCH')
  }

  const binding: MultiEntityStagingEvidenceBinding = Object.freeze({
    scope: 'global',
    gate: NOMINAL_PERMISSION_PHASE_LOCK_READINESS_GATE,
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
    mode: 'manual_nominal_permission_lock_binding_proposal',
    status: 'proposed',
    canGenerateNominalMatrix: false,
    canApplyPermissionChange: false,
    canBulkChangePermissions: false,
    canUsePlatformSuperadmin: false,
    canBindAutomatically: false,
    canMarkVerified: false,
    canDeploy: false,
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

function validReviewReference(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_REFERENCE_PATTERN.test(value)
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function bindingError(code: NominalPermissionPhaseLockBindingErrorCode) {
  return new NominalPermissionPhaseLockBindingError(code)
}
