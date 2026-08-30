import { describe, expect, it } from 'vitest'

import {
  FINANCE_ISOLATION_AUDIT_FLAG,
  createFinanceIsolationStagingEvidenceManifest,
  type FinanceIsolationAuditObservation,
  type FinanceIsolationEvidenceCaseRole,
} from '../../../../../packages/finance/src'
import {
  FINANCE_ISOLATION_STAGING_READINESS_GATE,
  FinanceIsolationEvidenceBindingError,
  createFinanceIsolationEvidenceBindingProposal,
} from '../finance-isolation-evidence-binding'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const roles = [
  'three_entity_isolated',
  'cross_scope_rejected',
  'payment_relationship_rejected',
  'advertising_relationship_rejected',
] as const

function observation(role: FinanceIsolationEvidenceCaseRole): FinanceIsolationAuditObservation {
  const isolated = role === 'three_entity_isolated'
  const negativeIndex = roles.indexOf(role)
  return {
    schemaVersion: 1,
    mode: 'three_entity_finance_isolation_audit',
    verdict: isolated ? 'isolated' : 'breach_detected',
    canWrite: false,
    canApply: false,
    metrics: {
      expectedEntities: 3,
      evaluatedEntities: isolated ? 3 : negativeIndex,
      evaluatedSurfaces: isolated ? 15 : negativeIndex * 5,
      isolationBreaches: isolated ? 0 : 1,
    },
  }
}

function manifest() {
  return createFinanceIsolationStagingEvidenceManifest({
    executionEnvironment: 'staging',
    runnerFlag: FINANCE_ISOLATION_AUDIT_FLAG,
    runnerFlagValue: true,
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: roles.map((role) => ({
      role,
      runReviewReference: `review://finance/isolation/${role}/v1`,
      observation: observation(role),
    })),
  })
}

function expectCode(run: () => unknown, code: FinanceIsolationEvidenceBindingError['code']) {
  expect(run).toThrowError(
    expect.objectContaining<Partial<FinanceIsolationEvidenceBindingError>>({ code })
  )
}

describe('finance isolation evidence binding proposal', () => {
  it('proposes the exact global gate without granting verification or activation', () => {
    const source = manifest()
    const proposal = createFinanceIsolationEvidenceBindingProposal({
      manifest: source,
      campaignReviewReference,
      readinessReviewReference,
    })

    expect(proposal).toEqual({
      schemaVersion: 1,
      mode: 'manual_staging_evidence_binding_proposal',
      status: 'proposed',
      canBindAutomatically: false,
      canMarkVerified: false,
      canDeploy: false,
      canActivate: false,
      canChangePermissions: false,
      binding: {
        scope: 'global',
        gate: FINANCE_ISOLATION_STAGING_READINESS_GATE,
        reviewReference: readinessReviewReference,
        evidenceReference: source.evidenceReference,
        campaignReviewReference,
        sourceDigest,
        targetTenantDigest,
        artifactKind: source.kind,
        artifactDigest: source.artifactDigest,
      },
    })
  })

  it('rejects a forged artifact and mismatched campaign context', () => {
    const source = manifest()
    expectCode(
      () =>
        createFinanceIsolationEvidenceBindingProposal({
          manifest: { ...source, artifactDigest: `sha256:${'c'.repeat(64)}` },
          campaignReviewReference,
          readinessReviewReference,
        }),
      'FINANCE_ISOLATION_EVIDENCE_MANIFEST_INVALID'
    )
    expectCode(
      () =>
        createFinanceIsolationEvidenceBindingProposal({
          manifest: source,
          campaignReviewReference: 'review://campaign/other/v1',
          readinessReviewReference,
        }),
      'FINANCE_ISOLATION_EVIDENCE_CAMPAIGN_MISMATCH'
    )
  })

  it('rejects extra input fields and exports no binding executor', async () => {
    expectCode(
      () =>
        createFinanceIsolationEvidenceBindingProposal({
          manifest: manifest(),
          campaignReviewReference,
          readinessReviewReference,
          markVerified: true,
        } as never),
      'FINANCE_ISOLATION_EVIDENCE_BINDING_INPUT_INVALID'
    )
    const module = await import('../finance-isolation-evidence-binding')
    expect(
      Object.keys(module).filter((key) =>
        /execute|apply|activate|markVerified|changePermission/i.test(key)
      )
    ).toEqual([])
  })
})
