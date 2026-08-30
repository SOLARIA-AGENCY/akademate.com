import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG,
  createFinanceReconciliationStagingEvidenceManifest,
  type FinanceReconciliationShadowObservation,
  type FinanceReconciliationStagingEvidenceManifest,
  type FinanceReconciliationStagingEvidenceSample,
} from '../../../../../packages/finance/src'
import { createMultiEntityAccessBaseline } from '../../../../../packages/tenant/src/multi-entity-access-baseline'
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
  FINANCE_RECONCILIATION_ENTITY_READINESS_GATE,
  FinanceReconciliationEvidenceBindingError,
  createFinanceReconciliationEvidenceBindingProposal,
  type FinanceReconciliationEntityBindingTarget,
} from '../finance-reconciliation-evidence-binding'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`

function observation(
  change: Partial<FinanceReconciliationShadowObservation> = {}
): FinanceReconciliationShadowObservation {
  return {
    schemaVersion: 1,
    mode: 'read_only_finance_reconciliation_shadow',
    verdict: 'planned',
    canWrite: false,
    canApply: false,
    metrics: {
      accountingTransactions: 1,
      sourceRecords: 1,
      projectedRecords: 1,
      ignoredRecords: 0,
      blockedRecords: 0,
      projectionIssues: 0,
      reconciliationTransactions: 1,
      proposed: 1,
      unmatched: 0,
      ambiguous: 0,
      conflicted: 0,
    },
    ...change,
  }
}

function sample(label: 'norte' | 'santa-cruz' | 'sur'): FinanceReconciliationStagingEvidenceSample {
  const pilot = label === 'sur'
  return {
    tenantId: 'tenant-private',
    legalEntityId: `entity-${label}-private`,
    accountingConnectionId: `connection-${label}-private`,
    role: pilot ? 'cep_sur_pilot' : 'existing_entity',
    entityReviewReference: `review://finance/${label}/entity/v1`,
    runReviewReference: `review://finance/${label}/run/v1`,
    ...(pilot ? { pilotReviewReference: 'review://finance/sur/pilot/v1' } : {}),
    observation: observation(),
  }
}

function manifest(
  samples: readonly FinanceReconciliationStagingEvidenceSample[] = [
    sample('norte'),
    sample('santa-cruz'),
    sample('sur'),
  ]
): FinanceReconciliationStagingEvidenceManifest {
  return createFinanceReconciliationStagingEvidenceManifest({
    executionEnvironment: 'staging',
    runnerFlag: FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG,
    runnerFlagValue: true,
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples,
  })
}

