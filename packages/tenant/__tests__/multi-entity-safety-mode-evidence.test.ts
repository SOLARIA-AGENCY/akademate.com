import { describe, expect, it } from 'vitest'

import {
  assertMultiEntityAuthorizationShadowEvidenceArtifact,
  assertMultiEntityFeatureFlagsDefaultOffEvidenceArtifact,
  createMultiEntityAuthorizationShadowEvidenceArtifact,
  createMultiEntityFeatureFlagsDefaultOffEvidenceArtifact,
  type MultiEntityAuthorizationShadowEvidenceSample,
} from '../src/multi-entity-safety-mode-evidence'
import type { MultiEntityRollbackFlagState } from '../src/multi-entity-rollback-drill'
import {
  evaluateMultiEntityAuthorizationShadow,
  type AuthorizationSnapshot,
} from '../src/multi-entity-shadow'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`

function flagState(): MultiEntityRollbackFlagState {
  return {
    AKADEMATE_CEP_MULTI_ENTITY_SCHEMA_SHADOW_ENABLED: false,
    AKADEMATE_CEP_MULTI_ENTITY_LEDGER_SHADOW_ENABLED: false,
    AKADEMATE_CEP_TEACHER_SCHEDULE_SHADOW_ENABLED: false,
    AKADEMATE_CEP_PUBLIC_PROJECTION_SHADOW_ENABLED: false,
    AKADEMATE_CEP_FINANCE_RECONCILIATION_SHADOW_ENABLED: false,
    AKADEMATE_CEP_FINANCE_ISOLATION_AUDIT_ENABLED: false,
    AKADEMATE_CEP_FINANCE_ACCOUNTING_SYNC_SHADOW_ENABLED: false,
    AKADEMATE_CEP_FINANCE_ACCOUNTING_IMPORT_STAGING_ENABLED: false,
    AKADEMATE_MULTI_ENTITY_AUTHORIZATION_MODE: 'disabled',
  }
}

function featureArtifact() {
  return createMultiEntityFeatureFlagsDefaultOffEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    flagState: flagState(),
  })
}

function sample(
  legacyAllowed: boolean,
  proposedAllowed: boolean
): MultiEntityAuthorizationShadowEvidenceSample {
  const snapshot: AuthorizationSnapshot = proposedAllowed
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
    : { groupMemberships: [], legalEntityMemberships: [] }
  return {
    reviewReference: `review://authorization-shadow/legacy-${legacyAllowed}/proposed-${proposedAllowed}/v1`,
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
      snapshot,
    }),
  }
}

function samples(): MultiEntityAuthorizationShadowEvidenceSample[] {
  return [sample(false, false), sample(false, true), sample(true, false), sample(true, true)]
}

function authorizationArtifact() {
  return createMultiEntityAuthorizationShadowEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: samples(),
  })
}

