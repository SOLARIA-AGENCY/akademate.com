import { describe, expect, it } from 'vitest'

import {
  createMultiEntityAuthorizationShadowEvidenceArtifact,
  createMultiEntityFeatureFlagsDefaultOffEvidenceArtifact,
  type MultiEntityAuthorizationShadowEvidenceSample,
} from '../../../../../packages/tenant/src/multi-entity-safety-mode-evidence'
import { evaluateMultiEntityAuthorizationShadow } from '../../../../../packages/tenant/src/multi-entity-shadow'
import {
  AUTHORIZATION_SHADOW_VERIFIED_READINESS_GATE,
  FEATURE_FLAGS_DEFAULT_OFF_READINESS_GATE,
  SafetyModeEvidenceBindingError,
  createSafetyModeEvidenceBindingProposal,
} from '../safety-mode-evidence-binding'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`

function authSample(
  legacyAllowed: boolean,
  proposedAllowed: boolean
): MultiEntityAuthorizationShadowEvidenceSample {
  return {
    reviewReference: `review://authorization/${legacyAllowed}/${proposedAllowed}/v1`,
    legacyAllowed,
    proposedAllowed,
    observation: evaluateMultiEntityAuthorizationShadow({
      configuredMode: 'shadow',
      legacyAllowed,
      request: {
        scope: 'group',
        userId: 'private-user',
        groupId: 'private-group',
        capability: 'catalog.read',
      },
      snapshot: proposedAllowed
        ? {
            groupMemberships: [
              {
                userId: 'private-user',
                groupId: 'private-group',
                status: 'active',
                capabilities: ['catalog.read'],
              },
            ],
            legalEntityMemberships: [],
          }
        : { groupMemberships: [], legalEntityMemberships: [] },
    }),
  }
}

function evidence(change: { sourceDigest?: string; targetTenantDigest?: string } = {}) {
  const context = {
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest: change.sourceDigest ?? sourceDigest,
    targetTenantDigest: change.targetTenantDigest ?? targetTenantDigest,
  }
  const featureFlagsArtifact = createMultiEntityFeatureFlagsDefaultOffEvidenceArtifact({
    ...context,
    flagState: {
      AKADEMATE_CEP_MULTI_ENTITY_SCHEMA_SHADOW_ENABLED: false,
      AKADEMATE_CEP_MULTI_ENTITY_LEDGER_SHADOW_ENABLED: false,
      AKADEMATE_CEP_TEACHER_SCHEDULE_SHADOW_ENABLED: false,
      AKADEMATE_CEP_PUBLIC_PROJECTION_SHADOW_ENABLED: false,
      AKADEMATE_CEP_FINANCE_RECONCILIATION_SHADOW_ENABLED: false,
      AKADEMATE_CEP_FINANCE_ISOLATION_AUDIT_ENABLED: false,
      AKADEMATE_CEP_FINANCE_ACCOUNTING_SYNC_SHADOW_ENABLED: false,
      AKADEMATE_CEP_FINANCE_ACCOUNTING_IMPORT_STAGING_ENABLED: false,
      AKADEMATE_MULTI_ENTITY_AUTHORIZATION_MODE: 'disabled',
    },
  })
  const authorizationShadowArtifact = createMultiEntityAuthorizationShadowEvidenceArtifact({
    ...context,
    samples: [
      authSample(false, false),
      authSample(false, true),
      authSample(true, false),
      authSample(true, true),
    ],
  })
  return { featureFlagsArtifact, authorizationShadowArtifact }
}

function expectCode(action: () => unknown, code: SafetyModeEvidenceBindingError['code']) {
  expect(action).toThrowError(
    expect.objectContaining<Partial<SafetyModeEvidenceBindingError>>({ code })
  )
}

describe('safety mode evidence binding proposal', () => {
  it('proposes the two exact global safety gates without activating anything', () => {
    const artifacts = evidence()
    const proposal = createSafetyModeEvidenceBindingProposal({
      ...artifacts,
      campaignReviewReference,
      readinessReviewReference,
    })
    expect(proposal).toMatchObject({
      schemaVersion: 1,
      mode: 'manual_safety_mode_evidence_binding_proposal',
      status: 'proposed',
      canBindAutomatically: false,
      canMarkVerified: false,
      canEnableFlags: false,
      canEnforceProposedAuthorization: false,
      canActivateAuthorization: false,
      canChangePermissions: false,
    })
    expect(proposal.bindings.map(({ gate }) => gate)).toEqual([
      FEATURE_FLAGS_DEFAULT_OFF_READINESS_GATE,
      AUTHORIZATION_SHADOW_VERIFIED_READINESS_GATE,
    ])
    expect(proposal.bindings.map(({ artifactKind }) => artifactKind)).toEqual([
      'cep_multi_entity_feature_flags_default_off_evidence',
      'cep_multi_entity_authorization_shadow_evidence',
    ])
    expect(proposal.bindings.every(Object.isFrozen)).toBe(true)
  })

  it.each([
    ['campaign', 'review://campaign/other/v1', readinessReviewReference],
    ['readiness', campaignReviewReference, 'review://readiness/other/v1'],
  ])('rejects reuse under another %s review', (_label, campaign, readiness) => {
    expectCode(
      () =>
        createSafetyModeEvidenceBindingProposal({
          ...evidence(),
          campaignReviewReference: campaign,
          readinessReviewReference: readiness,
        }),
      'SAFETY_MODE_EVIDENCE_CONTEXT_MISMATCH'
    )
  })

  it('rejects artifacts from different source or tenant contexts', () => {
    expectCode(
      () =>
        createSafetyModeEvidenceBindingProposal({
          featureFlagsArtifact: evidence().featureFlagsArtifact,
          authorizationShadowArtifact: evidence({
            sourceDigest: `sha256:${'c'.repeat(64)}`,
          }).authorizationShadowArtifact,
          campaignReviewReference,
          readinessReviewReference,
        }),
      'SAFETY_MODE_EVIDENCE_CONTEXT_MISMATCH'
    )
  })

  it.each([
    [
      'flags',
      () => ({
        ...evidence(),
        featureFlagsArtifact: { ...evidence().featureFlagsArtifact, canEnableFlags: true },
      }),
      'FEATURE_FLAGS_DEFAULT_OFF_EVIDENCE_ARTIFACT_INVALID',
    ],
    [
      'authorization',
      () => ({
        ...evidence(),
        authorizationShadowArtifact: {
          ...evidence().authorizationShadowArtifact,
          canEnforceProposedAuthorization: true,
        },
      }),
      'AUTHORIZATION_SHADOW_EVIDENCE_ARTIFACT_INVALID',
    ],
  ] as const)('rejects forged %s evidence', (_label, build, code) => {
    expectCode(
      () =>
        createSafetyModeEvidenceBindingProposal({
          ...build(),
          campaignReviewReference,
          readinessReviewReference,
        } as never),
      code
    )
  })

  it('rejects automation metadata and exports no activation operation', async () => {
    expectCode(
      () =>
        createSafetyModeEvidenceBindingProposal({
          ...evidence(),
          campaignReviewReference,
          readinessReviewReference,
          enable: true,
        } as never),
      'SAFETY_MODE_EVIDENCE_BINDING_INPUT_INVALID'
    )
    const module = await import('../safety-mode-evidence-binding')
    expect(Object.keys(module)).not.toEqual(
      expect.arrayContaining(['enable', 'enforce', 'activate', 'markVerified', 'apply'])
    )
  })
})
