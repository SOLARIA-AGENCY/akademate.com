import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  FINANCE_ISOLATION_AUDIT_FLAG,
  createFinanceEntityIsolationNegativeStagingEvidenceManifest,
  createFinanceIsolationScopeDigest,
  type FinanceEntityIsolationNegativeAuditObservation,
} from '../../../../../packages/finance/src'
import {
  FINANCE_ENTITY_ISOLATION_NEGATIVE_READINESS_GATE,
  FinanceEntityIsolationNegativeBindingError,
  createFinanceEntityIsolationNegativeBindingProposal,
} from '../finance-entity-isolation-negative-evidence-binding'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const labels = ['norte', 'santa-cruz', 'sur'] as const
const roles = [
  'cross_scope_rejected',
  'payment_relationship_rejected',
  'advertising_relationship_rejected',
] as const

function observation(label: string): FinanceEntityIsolationNegativeAuditObservation {
  return {
    schemaVersion: 1,
    mode: 'three_case_entity_finance_isolation_negative_audit',
    scopeDigest: createFinanceIsolationScopeDigest({
      tenantId: 'tenant-private',
      legalEntityId: `entity-${label}-private`,
      connectionId: `connection-${label}-private`,
    }),
    verdict: 'all_breaches_rejected',
    canWrite: false,
    canApply: false,
    metrics: {
      expectedCases: 3,
      evaluatedCases: 3,
      rejectedCases: 3,
      gapCases: 0,
      isolationBreaches: 3,
    },
    cases: [...roles]
      .sort()
      .map((role) => ({ role, verdict: 'breach_detected' as const, isolationBreaches: 1 })),
  }
}

function manifest() {
  return createFinanceEntityIsolationNegativeStagingEvidenceManifest({
    executionEnvironment: 'staging',
    runnerFlag: FINANCE_ISOLATION_AUDIT_FLAG,
    runnerFlagValue: true,
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label) => ({
      tenantId: 'tenant-private',
      legalEntityId: `entity-${label}-private`,
      accountingConnectionId: `connection-${label}-private`,
      role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
      entityReviewReference: `review://finance/isolation/${label}/entity/v1`,
      ...(label === 'sur'
        ? { pilotReviewReference: 'review://finance/isolation/sur/pilot/v1' }
        : {}),
      caseReviews: roles.map((role) => ({
        role,
        runReviewReference: `review://finance/isolation/${label}/${role}/v1`,
      })),
      observation: observation(label),
    })),
  })
}

function targets(source: ReturnType<typeof manifest>) {
  const reviews = labels.map((label) => `review://finance/isolation/${label}/entity/v1`)
  return source.entities.map((entity) => ({
    artifactDigest: entity.artifactDigest,
    entityReviewReference: reviews.find(
      (review) => entity.entityReviewReferenceDigest === sha256(review)
    )!,
  }))
}

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function expectCode(run: () => unknown, code: FinanceEntityIsolationNegativeBindingError['code']) {
  expect(run).toThrowError(
    expect.objectContaining<Partial<FinanceEntityIsolationNegativeBindingError>>({ code })
  )
}

describe('finance entity isolation negative evidence binding', () => {
  it('proposes exactly three entity bindings without marking them verified', () => {
    const source = manifest()
    const proposal = createFinanceEntityIsolationNegativeBindingProposal({
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
          binding.gate === FINANCE_ENTITY_ISOLATION_NEGATIVE_READINESS_GATE &&
          binding.artifactKind === 'cep_finance_entity_isolation_negative_evidence'
      )
    ).toBe(true)
  })

  it('rejects a forged manifest, context mismatch and partial mapping', () => {
    const source = manifest()
    expectCode(
      () =>
        createFinanceEntityIsolationNegativeBindingProposal({
          manifest: { ...source, artifactDigest: `sha256:${'c'.repeat(64)}` },
          campaignReviewReference,
          readinessReviewReference,
          entities: targets(source),
        }),
      'FINANCE_ENTITY_ISOLATION_NEGATIVE_MANIFEST_INVALID'
    )
    expectCode(
      () =>
        createFinanceEntityIsolationNegativeBindingProposal({
          manifest: source,
          campaignReviewReference: 'review://campaign/other/v1',
          readinessReviewReference,
          entities: targets(source),
        }),
      'FINANCE_ENTITY_ISOLATION_NEGATIVE_CAMPAIGN_MISMATCH'
    )
    expectCode(
      () =>
        createFinanceEntityIsolationNegativeBindingProposal({
          manifest: source,
          campaignReviewReference,
          readinessReviewReference,
          entities: targets(source).slice(1),
        }),
      'FINANCE_ENTITY_ISOLATION_NEGATIVE_BINDING_INPUT_INVALID'
    )
  })

  it('rejects reassigned entity reviews and exports no executor', async () => {
    const source = manifest()
    const entityTargets = targets(source)
    expectCode(
      () =>
        createFinanceEntityIsolationNegativeBindingProposal({
          manifest: source,
          campaignReviewReference,
          readinessReviewReference,
          entities: [
            {
              ...entityTargets[0]!,
              entityReviewReference: entityTargets[1]!.entityReviewReference,
            },
            entityTargets[1]!,
            entityTargets[2]!,
          ],
        }),
      'FINANCE_ENTITY_ISOLATION_NEGATIVE_MAPPING_INVALID'
    )
    const module = await import('../finance-entity-isolation-negative-evidence-binding')
    expect(
      Object.keys(module).filter((key) =>
        /execute|apply|activate|deploy|markVerified|changePermission/i.test(key)
      )
    ).toEqual([])
  })
})
