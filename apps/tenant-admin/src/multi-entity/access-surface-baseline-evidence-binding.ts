import {
  assertMultiEntityAccessSurfaceBaselineCaptureEvidenceBoundToInput,
  assertMultiEntityAccessSurfaceBaselineUnchangedEvidenceBoundToInput,
  type MultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact,
  type MultiEntityAccessSurfaceBaselineEvidenceBindingContext,
  type MultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-access-surface-baseline-evidence'
import type { MultiEntityAccessSurfaceBaselineManifest } from '../../../../packages/tenant/src/multi-entity-access-surface-baseline'

export interface AccessSurfaceBaselineEvidenceBindingProposalInput {
  readonly captureArtifact: MultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact
  readonly unchangedArtifact: MultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact
  readonly capturedAccess: MultiEntityAccessSurfaceBaselineManifest
  readonly currentAccess: MultiEntityAccessSurfaceBaselineManifest
  readonly context: MultiEntityAccessSurfaceBaselineEvidenceBindingContext
}

export interface AccessSurfaceBaselineSourceBinding {
  readonly scope: 'global'
  readonly purpose:
    | 'access_surface_baseline_capture_review'
    | 'access_surface_baseline_unchanged_review'
  readonly reviewReference: string
  readonly campaignReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly targetTenantRefDigest: string
  readonly evidenceReference: string
  readonly artifactKind: string
  readonly artifactDigest: string
}

export interface AccessSurfaceBaselineEvidenceBindingProposal {
  readonly schemaVersion: 1
  readonly mode: 'manual_access_surface_baseline_source_binding_proposal'
  readonly status: 'proposed'
  readonly canBindAutomatically: false
  readonly canEnterStagingEvidenceBundle: false
  readonly canMarkVerified: false
  readonly canReadRuntime: false
  readonly canActivateAuthorization: false
  readonly canChangePermissions: false
  readonly bindings: readonly [
    AccessSurfaceBaselineSourceBinding,
    AccessSurfaceBaselineSourceBinding,
  ]
}

export type AccessSurfaceBaselineEvidenceBindingErrorCode =
  | 'ACCESS_SURFACE_BASELINE_EVIDENCE_BINDING_INPUT_INVALID'
  | 'ACCESS_SURFACE_BASELINE_CAPTURE_EVIDENCE_INVALID'
  | 'ACCESS_SURFACE_BASELINE_UNCHANGED_EVIDENCE_INVALID'

export class AccessSurfaceBaselineEvidenceBindingError extends Error {
  constructor(readonly code: AccessSurfaceBaselineEvidenceBindingErrorCode) {
    super('Access surface baseline evidence binding is invalid.')
    this.name = 'AccessSurfaceBaselineEvidenceBindingError'
  }
}

const INPUT_KEYS = new Set([
  'captureArtifact',
  'unchangedArtifact',
  'capturedAccess',
  'currentAccess',
  'context',
])

/**
 * Binds expanded access-surface artifacts to the exact reviewed offline
 * manifests and context. The result is deliberately not a staging evidence
 * binding and exposes no runtime, authorization or readiness mutation path.
 */
export function createAccessSurfaceBaselineEvidenceBindingProposal(
  input: AccessSurfaceBaselineEvidenceBindingProposalInput
): AccessSurfaceBaselineEvidenceBindingProposal {
  if (!input || typeof input !== 'object' || !exactKeys(input, INPUT_KEYS)) {
    throw bindingError('ACCESS_SURFACE_BASELINE_EVIDENCE_BINDING_INPUT_INVALID')
  }

  const captureInput = {
    campaignReviewReference: input.context.campaignReviewReference,
    readinessReviewReference: input.context.readinessReviewReference,
    sourceDigest: input.context.sourceDigest,
    targetTenantDigest: input.context.targetTenantDigest,
    capturedAccess: input.capturedAccess,
  }
  try {
    assertMultiEntityAccessSurfaceBaselineCaptureEvidenceBoundToInput(
      input.captureArtifact,
      captureInput,
      input.context
    )
  } catch {
    throw bindingError('ACCESS_SURFACE_BASELINE_CAPTURE_EVIDENCE_INVALID')
  }

  try {
    assertMultiEntityAccessSurfaceBaselineUnchangedEvidenceBoundToInput(
      input.unchangedArtifact,
      {
        ...captureInput,
        captureArtifact: input.captureArtifact,
        currentAccess: input.currentAccess,
      },
      input.context
    )
  } catch {
    throw bindingError('ACCESS_SURFACE_BASELINE_UNCHANGED_EVIDENCE_INVALID')
  }

  const shared = {
    scope: 'global' as const,
    reviewReference: input.context.readinessReviewReference,
    campaignReviewReference: input.context.campaignReviewReference,
    sourceDigest: input.context.sourceDigest,
    targetTenantDigest: input.context.targetTenantDigest,
    targetTenantRefDigest: input.captureArtifact.targetTenantRefDigest,
  }
  const bindings = Object.freeze([
    Object.freeze({
      ...shared,
      purpose: 'access_surface_baseline_capture_review' as const,
      evidenceReference: input.captureArtifact.evidenceReference,
      artifactKind: input.captureArtifact.kind,
      artifactDigest: input.captureArtifact.artifactDigest,
    }),
    Object.freeze({
      ...shared,
      purpose: 'access_surface_baseline_unchanged_review' as const,
      evidenceReference: input.unchangedArtifact.evidenceReference,
      artifactKind: input.unchangedArtifact.kind,
      artifactDigest: input.unchangedArtifact.artifactDigest,
    }),
  ] as const)

  return Object.freeze({
    schemaVersion: 1,
    mode: 'manual_access_surface_baseline_source_binding_proposal',
    status: 'proposed',
    canBindAutomatically: false,
    canEnterStagingEvidenceBundle: false,
    canMarkVerified: false,
    canReadRuntime: false,
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

function bindingError(code: AccessSurfaceBaselineEvidenceBindingErrorCode) {
  return new AccessSurfaceBaselineEvidenceBindingError(code)
}
