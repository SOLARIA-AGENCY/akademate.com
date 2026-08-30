import { describe, expect, it, vi } from 'vitest'

import {
  assertFinancePaymentSourceStagingEvidenceManifest,
  createFinancePaymentSourceStagingEvidenceManifest,
  inspectFinancePaymentSourceContract,
  serializeFinancePaymentSourceStagingEvidenceManifest,
  type FinancePaymentSourceInspectionInput,
} from '../src'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const labels = ['norte', 'santa-cruz', 'sur'] as const

function source(
  label: (typeof labels)[number],
  overrides: Partial<FinancePaymentSourceInspectionInput> = {}
): FinancePaymentSourceInspectionInput {
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
    client: {
      provider: 'payments-provider',
      listPaymentEvents: vi.fn(),
    },
    enrollmentMappings: [
      { externalId: `external-enrollment-${label}-private`, localId: `${label}-101-private` },
    ],
    ...overrides,
  }
}

function input() {
  return {
    reviewEnvironment: 'staging' as const,
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label) => {
      const current = source(label)
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
  }
}

describe('finance payment source staging evidence', () => {
  it('inspects the minimal read-only client and mappings without invoking the provider', () => {
    const current = source('sur')
    const observation = inspectFinancePaymentSourceContract(current)

    expect(current.client.listPaymentEvents).not.toHaveBeenCalled()
    expect(observation).toMatchObject({
      schemaVersion: 1,
      mode: 'read_only_payment_source_contract_inspection',
      verdict: 'contract_satisfied',
      hasReviewedEnrollmentMappings: true,
      operations: ['list_payment_events'],
      pagination: {
        mode: 'cursor',
        minimumPageSize: 1,
        maximumPageSize: 1000,
        maximumPages: 1000,
        cycleDetectionRequired: true,
      },
      canReadPaymentEvents: true,
      canInvokeProvider: false,
      canWriteProvider: false,
      canExposeCredential: false,
      canPersistRawPayload: false,
    })
    expect(JSON.stringify(observation)).not.toContain('external-enrollment-sur-private')
    expect(JSON.stringify(observation)).not.toContain('payments-account-sur-private')
    expect(Object.isFrozen(observation)).toBe(true)
  })

  it('rejects a wider client, provider mismatch and ambiguous enrollment mapping', () => {
    const wider = source('sur')
    expect(() =>
      inspectFinancePaymentSourceContract({
        ...wider,
        client: { ...wider.client, writePayment: vi.fn() } as never,
      })
    ).toThrow('FINANCE_PAYMENT_SOURCE_STAGING_EVIDENCE_INVALID')

    expect(() =>
      inspectFinancePaymentSourceContract({
        ...source('sur'),
        client: { provider: 'other-provider', listPaymentEvents: vi.fn() },
      })
    ).toThrow('FINANCE_PAYMENT_SOURCE_STAGING_EVIDENCE_INVALID')

    expect(() =>
      inspectFinancePaymentSourceContract({
        ...source('sur'),
        enrollmentMappings: [
          { externalId: 'external-one', localId: 101 },
          { externalId: 'external-two', localId: 101 },
        ],
      })
    ).toThrow('FINANCE_PAYMENT_SOURCE_STAGING_EVIDENCE_INVALID')
  })

  it('seals exactly three isolated sources with one CEP Sur pilot and no readable IDs', () => {
    const manifest = createFinancePaymentSourceStagingEvidenceManifest(input())
    expect(manifest).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_finance_payment_source_staging_evidence',
      mode: 'three_entity_non_invoking_payment_source_review',
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
        reviewedSources: 3,
        activeSources: 3,
        readOnlySources: 3,
        sourcesWithReviewedEnrollmentMappings: 3,
        pilotEntities: 1,
        providerInvocations: 0,
        providerWriteOperations: 0,
      },
    })
    expect(manifest.entities).toHaveLength(3)
    expect(
      new Set(manifest.entities.map(({ accountingScopeDigest }) => accountingScopeDigest)).size
    ).toBe(3)
    expect(
      new Set(manifest.entities.map(({ paymentSourceScopeDigest }) => paymentSourceScopeDigest))
        .size
    ).toBe(3)
    expect(manifest.entities.filter(({ role }) => role === 'cep_sur_pilot')).toHaveLength(1)
    expect(JSON.stringify(manifest)).not.toMatch(
      /tenant-private|entity-sur-private|payments-sur-private|payments-account-sur-private|external-enrollment/
    )
    expect(() => assertFinancePaymentSourceStagingEvidenceManifest(manifest)).not.toThrow()
  })

  it('is deterministic under sample reorder and relationship reorder', () => {
    const first = input()
    const reordered = {
      ...first,
      samples: [...first.samples]
        .reverse()
        .map((sample) => ({ ...sample, observation: { ...sample.observation } })),
    }
    expect(serializeFinancePaymentSourceStagingEvidenceManifest(reordered)).toBe(
      serializeFinancePaymentSourceStagingEvidenceManifest(first)
    )

    const twoMappings = source('sur', {
      enrollmentMappings: [
        { externalId: 'external-two', localId: 102 },
        { externalId: 'external-one', localId: 101 },
      ],
    })
    const reversed = {
      ...twoMappings,
      enrollmentMappings: [...twoMappings.enrollmentMappings].reverse(),
    }
    expect(inspectFinancePaymentSourceContract(reversed).relationshipMappingDigest).toBe(
      inspectFinancePaymentSourceContract(twoMappings).relationshipMappingDigest
    )
  })

  it('rejects forged envelope, scope, account and relationship evidence', () => {
    const manifest = createFinancePaymentSourceStagingEvidenceManifest(input())
    for (const forged of [
      { ...manifest, artifactDigest: `sha256:${'c'.repeat(64)}` },
      {
        ...manifest,
        entities: [
          { ...manifest.entities[0]!, accountingScopeDigest: `sha256:${'d'.repeat(64)}` },
          ...manifest.entities.slice(1),
        ],
      },
      {
        ...manifest,
        entities: [
          {
            ...manifest.entities[0]!,
            providerAccountBindingDigest: `sha256:${'e'.repeat(64)}`,
          },
          ...manifest.entities.slice(1),
        ],
      },
      {
        ...manifest,
        entities: [
          { ...manifest.entities[0]!, relationshipMappingDigest: `sha256:${'f'.repeat(64)}` },
          ...manifest.entities.slice(1),
        ],
      },
    ]) {
      expect(() => assertFinancePaymentSourceStagingEvidenceManifest(forged)).toThrow(
        'FINANCE_PAYMENT_SOURCE_STAGING_EVIDENCE_INVALID'
      )
    }
  })

  it('rejects shared accounts and a source observation assigned to another accounting scope', () => {
    const shared = input()
    shared.samples[1] = {
      ...shared.samples[1]!,
      provider: shared.samples[0]!.provider,
      externalAccountId: shared.samples[0]!.externalAccountId,
    }
    expect(() => createFinancePaymentSourceStagingEvidenceManifest(shared)).toThrow(
      'FINANCE_PAYMENT_SOURCE_STAGING_EVIDENCE_INVALID'
    )

    const crossed = input()
    crossed.samples[1] = {
      ...crossed.samples[1]!,
      observation: crossed.samples[0]!.observation,
    }
    expect(() => createFinancePaymentSourceStagingEvidenceManifest(crossed)).toThrow(
      'FINANCE_PAYMENT_SOURCE_STAGING_EVIDENCE_INVALID'
    )

    const remapped = input()
    remapped.samples[1] = {
      ...remapped.samples[1]!,
      enrollmentMappings: [{ externalId: 'substituted-external-id', localId: 999 }],
    }
    expect(() => createFinancePaymentSourceStagingEvidenceManifest(remapped)).toThrow(
      'FINANCE_PAYMENT_SOURCE_STAGING_EVIDENCE_INVALID'
    )
  })

  it('exports no invocation, secret resolution or mutation operation', async () => {
    const module = await import('../src/payment-source-staging-evidence')
    expect(
      Object.keys(module).filter((key) =>
        /invokeProvider|resolveSecret|readPaymentEvents|write|execute|apply|activate|deploy/i.test(
          key
        )
      )
    ).toEqual([])
  })
})
