import { createHash } from 'node:crypto'

import { describe, expect, it, vi } from 'vitest'

import {
  createFinanceAccountingProviderContractStagingEvidenceManifest,
  inspectFinanceAccountingProviderContract,
  type AccountingConnectionScope,
} from '../../../../../packages/finance/src'
import {
  FINANCE_ACCOUNTING_PROVIDER_CONTRACT_READINESS_GATE,
  FinanceAccountingProviderContractBindingError,
  createFinanceAccountingProviderContractBindingProposal,
} from '../finance-accounting-provider-contract-evidence-binding'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const labels = ['norte', 'santa-cruz', 'sur'] as const

function scope(index: number, label: string): AccountingConnectionScope {
  return {
    tenantId: '018f47a2-4a7b-7d01-9a2f-9d4ab1c25e10',
    legalEntityId: `018f47a2-4a7b-7d02-8a2f-9d4ab1c25e${index}1`,
    connectionId: `018f47a2-4a7b-7d03-aa2f-9d4ab1c25e${index}2`,
    provider: 'accounting-provider',
    externalCompanyId: `company-${label}-private`,
    integrationMode: 'read_only',
    connectionStatus: 'active',
  }
}

function manifest() {
  return createFinanceAccountingProviderContractStagingEvidenceManifest({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label, index) => {
      const current = scope(index + 1, label)
      return {
        tenantId: current.tenantId,
        legalEntityId: current.legalEntityId,
        accountingConnectionId: current.connectionId,
        provider: current.provider,
        externalCompanyId: current.externalCompanyId,
        role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
        entityReviewReference: `review://finance/${label}/entity/v1`,
        contractReviewReference: `review://finance/${label}/provider-contract/v1`,
        ...(label === 'sur'
          ? { pilotReviewReference: 'review://finance/sur/provider-pilot/v1' }
          : {}),
        observation: inspectFinanceAccountingProviderContract(current, {
          provider: current.provider,
          listTransactions: vi.fn(),
        }),
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

function expectCode(
  run: () => unknown,
  code: FinanceAccountingProviderContractBindingError['code']
) {
  expect(run).toThrowError(
    expect.objectContaining<Partial<FinanceAccountingProviderContractBindingError>>({ code })
  )
}

describe('finance accounting provider contract evidence binding', () => {
  it('proposes three entity bindings without invoking providers', () => {
    const source = manifest()
    const proposal = createFinanceAccountingProviderContractBindingProposal({
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
          binding.gate === FINANCE_ACCOUNTING_PROVIDER_CONTRACT_READINESS_GATE &&
          binding.artifactKind === 'cep_finance_accounting_provider_contract_evidence'
      )
    ).toBe(true)
  })

  it('rejects forged evidence, context mismatch and partial mapping', () => {
    const source = manifest()
    expectCode(
      () =>
        createFinanceAccountingProviderContractBindingProposal({
          manifest: { ...source, artifactDigest: `sha256:${'c'.repeat(64)}` },
          campaignReviewReference,
          readinessReviewReference,
          entities: targets(source),
        }),
      'FINANCE_ACCOUNTING_PROVIDER_CONTRACT_MANIFEST_INVALID'
    )
    expectCode(
      () =>
        createFinanceAccountingProviderContractBindingProposal({
          manifest: source,
          campaignReviewReference: 'review://campaign/other/v1',
          readinessReviewReference,
          entities: targets(source),
        }),
      'FINANCE_ACCOUNTING_PROVIDER_CONTRACT_CAMPAIGN_MISMATCH'
    )
    expectCode(
      () =>
        createFinanceAccountingProviderContractBindingProposal({
          manifest: source,
          campaignReviewReference,
          readinessReviewReference,
          entities: targets(source).slice(1),
        }),
      'FINANCE_ACCOUNTING_PROVIDER_CONTRACT_BINDING_INPUT_INVALID'
    )
  })

  it('exports no provider invocation, secret or mutation operation', async () => {
    const module = await import('../finance-accounting-provider-contract-evidence-binding')
    expect(
      Object.keys(module).filter((key) =>
        /invokeProvider|resolveSecret|execute|apply|activate|deploy|markVerified/i.test(key)
      )
    ).toEqual([])
  })
})
