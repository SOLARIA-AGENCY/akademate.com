import { createHash } from 'node:crypto'

import { describe, expect, it, vi } from 'vitest'

import {
  createFinanceAdvertisingSourceStagingEvidenceManifest,
  inspectFinanceAdvertisingSourceContract,
  type FinanceAdvertisingSourceInspectionInput,
} from '../../../../../packages/finance/src'
import {
  FINANCE_ADVERTISING_SOURCE_REVIEWED_READINESS_GATE,
  FinanceAdvertisingSourceBindingError,
  createFinanceAdvertisingSourceBindingProposal,
} from '../finance-advertising-source-evidence-binding'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const labels = ['norte', 'santa-cruz', 'sur'] as const

function inspected(label: (typeof labels)[number]): FinanceAdvertisingSourceInspectionInput {
  return {
    tenantId: 'tenant-private',
    legalEntityId: `entity-${label}-private`,
    accountingConnectionId: `accounting-${label}-private`,
    sourceConnectionId: `ads-${label}-private`,
    provider: 'meta-ads',
    externalAccountId: `ad-account-${label}-private`,
    integrationMode: 'read_only',
    connectionStatus: 'active',
    reviewReference: `review://finance/${label}/advertising-source/v1`,
    client: { provider: 'meta-ads', listDailyAdvertisingSpend: vi.fn() },
    campaignMappings: [{ externalId: `external-${label}`, localId: `${label}-campaign` }],
  }
}

function manifest() {
  return createFinanceAdvertisingSourceStagingEvidenceManifest({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label) => {
      const current = inspected(label)
      return {
        tenantId: current.tenantId,
        legalEntityId: current.legalEntityId,
        accountingConnectionId: current.accountingConnectionId,
        advertisingSourceConnectionId: current.sourceConnectionId,
        provider: current.provider,
        externalAccountId: current.externalAccountId,
        integrationMode: current.integrationMode,
        connectionStatus: current.connectionStatus,
        campaignMappings: current.campaignMappings,
        role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
        entityReviewReference: `review://finance/${label}/entity/v1`,
        sourceReviewReference: current.reviewReference,
        ...(label === 'sur'
          ? { pilotReviewReference: 'review://finance/sur/advertising-source-pilot/v1' }
          : {}),
        observation: inspectFinanceAdvertisingSourceContract(current),
      }
    }),
  })
}

function targets(value: ReturnType<typeof manifest>) {
  const reviews = labels.map((label) => `review://finance/${label}/entity/v1`)
  return value.entities.map((entity) => ({
    artifactDigest: entity.artifactDigest,
    entityReviewReference: reviews.find(
      (review) => entity.entityReviewReferenceDigest === sha256(review)
    )!,
  }))
}

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function expectCode(run: () => unknown, code: FinanceAdvertisingSourceBindingError['code']) {
  expect(run).toThrowError(
    expect.objectContaining<Partial<FinanceAdvertisingSourceBindingError>>({ code })
  )
}

describe('finance advertising source evidence binding', () => {
  it('proposes three bindings without invoking or pausing Meta campaigns', () => {
    const source = manifest()
    const proposal = createFinanceAdvertisingSourceBindingProposal({
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
          binding.gate === FINANCE_ADVERTISING_SOURCE_REVIEWED_READINESS_GATE &&
          binding.artifactKind === 'cep_finance_advertising_source_review_evidence'
      )
    ).toBe(true)
  })

  it('rejects forged evidence, another campaign and partial mapping', () => {
    const source = manifest()
    expectCode(
      () =>
        createFinanceAdvertisingSourceBindingProposal({
          manifest: { ...source, artifactDigest: `sha256:${'c'.repeat(64)}` },
          campaignReviewReference,
          readinessReviewReference,
          entities: targets(source),
        }),
      'FINANCE_ADVERTISING_SOURCE_MANIFEST_INVALID'
    )
    expectCode(
      () =>
        createFinanceAdvertisingSourceBindingProposal({
          manifest: source,
          campaignReviewReference: 'review://campaign/other/v1',
          readinessReviewReference,
          entities: targets(source),
        }),
      'FINANCE_ADVERTISING_SOURCE_CAMPAIGN_MISMATCH'
    )
    expectCode(
      () =>
        createFinanceAdvertisingSourceBindingProposal({
          manifest: source,
          campaignReviewReference,
          readinessReviewReference,
          entities: targets(source).slice(1),
        }),
      'FINANCE_ADVERTISING_SOURCE_BINDING_INPUT_INVALID'
    )
  })

  it('exports no provider invocation, pause or mutation operation', async () => {
    const module = await import('../finance-advertising-source-evidence-binding')
    expect(
      Object.keys(module).filter((key) =>
        /invoke|pause|resolveSecret|execute|write|apply|activate|deploy|markVerified/i.test(key)
      )
    ).toEqual([])
  })
})
