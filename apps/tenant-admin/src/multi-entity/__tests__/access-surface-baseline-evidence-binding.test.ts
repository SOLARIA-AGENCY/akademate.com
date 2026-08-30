import { describe, expect, it } from 'vitest'

import {
  createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact,
  createMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact,
  type MultiEntityAccessSurfaceBaselineEvidenceBindingContext,
} from '../../../../../packages/tenant/src/multi-entity-access-surface-baseline-evidence'
import {
  createMultiEntityAccessSurfaceBaseline,
  type AccessSurfaceReference,
} from '../../../../../packages/tenant/src/multi-entity-access-surface-baseline'
import {
  AccessSurfaceBaselineEvidenceBindingError,
  createAccessSurfaceBaselineEvidenceBindingProposal,
} from '../access-surface-baseline-evidence-binding'

const ref = (value: number): AccessSurfaceReference =>
  `ref:sha256:${value.toString(16).padStart(64, '0')}`
const digest = (value: string) => `sha256:${value.repeat(64)}` as const

const context: MultiEntityAccessSurfaceBaselineEvidenceBindingContext = {
  campaignReviewReference: 'review://campaign/cep/access-surface-v1',
  readinessReviewReference: 'review://readiness/cep/access-surface-v1',
  sourceDigest: digest('a'),
  targetTenantDigest: digest('b'),
  targetTenantRef: ref(1),
}

function baseline(apiKeyStatus: 'active' | 'revoked' = 'active') {
  return createMultiEntityAccessSurfaceBaseline({
    targetTenantRef: context.targetTenantRef,
    sourceDigests: {
      authorizationPolicy: digest('c'),
      payloadUsersSchema: digest('d'),
      platformMembershipsSchema: digest('e'),
      payloadApiKeysSchema: digest('f'),
      platformApiKeysSchema: digest('0'),
    },
    users: [
      {
        ref: ref(10),
        source: 'payload_tenant_admin',
        tenantRef: context.targetTenantRef,
        roles: ['admin'],
        status: 'active',
      },
      {
        ref: ref(11),
        source: 'platform',
        tenantRef: null,
        roles: [],
        status: 'active',
      },
    ],
    memberships: [
      {
        ref: ref(20),
        userRef: ref(11),
        tenantRef: context.targetTenantRef,
        roles: ['admin'],
        status: 'active',
      },
    ],
    apiKeys: [
      {
        ref: ref(30),
        source: 'platform',
        tenantRef: context.targetTenantRef,
        scopes: ['enrollments:read'],
        status: apiKeyStatus,
      },
    ],
  })
}

function evidence() {
  const capturedAccess = baseline()
  const captureArtifact = createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact({
    campaignReviewReference: context.campaignReviewReference,
    readinessReviewReference: context.readinessReviewReference,
    sourceDigest: context.sourceDigest,
    targetTenantDigest: context.targetTenantDigest,
    capturedAccess,
  })
  const currentAccess = baseline()
  const unchangedArtifact = createMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact({
    campaignReviewReference: context.campaignReviewReference,
    readinessReviewReference: context.readinessReviewReference,
    sourceDigest: context.sourceDigest,
    targetTenantDigest: context.targetTenantDigest,
    captureArtifact,
    capturedAccess,
    currentAccess,
  })
  return { captureArtifact, unchangedArtifact, capturedAccess, currentAccess }
}

function expectCode(
  action: () => unknown,
  code: AccessSurfaceBaselineEvidenceBindingError['code']
) {
  expect(action).toThrowError(
    expect.objectContaining<Partial<AccessSurfaceBaselineEvidenceBindingError>>({ code })
  )
}

describe('expanded access surface baseline source binding proposal', () => {
  it('binds both artifacts for manual review without exposing staging or authorization authority', () => {
    const artifacts = evidence()
    const proposal = createAccessSurfaceBaselineEvidenceBindingProposal({
      ...artifacts,
      context,
    })

    expect(proposal).toMatchObject({
      schemaVersion: 1,
      mode: 'manual_access_surface_baseline_source_binding_proposal',
      status: 'proposed',
      canBindAutomatically: false,
      canEnterStagingEvidenceBundle: false,
      canMarkVerified: false,
      canReadRuntime: false,
      canActivateAuthorization: false,
      canChangePermissions: false,
    })
    expect(
      proposal.bindings.map(({ purpose, artifactKind }) => ({ purpose, artifactKind }))
    ).toEqual([
      {
        purpose: 'access_surface_baseline_capture_review',
        artifactKind: 'cep_access_surface_baseline_capture_evidence',
      },
      {
        purpose: 'access_surface_baseline_unchanged_review',
        artifactKind: 'cep_access_surface_baseline_unchanged_evidence',
      },
    ])
    expect(Object.isFrozen(proposal)).toBe(true)
    expect(Object.isFrozen(proposal.bindings)).toBe(true)
    expect(proposal.bindings.every(Object.isFrozen)).toBe(true)
  })

  it('rejects tenant relabeling even when the artifacts remain internally valid', () => {
    expectCode(
      () =>
        createAccessSurfaceBaselineEvidenceBindingProposal({
          ...evidence(),
          context: { ...context, targetTenantRef: ref(2) },
        }),
      'ACCESS_SURFACE_BASELINE_CAPTURE_EVIDENCE_INVALID'
    )
  })

  it('rejects a changed current API-key surface', () => {
    expectCode(
      () =>
        createAccessSurfaceBaselineEvidenceBindingProposal({
          ...evidence(),
          currentAccess: baseline('revoked'),
          context,
        }),
      'ACCESS_SURFACE_BASELINE_UNCHANGED_EVIDENCE_INVALID'
    )
  })

  it('rejects automation metadata and exports no mutation capability', async () => {
    expectCode(
      () =>
        createAccessSurfaceBaselineEvidenceBindingProposal({
          ...evidence(),
          context,
          markVerified: true,
        } as never),
      'ACCESS_SURFACE_BASELINE_EVIDENCE_BINDING_INPUT_INVALID'
    )
    const module = await import('../access-surface-baseline-evidence-binding')
    expect(Object.keys(module)).not.toEqual(
      expect.arrayContaining([
        'apply',
        'activate',
        'bindToStaging',
        'changePermissions',
        'markVerified',
      ])
    )
  })
})
