import { createHash } from 'node:crypto'

import { describe, expect, it, vi } from 'vitest'

import {
  createFinancePaymentSourceStagingEvidenceManifest,
  inspectFinancePaymentSourceContract,
  type FinancePaymentSourceInspectionInput,
} from '../../../../../packages/finance/src'
import {
  FINANCE_PAYMENT_SOURCE_REVIEWED_READINESS_GATE,
  FinancePaymentSourceBindingError,
  createFinancePaymentSourceBindingProposal,
} from '../finance-payment-source-evidence-binding'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const labels = ['norte', 'santa-cruz', 'sur'] as const

function inspectedSource(label: (typeof labels)[number]): FinancePaymentSourceInspectionInput {
  return {
    tenantId: 'tenant-private',
    legalEntityId: `entity-${label}-private`,
    accountingConnectionId: `accounting-${label}-private`,
    sourceConnectionId: `payments-${label}-private`,
    provider: 'payments-provider',
    externalAccountId: `payments-account-${label}-private`,
    integrationMode: 'read_only',
    connectionStatus: 'active',
    reviewReference: `review://finance/${label}/payment-source/v1`,
    client: { provider: 'payments-provider', listPaymentEvents: vi.fn() },
    enrollmentMappings: [{ externalId: `external-${label}-private`, localId: `${label}-101` }],
  }
}

function manifest() {
  return createFinancePaymentSourceStagingEvidenceManifest({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label) => {
      const current = inspectedSource(label)
      return {
        tenantId: current.tenantId,
        legalEntityId: current.legalEntityId,
        accountingConnectionId: current.accountingConnectionId,
        paymentSourceConnectionId: current.sourceConnectionId,
        provider: current.provider,
        externalAccountId: current.externalAccountId,
        integrationMode: current.integrationMode,
        connectionStatus: current.connectionStatus,
        enrollmentMappings: current.enrollmentMappings,
        role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
        entityReviewReference: `review://finance/${label}/entity/v1`,
        sourceReviewReference: current.reviewReference,
        ...(label === 'sur'
          ? { pilotReviewReference: 'review://finance/sur/payment-source-pilot/v1' }
          : {}),
        observation: inspectFinancePaymentSourceContract(current),
      }
    }),
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

function expectCode(run: () => unknown, code: FinancePaymentSourceBindingError['code']) {
  expect(run).toThrowError(
    expect.objectContaining<Partial<FinancePaymentSourceBindingError>>({ code })
  )
}

describe('finance payment source evidence binding', () => {
  it('proposes three entity bindings without invoking providers', () => {
    const source = manifest()
    const proposal = createFinancePaymentSourceBindingProposal({
      manifest: source,
      campaignReviewReference,
      readinessReviewReference,
      entities: targets(source),
    })
    expect(proposal).toMatchObject({
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
          binding.gate === FINANCE_PAYMENT_SOURCE_REVIEWED_READINESS_GATE &&
          binding.artifactKind === 'cep_finance_payment_source_review_evidence'
      )
    ).toBe(true)
  })

  it('rejects forged evidence, context mismatch and partial mapping', () => {
    const source = manifest()
    expectCode(
      () =>
        createFinancePaymentSourceBindingProposal({
          manifest: { ...source, artifactDigest: `sha256:${'c'.repeat(64)}` },
          campaignReviewReference,
          readinessReviewReference,
          entities: targets(source),
        }),
      'FINANCE_PAYMENT_SOURCE_MANIFEST_INVALID'
    )
    expectCode(
      () =>
        createFinancePaymentSourceBindingProposal({
          manifest: source,
          campaignReviewReference: 'review://campaign/other/v1',
          readinessReviewReference,
          entities: targets(source),
        }),
      'FINANCE_PAYMENT_SOURCE_CAMPAIGN_MISMATCH'
    )
    expectCode(
      () =>
        createFinancePaymentSourceBindingProposal({
          manifest: source,
          campaignReviewReference,
          readinessReviewReference,
          entities: targets(source).slice(1),
        }),
      'FINANCE_PAYMENT_SOURCE_BINDING_INPUT_INVALID'
    )
  })

  it('exports no provider invocation, secret or mutation operation', async () => {
    const module = await import('../finance-payment-source-evidence-binding')
    expect(
      Object.keys(module).filter((key) =>
        /invokeProvider|resolveSecret|execute|apply|activate|deploy|markVerified/i.test(key)
      )
    ).toEqual([])
  })
})