function targets(
  source: FinanceReconciliationStagingEvidenceManifest
): FinanceReconciliationEntityBindingTarget[] {
  const reviews = [
    'review://finance/norte/entity/v1',
    'review://finance/santa-cruz/entity/v1',
    'review://finance/sur/entity/v1',
  ]
  return source.entities.map((artifact) => {
    const review = reviews.find(
      (candidate) => artifact.entityReviewReferenceDigest === sha256(candidate)
    )
    if (!review) throw new Error('TEST_ENTITY_REVIEW_NOT_FOUND')
    return { artifactDigest: artifact.artifactDigest, entityReviewReference: review }
  })
}

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function completeBundleInput(
  source: FinanceReconciliationStagingEvidenceManifest,
  financeBindings: readonly MultiEntityStagingEvidenceBinding[]
): MultiEntityStagingEvidenceBundleInput {
  const financeByReview = new Map(
    financeBindings.map((binding) => [binding.reviewReference, binding])
  )
  const globalChecks = Object.fromEntries(
    MULTI_ENTITY_GLOBAL_STAGING_GATES.map((gate) => {
      const artifactDigest = sha256(`global:${gate}`)
      return [
        gate,
        {
          status: 'verified',
          evidenceReference: createMultiEntityContentAddressedEvidenceReference(artifactDigest),
        },
      ]
    })
  ) as MultiEntityStagingReadinessInput['globalChecks']
  const entities = (['norte', 'santa-cruz', 'sur'] as const).map((label) => {
    const reviewReference = `review://finance/${label}/entity/v1`
    const financeBinding = financeByReview.get(reviewReference)
    if (!financeBinding) throw new Error('TEST_FINANCE_BINDING_NOT_FOUND')
    return {
      tenantId: 'tenant-private',
      legalEntityId: `entity-${label}-private`,
      accountingConnectionId: `connection-${label}-private`,
      role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
      reviewReference,
      ...(label === 'sur' ? { pilotReviewReference: 'review://finance/sur/pilot/v1' } : {}),
      checks: Object.fromEntries(
        MULTI_ENTITY_ENTITY_STAGING_GATES.map((gate) => {
          const artifactDigest = sha256(`${reviewReference}:${gate}`)
          return [
            gate,
            {
              status: 'verified',
              evidenceReference:
                gate === FINANCE_RECONCILIATION_ENTITY_READINESS_GATE
                  ? financeBinding.evidenceReference
                  : createMultiEntityContentAddressedEvidenceReference(artifactDigest),
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
  for (const entity of readiness.entities) {
    for (const [gate, evidence] of Object.entries(entity.checks)) {
      if (!evidence?.evidenceReference) continue
      if (gate === FINANCE_RECONCILIATION_ENTITY_READINESS_GATE) {
        bindings.push(financeByReview.get(entity.reviewReference)!)
      } else {
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
    sourceDigest: source.sourceDigest,
    targetTenantDigest: source.targetTenantDigest,
    rbacPolicy,
    capturedAccess,
    currentAccess: capturedAccess,
    readiness,
    evidenceBindings: bindings,
  }
}

describe('finance reconciliation evidence binding proposal', () => {
  it('proposes exactly three entity gate bindings without marking them verified', () => {
    const source = manifest()
    const proposal = createFinanceReconciliationEvidenceBindingProposal({
      manifest: source,
      campaignReviewReference,
      readinessReviewReference,
      entities: targets(source),
    })

    expect(proposal).toMatchObject({
      schemaVersion: 1,
      mode: 'manual_entity_staging_evidence_binding_proposal',
      status: 'proposed',
      canBindAutomatically: false,
      canMarkVerified: false,
      canDeploy: false,
      canActivate: false,
      canChangePermissions: false,
    })
    expect(proposal.bindings).toHaveLength(3)
    expect(
      proposal.bindings.every(
        (binding) =>
          binding.scope === 'entity' &&
          binding.gate === FINANCE_RECONCILIATION_ENTITY_READINESS_GATE &&
          binding.campaignReviewReference === campaignReviewReference &&
          binding.sourceDigest === sourceDigest &&
          binding.targetTenantDigest === targetTenantDigest &&
          binding.artifactKind === 'cep_finance_reconciliation_entity_evidence'
      )
    ).toBe(true)
    expect(new Set(proposal.bindings.map(({ reviewReference }) => reviewReference)).size).toBe(3)
    expect(new Set(proposal.bindings.map(({ artifactDigest }) => artifactDigest)).size).toBe(3)
    expect(Object.isFrozen(proposal)).toBe(true)
    expect(Object.isFrozen(proposal.bindings)).toBe(true)
    expect(proposal.bindings.every(Object.isFrozen)).toBe(true)
  })

  it('is deterministic when explicit entity mappings arrive in another order', () => {
    const source = manifest()
    const base = {
      manifest: source,
      campaignReviewReference,
      readinessReviewReference,
    }
    const first = createFinanceReconciliationEvidenceBindingProposal({
      ...base,
      entities: targets(source),
    })
    const second = createFinanceReconciliationEvidenceBindingProposal({
      ...base,
      entities: [...targets(source)].reverse(),
    })

    expect(second).toEqual(first)
  })

  it('supplies the exact three finance bindings accepted by the complete staging bundle', () => {
    const source = manifest()
    const proposal = createFinanceReconciliationEvidenceBindingProposal({
      manifest: source,
      campaignReviewReference,
      readinessReviewReference,
      entities: targets(source),
    })
    const bundle = createMultiEntityStagingEvidenceBundle(
      completeBundleInput(source, proposal.bindings)
    )

    expect(bundle).toMatchObject({
      verdict: 'ready_for_manual_staging_review',
      canDeploy: false,
      canMigrate: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: {
        requiredChecks: 56,
        verifiedChecks: 56,
        evidenceBindings: 56,
        accessBaselineUnchanged: true,
      },
    })
  })

  it.each([
    ['campaign', 'review://campaign/other/staging-v1', readinessReviewReference],
    ['readiness', campaignReviewReference, 'review://staging/readiness/other'],
  ])('rejects a manifest reused for another %s review', (_label, campaign, readiness) => {
    const source = manifest()
    expect(() =>
      createFinanceReconciliationEvidenceBindingProposal({
        manifest: source,
        campaignReviewReference: campaign,
        readinessReviewReference: readiness,
        entities: targets(source),
      })
    ).toThrowError(
      expect.objectContaining<Partial<FinanceReconciliationEvidenceBindingError>>({
        code: 'FINANCE_RECONCILIATION_EVIDENCE_CAMPAIGN_MISMATCH',
      })
    )
  })

  it('rejects a blocked manifest before proposing partial entity bindings', () => {
    const blockedObservation = observation({
      verdict: 'blocked',
      metrics: {
        ...observation().metrics,
        projectedRecords: 0,
        blockedRecords: 1,
        projectionIssues: 1,
        reconciliationTransactions: 0,
        proposed: 0,
      },
    })
    const blockedSur = { ...sample('sur'), observation: blockedObservation }
    const source = manifest([sample('norte'), sample('santa-cruz'), blockedSur])

    expect(() =>
      createFinanceReconciliationEvidenceBindingProposal({
        manifest: source,
        campaignReviewReference,
        readinessReviewReference,
        entities: targets(source),
      })
    ).toThrowError(
      expect.objectContaining<Partial<FinanceReconciliationEvidenceBindingError>>({
        code: 'FINANCE_RECONCILIATION_EVIDENCE_MANIFEST_NOT_ELIGIBLE',
      })
    )
  })

  it.each([
    [
      'unknown artifact',
      (source: FinanceReconciliationStagingEvidenceManifest) => [
        ...targets(source).slice(0, 2),
        {
          artifactDigest: `sha256:${'c'.repeat(64)}`,
          entityReviewReference: 'review://finance/sur/entity/v1',
        },
      ],
    ],
    [
      'wrong entity review',
      (source: FinanceReconciliationStagingEvidenceManifest) => [
        ...targets(source).slice(0, 2),
        { ...targets(source)[2]!, entityReviewReference: 'review://finance/other/entity/v1' },
      ],
    ],
    [
      'duplicate artifact',
      (source: FinanceReconciliationStagingEvidenceManifest) => [
        targets(source)[0]!,
        targets(source)[1]!,
        { ...targets(source)[0]!, entityReviewReference: 'review://finance/sur/entity/v1' },
      ],
    ],
    [
      'duplicate review',
      (source: FinanceReconciliationStagingEvidenceManifest) => [
        targets(source)[0]!,
        targets(source)[1]!,
        {
          ...targets(source)[2]!,
          entityReviewReference: targets(source)[0]!.entityReviewReference,
        },
      ],
    ],
  ])('rejects an invalid one-to-one entity mapping: %s', (_label, change) => {
    const source = manifest()
    expect(() =>
      createFinanceReconciliationEvidenceBindingProposal({
        manifest: source,
        campaignReviewReference,
        readinessReviewReference,
        entities: change(source),
      })
    ).toThrowError(
      expect.objectContaining<Partial<FinanceReconciliationEvidenceBindingError>>({
        code: 'FINANCE_RECONCILIATION_EVIDENCE_ENTITY_MAPPING_INVALID',
      })
    )
  })

  it.each([
    { artifactDigest: `sha256:${'d'.repeat(64)}` },
    { evidenceReference: `evidence://sha256/${'e'.repeat(64)}` },
    { canBindAutomatically: true },
    { entities: [] },
  ])('rejects a forged sealed manifest: %o', (change) => {
    const source = manifest()
    expect(() =>
      createFinanceReconciliationEvidenceBindingProposal({
        manifest: { ...source, ...change } as never,
        campaignReviewReference,
        readinessReviewReference,
        entities: targets(source),
      })
    ).toThrowError(
      expect.objectContaining<Partial<FinanceReconciliationEvidenceBindingError>>({
        code: 'FINANCE_RECONCILIATION_EVIDENCE_MANIFEST_INVALID',
      })
    )
  })

  it('rejects malformed or automation-enriched proposal envelopes', () => {
    const source = manifest()
    for (const change of [
      { entities: targets(source).slice(0, 2) },
      { campaignReviewReference: 'campaign-1' },
      { readinessReviewReference: campaignReviewReference },
      { status: 'verified' },
    ]) {
      expect(() =>
        createFinanceReconciliationEvidenceBindingProposal({
          manifest: source,
          campaignReviewReference,
          readinessReviewReference,
          entities: targets(source),
          ...change,
        } as never)
      ).toThrowError(
        expect.objectContaining<Partial<FinanceReconciliationEvidenceBindingError>>({
          code: 'FINANCE_RECONCILIATION_EVIDENCE_BINDING_INPUT_INVALID',
        })
      )
    }
  })

  it('does not expose financial metrics, scopes, connections or run reviews', () => {
    const source = manifest()
    const serialized = JSON.stringify(
      createFinanceReconciliationEvidenceBindingProposal({
        manifest: source,
        campaignReviewReference,
        readinessReviewReference,
        entities: targets(source),
      })
    )
    for (const privateValue of [
      'tenant-private',
      'entity-norte-private',
      'connection-sur-private',
      'review://finance/sur/run/v1',
      'scopeDigest',
      'observationDigest',
      'accountingTransactions',
    ]) {
      expect(serialized).not.toContain(privateValue)
    }
  })
})
