import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { createMultiEntityAccessBaseline } from '../../../../../packages/tenant/src/multi-entity-access-baseline'
import {
  createNominalPermissionPhaseLockEvidenceArtifact,
  type NominalPermissionPhaseLockEvidenceArtifact,
  type NominalPermissionPhaseLockEvidenceSample,
} from '../../../../../packages/tenant/src/multi-entity-nominal-permission-phase-lock-evidence'
import {
  createNominalPermissionPhaseLock,
  type NominalPermissionLockedPhase,
  type NominalPermissionRequestedAction,
} from '../../../../../packages/tenant/src/multi-entity-nominal-permission-phase-lock'
import {
  MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES,
  createMultiEntityRbacPolicyArtifact,
} from '../../../../../packages/tenant/src/multi-entity-rbac-policy-artifact'
import {
  createMultiEntityContentAddressedEvidenceReference,
  createMultiEntityStagingEvidenceBundle,
  getMultiEntitySpecificEvidenceArtifactKind,
  type MultiEntityStagingEvidenceBinding,
  type MultiEntityStagingEvidenceBundleInput,
} from '../../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'
import {
  MULTI_ENTITY_ENTITY_STAGING_GATES,
  MULTI_ENTITY_GLOBAL_STAGING_GATES,
  type MultiEntityStagingReadinessInput,
} from '../../../../../packages/tenant/src/multi-entity-staging-readiness'
import {
  NOMINAL_PERMISSION_PHASE_LOCK_READINESS_GATE,
  NominalPermissionPhaseLockBindingError,
  createNominalPermissionPhaseLockBindingProposal,
} from '../nominal-permission-phase-lock-evidence-binding'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`

function lockSample(
  phase: NominalPermissionLockedPhase,
  requestedAction: NominalPermissionRequestedAction
): NominalPermissionPhaseLockEvidenceSample {
  const reviewReference = `review://permissions/phase-lock/${phase}/${requestedAction}/v1`
  return {
    phase,
    requestedAction,
    reviewReference,
    observation: createNominalPermissionPhaseLock({
      phase,
      requestedAction,
      authorizationMode: 'disabled',
      accessBaselineVerdict: 'unchanged',
      stagingBundleVerdict: 'ready_for_manual_staging_review',
      requestReviewReference: reviewReference,
    }),
  }
}

function artifact(): NominalPermissionPhaseLockEvidenceArtifact {
  return createNominalPermissionPhaseLockEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: [
      lockSample('implementation', 'generate_nominal_matrix'),
      lockSample('implementation', 'apply_permission_change'),
      lockSample('staging_validation', 'generate_nominal_matrix'),
      lockSample('staging_validation', 'apply_permission_change'),
    ],
  })
}

function completeBundleInput(
  lockBinding: MultiEntityStagingEvidenceBinding
): MultiEntityStagingEvidenceBundleInput {
  const globalChecks = Object.fromEntries(
    MULTI_ENTITY_GLOBAL_STAGING_GATES.map((gate) => {
      const artifactDigest = sha256(`global:${gate}`)
      return [
        gate,
        {
          status: 'verified',
          evidenceReference:
            gate === NOMINAL_PERMISSION_PHASE_LOCK_READINESS_GATE
              ? lockBinding.evidenceReference
              : createMultiEntityContentAddressedEvidenceReference(artifactDigest),
        },
      ]
    })
  ) as MultiEntityStagingReadinessInput['globalChecks']
  const entities = (['norte', 'santa-cruz', 'sur'] as const).map((label) => {
    const reviewReference = `review://entity/${label}/v1`
    return {
      tenantId: 'tenant-private',
      legalEntityId: `entity-${label}-private`,
      accountingConnectionId: `connection-${label}-private`,
      role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
      reviewReference,
      ...(label === 'sur' ? { pilotReviewReference: 'review://entity/sur/pilot/v1' } : {}),
      checks: Object.fromEntries(
        MULTI_ENTITY_ENTITY_STAGING_GATES.map((gate) => {
          const artifactDigest = sha256(`${reviewReference}:${gate}`)
          return [
            gate,
            {
              status: 'verified',
              evidenceReference: createMultiEntityContentAddressedEvidenceReference(artifactDigest),
            },
          ]
        })
      ),
    }
  })
  const readiness: MultiEntityStagingReadinessInput = {
    readinessReviewReference,
    globalChecks,
    entities,
  }
  const bindings: MultiEntityStagingEvidenceBinding[] = []
  for (const [gate, evidence] of Object.entries(readiness.globalChecks)) {
    if (!evidence?.evidenceReference) continue
    if (gate === NOMINAL_PERMISSION_PHASE_LOCK_READINESS_GATE) {
      bindings.push(lockBinding)
    } else {
      bindings.push({
        scope: 'global',
        gate: gate as (typeof MULTI_ENTITY_GLOBAL_STAGING_GATES)[number],
        reviewReference: readinessReviewReference,
        evidenceReference: evidence.evidenceReference,
        campaignReviewReference,
        sourceDigest,
        targetTenantDigest,
        artifactKind: getMultiEntitySpecificEvidenceArtifactKind('global', gate) ?? `cep_${gate}`,
        artifactDigest: sha256(`global:${gate}`),
      })
    }
  }
  for (const entity of readiness.entities) {
    for (const [gate, evidence] of Object.entries(entity.checks)) {
      if (!evidence?.evidenceReference) continue
      bindings.push({
        scope: 'entity',
        gate: gate as (typeof MULTI_ENTITY_ENTITY_STAGING_GATES)[number],
        reviewReference: entity.reviewReference,
        evidenceReference: evidence.evidenceReference,
        campaignReviewReference,
        sourceDigest,
        targetTenantDigest,
        artifactKind: getMultiEntitySpecificEvidenceArtifactKind('entity', gate) ?? `cep_${gate}`,
        artifactDigest: sha256(`${entity.reviewReference}:${gate}`),
      })
    }
  }
  const rbacPolicy = createMultiEntityRbacPolicyArtifact(
    MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES.map((path) => ({
      path,
      content: `export const access = ${JSON.stringify(path)}`,
    }))
  )
  const capturedAccess = createMultiEntityAccessBaseline({
    targetTenantId: 'tenant-private',
    policyDigest: rbacPolicy.policyDigest,
    users: [
      { id: 'current-admin', role: 'admin', tenantId: 'tenant-private', isActive: true },
      { id: 'platform', role: 'superadmin', tenantId: null, isActive: true },
    ],
  })
  return {
    campaignReviewReference,
    sourceDigest,
    targetTenantDigest,
    rbacPolicy,
    capturedAccess,
    currentAccess: capturedAccess,
    readiness,
    evidenceBindings: bindings,
  }
}

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

