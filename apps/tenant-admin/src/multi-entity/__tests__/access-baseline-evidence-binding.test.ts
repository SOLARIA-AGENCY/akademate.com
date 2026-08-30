import { describe, expect, it } from 'vitest'

import { createMultiEntityAccessBaseline } from '../../../../../packages/tenant/src/multi-entity-access-baseline'
import {
  createMultiEntityAccessBaselineCaptureEvidenceArtifact,
  createMultiEntityAccessUnchangedEvidenceArtifact,
} from '../../../../../packages/tenant/src/multi-entity-access-baseline-evidence'
import {
  ACCESS_BASELINE_CAPTURED_READINESS_GATE,
  ACCESS_UNCHANGED_VERIFIED_READINESS_GATE,
  AccessBaselineEvidenceBindingError,
  createAccessBaselineEvidenceBindingProposal,
} from '../access-baseline-evidence-binding'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const policyDigest = `sha256:${'c'.repeat(64)}`

function baseline(suffix = '') {
  return createMultiEntityAccessBaseline({
    targetTenantId: 'tenant-private',
    policyDigest,
    users: [
      {
        id: `admin-private${suffix}`,
        role: 'admin',
        tenantId: 'tenant-private',
        isActive: true,
      },
      { id: 'platform-private', role: 'superadmin', tenantId: null, isActive: true },
    ],
  })
}

function evidence(suffix = '') {
  const capturedAccess = baseline(suffix)
  const captureArtifact = createMultiEntityAccessBaselineCaptureEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    capturedAccess,
  })
  const unchangedArtifact = createMultiEntityAccessUnchangedEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    captureArtifact,
    capturedAccess,
    currentAccess: baseline(suffix),
  })
  return { captureArtifact, unchangedArtifact }
}

function expectCode(action: () => unknown, code: AccessBaselineEvidenceBindingError['code']) {
  expect(action).toThrowError(
    expect.objectContaining<Partial<AccessBaselineEvidenceBindingError>>({ code })
  )
}

describe('access baseline evidence binding proposal', () => {
  it('proposes exactly the two global preservation gates without marking them verified', () => {
    const artifacts = evidence()
    const proposal = createAccessBaselineEvidenceBindingProposal({
      ...artifacts,
      campaignReviewReference,
      readinessReviewReference,
    })

    expect(proposal).toMatchObject({
      schemaVersion: 1,
      mode: 'manual_access_baseline_evidence_binding_proposal',
      status: 'proposed',
      canBindAutomatically: false,
      canMarkVerified: false,
      canActivateAuthorization: false,
      canChangePermissions: false,
    })
    expect(proposal.bindings).toEqual([
      {
        scope: 'global',
        gate: ACCESS_BASELINE_CAPTURED_READINESS_GATE,
        reviewReference: readinessReviewReference,
        evidenceReference: artifacts.captureArtifact.evidenceReference,
        campaignReviewReference,
        sourceDigest,
        targetTenantDigest,
        artifactKind: 'cep_access_baseline_capture_evidence',
        artifactDigest: artifacts.captureArtifact.artifactDigest,
      },
      {
        scope: 'global',
        gate: ACCESS_UNCHANGED_VERIFIED_READINESS_GATE,
        reviewReference: readinessReviewReference,
        evidenceReference: artifacts.unchangedArtifact.evidenceReference,
        campaignReviewReference,
        sourceDigest,
        targetTenantDigest,
        artifactKind: 'cep_access_baseline_unchanged_evidence',
        artifactDigest: artifacts.unchangedArtifact.artifactDigest,
      },
    ])
    expect(Object.isFrozen(proposal)).toBe(true)
    expect(Object.isFrozen(proposal.bindings)).toBe(true)
    expect(proposal.bindings.every(Object.isFrozen)).toBe(true)
  })

  it.each([
    ['campaign', 'review://campaign/other/v1', readinessReviewReference],
    ['readiness', campaignReviewReference, 'review://staging/other/v1'],
  ])('rejects reuse under another %s review', (_label, campaign, readiness) => {
    expectCode(
      () =>
        createAccessBaselineEvidenceBindingProposal({
          ...evidence(),
          campaignReviewReference: campaign,
          readinessReviewReference: readiness,
        }),
      'ACCESS_BASELINE_EVIDENCE_CONTEXT_MISMATCH'
    )
  })

  it('rejects a valid unchanged artifact chained to another capture', () => {
    const first = evidence()
    const second = evidence('-other')
    expectCode(
      () =>
        createAccessBaselineEvidenceBindingProposal({
          captureArtifact: first.captureArtifact,
          unchangedArtifact: second.unchangedArtifact,
          campaignReviewReference,
          readinessReviewReference,
        }),
      'ACCESS_BASELINE_EVIDENCE_CHAIN_MISMATCH'
    )
  })

  it.each([
    [
      'capture',
      () => ({
        ...evidence(),
        captureArtifact: {
          ...evidence().captureArtifact,
          artifactDigest: `sha256:${'d'.repeat(64)}`,
        },
      }),
      'ACCESS_BASELINE_CAPTURE_EVIDENCE_ARTIFACT_INVALID',
    ],
    [
      'unchanged',
      () => ({
        ...evidence(),
        unchangedArtifact: {
          ...evidence().unchangedArtifact,
          canChangePermissions: true,
        },
      }),
      'ACCESS_BASELINE_UNCHANGED_EVIDENCE_ARTIFACT_INVALID',
    ],
  ] as const)('rejects a forged %s artifact', (_label, build, code) => {
    expectCode(
      () =>
        createAccessBaselineEvidenceBindingProposal({
          ...build(),
          campaignReviewReference,
          readinessReviewReference,
        } as never),
      code
    )
  })

  it('rejects automation metadata and exports no mutation capability', async () => {
    expectCode(
      () =>
        createAccessBaselineEvidenceBindingProposal({
          ...evidence(),
          campaignReviewReference,
          readinessReviewReference,
          markVerified: true,
        } as never),
      'ACCESS_BASELINE_EVIDENCE_BINDING_INPUT_INVALID'
    )
    const module = await import('../access-baseline-evidence-binding')
    expect(Object.keys(module)).not.toEqual(
      expect.arrayContaining(['capture', 'apply', 'activate', 'changePermissions', 'markVerified'])
    )
  })
})