describe('multi-entity safety mode evidence', () => {
  it('seals all nine known controls in their maximally disabled state', () => {
    const artifact = featureArtifact()
    expect(artifact).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_multi_entity_feature_flags_default_off_evidence',
      mode: 'content_addressed_configuration_review',
      verdict: 'eligible_for_manual_staging_binding',
      canBindAutomatically: false,
      canMarkVerified: false,
      canEnableFlags: false,
      canActivateAuthorization: false,
      canChangePermissions: false,
      metrics: {
        knownFlags: 9,
        booleanFlags: 8,
        enabledBooleanFlags: 0,
        authorizationModeDisabled: true,
      },
    })
    expect(() => assertMultiEntityFeatureFlagsDefaultOffEvidenceArtifact(artifact)).not.toThrow()
    expect(artifact.evidenceReference).toBe(
      `evidence://sha256/${artifact.artifactDigest.slice('sha256:'.length)}`
    )
    expect(Object.isFrozen(artifact)).toBe(true)
  })

  it.each([
    'AKADEMATE_CEP_MULTI_ENTITY_SCHEMA_SHADOW_ENABLED',
    'AKADEMATE_CEP_MULTI_ENTITY_LEDGER_SHADOW_ENABLED',
    'AKADEMATE_CEP_TEACHER_SCHEDULE_SHADOW_ENABLED',
    'AKADEMATE_CEP_PUBLIC_PROJECTION_SHADOW_ENABLED',
    'AKADEMATE_CEP_FINANCE_RECONCILIATION_SHADOW_ENABLED',
    'AKADEMATE_CEP_FINANCE_ISOLATION_AUDIT_ENABLED',
    'AKADEMATE_CEP_FINANCE_ACCOUNTING_SYNC_SHADOW_ENABLED',
    'AKADEMATE_CEP_FINANCE_ACCOUNTING_IMPORT_STAGING_ENABLED',
  ] as const)('rejects enabled flag %s', (flag) => {
    expect(() =>
      createMultiEntityFeatureFlagsDefaultOffEvidenceArtifact({
        campaignReviewReference,
        readinessReviewReference,
        sourceDigest,
        targetTenantDigest,
        flagState: { ...flagState(), [flag]: true },
      })
    ).toThrow('MULTI_ENTITY_SAFETY_MODE_EVIDENCE_INVALID')
  })

  it('rejects shadow authorization when reviewing the default-off state', () => {
    expect(() =>
      createMultiEntityFeatureFlagsDefaultOffEvidenceArtifact({
        campaignReviewReference,
        readinessReviewReference,
        sourceDigest,
        targetTenantDigest,
        flagState: {
          ...flagState(),
          AKADEMATE_MULTI_ENTITY_AUTHORIZATION_MODE: 'shadow',
        },
      })
    ).toThrow('MULTI_ENTITY_SAFETY_MODE_EVIDENCE_INVALID')
  })

  it('seals all four shadow combinations while the legacy decision stays effective', () => {
    const artifact = authorizationArtifact()
    expect(artifact).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_multi_entity_authorization_shadow_evidence',
      mode: 'legacy_effective_four_case_matrix',
      verdict: 'eligible_for_manual_staging_binding',
      canEnforceProposedAuthorization: false,
      canActivateAuthorization: false,
      canChangePermissions: false,
      metrics: {
        requiredCases: 4,
        legacyGranted: 2,
        legacyDenied: 2,
        proposedGranted: 2,
        proposedDenied: 2,
        divergences: 2,
        effectiveDecisionMismatches: 0,
      },
    })
    expect(artifact.cases).toHaveLength(4)
    expect(() => assertMultiEntityAuthorizationShadowEvidenceArtifact(artifact)).not.toThrow()
    expect(Object.isFrozen(artifact.cases)).toBe(true)
    expect(artifact.cases.every(Object.isFrozen)).toBe(true)
  })

  it('is deterministic under sample reordering', () => {
    const source = samples()
    const first = createMultiEntityAuthorizationShadowEvidenceArtifact({
      campaignReviewReference,
      readinessReviewReference,
      sourceDigest,
      targetTenantDigest,
      samples: source,
    })
    const second = createMultiEntityAuthorizationShadowEvidenceArtifact({
      campaignReviewReference,
      readinessReviewReference,
      sourceDigest,
      targetTenantDigest,
      samples: [...source].reverse(),
    })
    expect(second).toEqual(first)
  })

  it.each([
    ['missing case', samples().slice(0, 3)],
    [
      'duplicate combination',
      [sample(false, false), sample(false, false), sample(true, false), sample(true, true)],
    ],
  ])('rejects an incomplete authorization matrix: %s', (_label, source) => {
    expect(() =>
      createMultiEntityAuthorizationShadowEvidenceArtifact({
        campaignReviewReference,
        readinessReviewReference,
        sourceDigest,
        targetTenantDigest,
        samples: source,
      })
    ).toThrow('MULTI_ENTITY_SAFETY_MODE_EVIDENCE_INVALID')
  })

  it.each([
    ['effective decision changed', { effectiveAllowed: true }],
    ['decision source changed', { decisionSource: 'proposed' }],
    ['mode enforced', { mode: 'enforced' }],
    ['divergence hidden', { divergence: false }],
    ['unknown decision reason', { proposedDecision: { allowed: true, reason: 'admin_override' } }],
  ])('rejects weakened shadow observation: %s', (_label, change) => {
    const source = samples()
    source[1] = {
      ...source[1]!,
      observation: { ...source[1]!.observation, ...change } as never,
    }
    expect(() =>
      createMultiEntityAuthorizationShadowEvidenceArtifact({
        campaignReviewReference,
        readinessReviewReference,
        sourceDigest,
        targetTenantDigest,
        samples: source,
      })
    ).toThrow('MULTI_ENTITY_SAFETY_MODE_EVIDENCE_INVALID')
  })

  it.each([
    [
      'feature digest',
      () => ({ ...featureArtifact(), artifactDigest: `sha256:${'c'.repeat(64)}` }),
    ],
    ['feature enable', () => ({ ...featureArtifact(), canEnableFlags: true })],
    [
      'authorization digest',
      () => ({ ...authorizationArtifact(), artifactDigest: `sha256:${'d'.repeat(64)}` }),
    ],
    [
      'authorization enforcement',
      () => ({ ...authorizationArtifact(), canEnforceProposedAuthorization: true }),
    ],
  ])('rejects forged artifact: %s', (_label, build) => {
    const artifact = build()
    const assertion = artifact.kind.includes('authorization')
      ? assertMultiEntityAuthorizationShadowEvidenceArtifact
      : assertMultiEntityFeatureFlagsDefaultOffEvidenceArtifact
    expect(() => assertion(artifact)).toThrow('MULTI_ENTITY_SAFETY_MODE_EVIDENCE_INVALID')
  })

  it('omits identities and exports no enable, enforce, activate or permission operation', async () => {
    const serialized = JSON.stringify({ flags: featureArtifact(), auth: authorizationArtifact() })
    for (const value of [
      'private-user',
      'private-group',
      'review://',
      'groupMemberships',
      'legalEntityMemberships',
    ]) {
      expect(serialized).not.toContain(value)
    }
    const module = await import('../src/multi-entity-safety-mode-evidence')
    expect(Object.keys(module)).not.toEqual(
      expect.arrayContaining(['enable', 'enforce', 'activate', 'changePermissions', 'apply'])
    )
  })
})
