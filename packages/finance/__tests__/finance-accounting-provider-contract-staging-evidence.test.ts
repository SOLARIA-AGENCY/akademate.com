import { describe, expect, it, vi } from 'vitest'

import {
  assertFinanceAccountingProviderContractStagingEvidenceManifest,
  createFinanceAccountingProviderContractStagingEvidenceManifest,
  inspectFinanceAccountingProviderContract,
  serializeFinanceAccountingProviderContractStagingEvidenceManifest,
  type AccountingConnectionScope,
  type FinanceAccountingProviderContractObservation,
  type FinanceAccountingProviderContractStagingEvidenceInput,
  type FinanceAccountingProviderContractStagingEvidenceSample,
} from '../src'

const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const tenantId = '018f47a2-4a7b-7d01-9a2f-9d4ab1c25e10'
const ids = {
  norte: {
    legalEntityId: '018f47a2-4a7b-7d02-8a2f-9d4ab1c25e11',
    connectionId: '018f47a2-4a7b-7d03-aa2f-9d4ab1c25e12',
  },
  'santa-cruz': {
    legalEntityId: '018f47a2-4a7b-7d02-8a2f-9d4ab1c25e21',
    connectionId: '018f47a2-4a7b-7d03-aa2f-9d4ab1c25e22',
  },
  sur: {
    legalEntityId: '018f47a2-4a7b-7d02-8a2f-9d4ab1c25e31',
    connectionId: '018f47a2-4a7b-7d03-aa2f-9d4ab1c25e32',
  },
} as const

function scope(label: keyof typeof ids): AccountingConnectionScope {
  return {
    tenantId,
    legalEntityId: ids[label].legalEntityId,
    connectionId: ids[label].connectionId,
    provider: 'accounting-provider',
    externalCompanyId: `company-${label}-private`,
    integrationMode: 'read_only',
    connectionStatus: 'active',
  }
}

function sample(
  label: keyof typeof ids,
  change: Partial<FinanceAccountingProviderContractStagingEvidenceSample> = {}
): FinanceAccountingProviderContractStagingEvidenceSample {
  const currentScope = scope(label)
  const pilot = label === 'sur'
  return {
    tenantId: currentScope.tenantId,
    legalEntityId: currentScope.legalEntityId,
    accountingConnectionId: currentScope.connectionId,
    provider: currentScope.provider,
    externalCompanyId: currentScope.externalCompanyId,
    role: pilot ? 'cep_sur_pilot' : 'existing_entity',
    entityReviewReference: `review://finance/${label}/entity/v1`,
    contractReviewReference: `review://finance/${label}/provider-contract/v1`,
    ...(pilot ? { pilotReviewReference: 'review://finance/sur/provider-pilot/v1' } : {}),
    observation: inspectFinanceAccountingProviderContract(currentScope, {
      provider: currentScope.provider,
      listTransactions: vi.fn(),
    }),
    ...change,
  }
}

function input(
  change: Partial<FinanceAccountingProviderContractStagingEvidenceInput> = {}
): FinanceAccountingProviderContractStagingEvidenceInput {
  return {
    reviewEnvironment: 'staging',
    campaignReviewReference: 'review://campaign/cep-multi-entity/staging-v1',
    readinessReviewReference: 'review://staging/readiness/v1',
    sourceDigest,
    targetTenantDigest,
    samples: [sample('norte'), sample('santa-cruz'), sample('sur')],
    ...change,
  }
}

