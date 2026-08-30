import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { createFinanceAccountingConnectionStagingEvidenceManifest } from '../../../../../packages/finance/src'
import {
  FINANCE_ACCOUNTING_CONNECTION_REVIEWED_READINESS_GATE,
  FinanceAccountingConnectionBindingError,
  createFinanceAccountingConnectionBindingProposal,
} from '../finance-accounting-connection-evidence-binding'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const labels = ['norte', 'santa-cruz', 'sur'] as const

function manifest() {
  return createFinanceAccountingConnectionStagingEvidenceManifest({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label) => ({
      tenantId: 'tenant-private',
      legalEntityId: `entity-${label}-private`,
      accountingConnectionId: `connection-${label}-private`,
      provider: 'accounting-provider',
      externalCompanyId: `company-${label}-private`,
      integrationMode: 'read_only',
      connectionStatus: 'active',
      reviewedState: 'configured_not_resolved',
      role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
      entityReviewReference: `review://finance/${label}/entity/v1`,
      connectionReviewReference: `review://finance/${label}/connection/v1`,
      ...(label === 'sur'
        ? { pilotReviewReference: 'review://finance/sur/connection-pilot/v1' }
        : {}),
    })),
  })
}

function targets(source: ReturnType<typeof manifest>) {
  const reviews = labels.map((label) => `review://finance/${label}/entity/v1`)
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

function expectCode(run: () => unknown, code: FinanceAccountingConnectionBindingError['code']) {
  expect(run).toThrowError(
    expect.objectContaining<Partial<FinanceAccountingConnectionBindingError>>({ code })
  )
}

describe('finance accounting connection evidence binding', () => {
  it('proposes three entity connection gates without resolving them', () => {
    const source = manifest()
    const proposal = createFinanceAccountingConnectionBindingProposal({
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
          binding.gate === FINANCE_ACCOUNTING_CONNECTION_REVIEWED_READINESS_GATE &&
          binding.artifactKind === 'cep_finance_accounting_connection_review_evidence'
      )
    ).toBe(true)
  })

  it('rejects a forged manifest, context mismatch and partial mapping', () => {
    const source = manifest()
    expectCode(
      () =>
        createFinanceAccountingConnectionBindingProposal({
          manifest: { ...source, artifactDigest: `sha256:${'c'.repeat(64)}` },
          campaignReviewReference,
          readinessReviewReference,
          entities: targets(source),
        }),
      'FINANCE_ACCOUNTING_CONNECTION_MANIFEST_INVALID'
    )
    expectCode(
      () =>
        createFinanceAccountingConnectionBindingProposal({
          manifest: source,
          campaignReviewReference: 'review://campaign/other/v1',
          readinessReviewReference,
          entities: targets(source),
        }),
      'FINANCE_ACCOUNTING_CONNECTION_CAMPAIGN_MISMATCH'
    )
    expectCode(
      () =>
        createFinanceAccountingConnectionBindingProposal({
          manifest: source,
          campaignReviewReference,
          readinessReviewReference,
          entities: targets(source).slice(1),
        }),
      'FINANCE_ACCOUNTING_CONNECTION_BINDING_INPUT_INVALID'
    )
  })

  it('rejects reassigned reviews and exports no resolver or executor', async () => {
    const source = manifest()
    const entityTargets = targets(source)
    expectCode(
      () =>
        createFinanceAccountingConnectionBindingProposal({
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
      'FINANCE_ACCOUNTING_CONNECTION_MAPPING_INVALID'
    )
    const module = await import('../finance-accounting-connection-evidence-binding')
    expect(
      Object.keys(module).filter((key) =>
        /resolveSecret|connectProvider|execute|apply|activate|deploy|markVerified|changePermission/i.test(
          key
        )
      )
    ).toEqual([])
  })
})