describe('nominal permission phase lock evidence binding', () => {
  it('proposes the exact global gate while preserving every nominal denial', () => {
    const source = artifact()
    const proposal = createNominalPermissionPhaseLockBindingProposal({
      artifact: source,
      campaignReviewReference,
      readinessReviewReference,
    })

    expect(proposal).toEqual({
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
      binding: {
        scope: 'global',
        gate: NOMINAL_PERMISSION_PHASE_LOCK_READINESS_GATE,
        reviewReference: readinessReviewReference,
        evidenceReference: source.evidenceReference,
        campaignReviewReference,
        sourceDigest,
        targetTenantDigest,
        artifactKind: 'cep_nominal_permission_phase_lock_evidence',
        artifactDigest: source.artifactDigest,
      },
    })
    expect(Object.isFrozen(proposal)).toBe(true)
    expect(Object.isFrozen(proposal.binding)).toBe(true)
  })

  it('supplies the nominal gate binding accepted by the complete 56-check bundle', () => {
    const proposal = createNominalPermissionPhaseLockBindingProposal({
      artifact: artifact(),
      campaignReviewReference,
      readinessReviewReference,
    })
    const bundle = createMultiEntityStagingEvidenceBundle(completeBundleInput(proposal.binding))

    expect(bundle).toMatchObject({
      verdict: 'ready_for_manual_staging_review',
      canDeploy: false,
      canMigrate: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: { requiredChecks: 56, verifiedChecks: 56, evidenceBindings: 56 },
    })
  })

  it.each([
    ['campaign', 'review://campaign/other/v1', readinessReviewReference],
    ['readiness', campaignReviewReference, 'review://staging/readiness/other'],
  ])('rejects an artifact reused for another %s review', (_label, campaign, readiness) => {
    expect(() =>
      createNominalPermissionPhaseLockBindingProposal({
        artifact: artifact(),
        campaignReviewReference: campaign,
        readinessReviewReference: readiness,
      })
    ).toThrowError(
      expect.objectContaining<Partial<NominalPermissionPhaseLockBindingError>>({
        code: 'NOMINAL_PERMISSION_PHASE_LOCK_CAMPAIGN_MISMATCH',
      })
    )
  })

  it.each([
    { artifactDigest: `sha256:${'c'.repeat(64)}` },
    { evidenceReference: `evidence://sha256/${'d'.repeat(64)}` },
    { canGenerateNominalMatrix: true },
    { canApplyPermissionChange: true },
    { canUsePlatformSuperadmin: true },
    { metrics: { ...artifact().metrics, lockedCases: 3 } },
  ])('rejects a forged or weakened artifact: %o', (change) => {
    expect(() =>
      createNominalPermissionPhaseLockBindingProposal({
        artifact: { ...artifact(), ...change } as never,
        campaignReviewReference,
        readinessReviewReference,
      })
    ).toThrowError(
      expect.objectContaining<Partial<NominalPermissionPhaseLockBindingError>>({
        code: 'NOMINAL_PERMISSION_PHASE_LOCK_ARTIFACT_INVALID',
      })
    )
  })

  it('rejects malformed and automation-enriched envelopes', () => {
    for (const change of [
      { campaignReviewReference: 'campaign-1' },
      { readinessReviewReference: campaignReviewReference },
      { status: 'verified' },
      { users: [{ id: 'private-user' }] },
    ]) {
      expect(() =>
        createNominalPermissionPhaseLockBindingProposal({
          artifact: artifact(),
          campaignReviewReference,
          readinessReviewReference,
          ...change,
        } as never)
      ).toThrowError(
        expect.objectContaining<Partial<NominalPermissionPhaseLockBindingError>>({
          code: 'NOMINAL_PERMISSION_PHASE_LOCK_BINDING_INPUT_INVALID',
        })
      )
    }
  })

  it('exports no generation, apply, unlock or permission mutation operation', async () => {
    const module = await import('../nominal-permission-phase-lock-evidence-binding')
    expect(
      Object.keys(module).filter((key) =>
        /generate|apply|unlock|bulkChange|changePermission/i.test(key)
      )
    ).toEqual([])
  })
})