describe('finance accounting provider contract staging evidence', () => {
  it('inspects the exact read client shape without invoking the provider', () => {
    const currentScope = scope('sur')
    const listTransactions = vi.fn()
    const observation = inspectFinanceAccountingProviderContract(currentScope, {
      provider: currentScope.provider,
      listTransactions,
    })

    expect(listTransactions).not.toHaveBeenCalled()
    expect(observation).toMatchObject({
      mode: 'read_only_accounting_provider_contract_inspection',
      verdict: 'contract_satisfied',
      contractVersion: 1,
      operations: ['list_transactions'],
      pagination: {
        mode: 'cursor',
        minimumPageSize: 1,
        maximumPageSize: 500,
        maximumPages: 1000,
        cycleDetectionRequired: true,
      },
      canReadTransactions: true,
      canInvokeProvider: false,
      canWriteProvider: false,
      canExposeCredential: false,
      canPersistRawPayload: false,
    })
  })

  it('rejects a mismatched provider and extra write operation without I/O', () => {
    const currentScope = scope('sur')
    const listTransactions = vi.fn()
    expect(() =>
      inspectFinanceAccountingProviderContract(currentScope, {
        provider: 'other-provider',
        listTransactions,
      })
    ).toThrow('FINANCE_ACCOUNTING_PROVIDER_CONTRACT_STAGING_EVIDENCE_INVALID')
    expect(() =>
      inspectFinanceAccountingProviderContract(currentScope, {
        provider: currentScope.provider,
        listTransactions,
        createInvoice: vi.fn(),
      } as never)
    ).toThrow('FINANCE_ACCOUNTING_PROVIDER_CONTRACT_STAGING_EVIDENCE_INVALID')
    expect(listTransactions).not.toHaveBeenCalled()
  })

  it('seals three scope-bound contracts without provider invocation authority', () => {
    const manifest = createFinanceAccountingProviderContractStagingEvidenceManifest(input())

    expect(manifest).toMatchObject({
      kind: 'cep_finance_accounting_provider_contract_staging_evidence',
      mode: 'three_entity_non_invoking_provider_contract_review',
      verdict: 'eligible_for_manual_staging_binding',
      canInvokeProvider: false,
      canResolveSecret: false,
      canBindAutomatically: false,
      canMarkVerified: false,
      canDeploy: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: {
        expectedEntities: 3,
        reviewedContracts: 3,
        readOnlyContracts: 3,
        pilotEntities: 1,
        providerInvocations: 0,
        providerWriteOperations: 0,
      },
    })
    expect(new Set(manifest.entities.map(({ scopeDigest }) => scopeDigest)).size).toBe(3)
    expect(
      new Set(
        manifest.entities.map(({ providerCompanyBindingDigest }) => providerCompanyBindingDigest)
      ).size
    ).toBe(3)
    expect(() =>
      assertFinanceAccountingProviderContractStagingEvidenceManifest(manifest)
    ).not.toThrow()
  })

  it('is deterministic and redacts provider, company, scope and reviews', () => {
    const source = input()
    const first = serializeFinanceAccountingProviderContractStagingEvidenceManifest(source)
    const second = serializeFinanceAccountingProviderContractStagingEvidenceManifest({
      ...source,
      samples: [...source.samples].reverse(),
    })

    expect(second).toBe(first)
    for (const privateValue of [
      tenantId,
      ids.norte.legalEntityId,
      ids.sur.connectionId,
      'accounting-provider',
      'company-norte-private',
      'review://',
    ]) {
      expect(first).not.toContain(privateValue)
    }
  })

  it.each([
    ['production', { reviewEnvironment: 'production' }],
    ['same digests', { targetTenantDigest: sourceDigest }],
    ['missing entity', { samples: [sample('norte'), sample('sur')] }],
  ])('rejects invalid envelope: %s', (_label, change) => {
    expect(() =>
      createFinanceAccountingProviderContractStagingEvidenceManifest(input(change as never))
    ).toThrow('FINANCE_ACCOUNTING_PROVIDER_CONTRACT_STAGING_EVIDENCE_INVALID')
  })

  it('rejects scope, provider-company and observation substitution', () => {
    const norte = sample('norte')
    expect(() =>
      createFinanceAccountingProviderContractStagingEvidenceManifest(
        input({
          samples: [
            { ...norte, accountingConnectionId: ids.sur.connectionId },
            sample('santa-cruz'),
            sample('sur'),
          ],
        })
      )
    ).toThrow('FINANCE_ACCOUNTING_PROVIDER_CONTRACT_STAGING_EVIDENCE_INVALID')
    expect(() =>
      createFinanceAccountingProviderContractStagingEvidenceManifest(
        input({
          samples: [
            sample('norte'),
            sample('santa-cruz', {
              provider: norte.provider,
              externalCompanyId: norte.externalCompanyId,
            }),
            sample('sur'),
          ],
        })
      )
    ).toThrow('FINANCE_ACCOUNTING_PROVIDER_CONTRACT_STAGING_EVIDENCE_INVALID')
  })

  it.each([
    ['write capability', { canWriteProvider: true }],
    ['provider invocation', { canInvokeProvider: true }],
    ['credential exposure', { canExposeCredential: true }],
    ['raw payload', { canPersistRawPayload: true }],
    ['write operation', { operations: ['list_transactions', 'create_invoice'] }],
    [
      'unbounded pages',
      { pagination: { ...sample('norte').observation.pagination, maximumPages: 9999 } },
    ],
  ])('rejects forged contract observation: %s', (_label, change) => {
    const norte = sample('norte')
    expect(() =>
      createFinanceAccountingProviderContractStagingEvidenceManifest(
        input({
          samples: [
            {
              ...norte,
              observation: {
                ...norte.observation,
                ...change,
              } as FinanceAccountingProviderContractObservation,
            },
            sample('santa-cruz'),
            sample('sur'),
          ],
        })
      )
    ).toThrow('FINANCE_ACCOUNTING_PROVIDER_CONTRACT_STAGING_EVIDENCE_INVALID')
  })

  it.each([
    [
      'manifest digest',
      (value: object) => ({ ...value, artifactDigest: `sha256:${'c'.repeat(64)}` }),
    ],
    ['invoke provider', (value: object) => ({ ...value, canInvokeProvider: true })],
    [
      'entity observation',
      (
        value: ReturnType<typeof createFinanceAccountingProviderContractStagingEvidenceManifest>
      ) => ({
        ...value,
        entities: [
          { ...value.entities[0]!, observationDigest: `sha256:${'d'.repeat(64)}` },
          ...value.entities.slice(1),
        ],
      }),
    ],
  ])('rejects forged sealed evidence: %s', (_label, forge) => {
    const manifest = createFinanceAccountingProviderContractStagingEvidenceManifest(input())
    expect(() =>
      assertFinanceAccountingProviderContractStagingEvidenceManifest(forge(manifest) as never)
    ).toThrow('FINANCE_ACCOUNTING_PROVIDER_CONTRACT_STAGING_EVIDENCE_INVALID')
  })

  it('exports no provider invocation, secret resolution, binding or write operation', async () => {
    const module = await import('../src/accounting-provider-contract-staging-evidence')
    expect(
      Object.keys(module).filter((key) =>
        /invokeProvider|resolveSecret|execute|apply|activate|deploy|bind|writeProvider/i.test(key)
      )
    ).toEqual([])
  })
})
