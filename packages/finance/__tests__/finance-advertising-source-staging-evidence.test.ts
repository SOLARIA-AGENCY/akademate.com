import { describe, expect, it, vi } from 'vitest'

import {
  assertFinanceAdvertisingSourceStagingEvidenceManifest,
  createFinanceAdvertisingSourceStagingEvidenceManifest,
  inspectFinanceAdvertisingSourceContract,
  serializeFinanceAdvertisingSourceStagingEvidenceManifest,
  type FinanceAdvertisingSourceInspectionInput,
} from '../src'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const labels = ['norte', 'santa-cruz', 'sur'] as const

function source(
  label: (typeof labels)[number],
  change: Partial<FinanceAdvertisingSourceInspectionInput> = {}
): FinanceAdvertisingSourceInspectionInput {
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
    campaignMappings: [
      { externalId: `external-campaign-${label}-private`, localId: `${label}-campaign-101` },
    ],
    ...change,
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
  }
}

describe('finance advertising source staging evidence', () => {
  it('inspects daily spend semantics without invoking Meta', () => {
    const current = source('sur')
    const observation = inspectFinanceAdvertisingSourceContract(current)
    expect(current.client.listDailyAdvertisingSpend).not.toHaveBeenCalled()
    expect(observation).toMatchObject({
      mode: 'read_only_daily_advertising_source_contract_inspection',
      verdict: 'contract_satisfied',
      hasReviewedCampaignMappings: true,
      dataGranularity: 'daily',
      metricStates: ['api_error', 'loaded', 'not_available', 'zero_real'],
      requiresExplicitCurrency: true,
      operations: ['list_daily_advertising_spend'],
      canReadDailySpend: true,
      canInvokeProvider: false,
      canWriteProvider: false,
      canPauseCampaign: false,
      canExposeCredential: false,
      canPersistRawPayload: false,
    })
    expect(JSON.stringify(observation)).not.toMatch(/ad-account-sur|external-campaign-sur/)
    expect(Object.isFrozen(observation)).toBe(true)
  })

  it('rejects a wider client, provider mismatch and ambiguous campaign mappings', () => {
    const wider = source('sur')
    expect(() =>
      inspectFinanceAdvertisingSourceContract({
        ...wider,
        client: { ...wider.client, pauseCampaign: vi.fn() } as never,
      })
    ).toThrow('FINANCE_ADVERTISING_SOURCE_STAGING_EVIDENCE_INVALID')
    expect(() =>
      inspectFinanceAdvertisingSourceContract({
        ...source('sur'),
        client: { provider: 'other-provider', listDailyAdvertisingSpend: vi.fn() },
      })
    ).toThrow('FINANCE_ADVERTISING_SOURCE_STAGING_EVIDENCE_INVALID')
    expect(() =>
      inspectFinanceAdvertisingSourceContract({
        ...source('sur'),
        campaignMappings: [
          { externalId: 'campaign-one', localId: 101 },
          { externalId: 'campaign-two', localId: 101 },
        ],
      })
    ).toThrow('FINANCE_ADVERTISING_SOURCE_STAGING_EVIDENCE_INVALID')
  })

  it('seals three isolated sources with one CEP Sur pilot and no readable IDs', () => {
    const manifest = createFinanceAdvertisingSourceStagingEvidenceManifest(input())
    expect(manifest).toMatchObject({
      kind: 'cep_finance_advertising_source_staging_evidence',
      mode: 'three_entity_non_invoking_daily_advertising_source_review',
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
        sourcesWithReviewedCampaignMappings: 3,
        dailyGranularitySources: 3,
        pilotEntities: 1,
        providerInvocations: 0,
        providerWriteOperations: 0,
      },
    })
    expect(manifest.entities).toHaveLength(3)
    expect(new Set(manifest.entities.map((item) => item.accountingScopeDigest)).size).toBe(3)
    expect(new Set(manifest.entities.map((item) => item.advertisingSourceScopeDigest)).size).toBe(3)
    expect(manifest.entities.filter((item) => item.role === 'cep_sur_pilot')).toHaveLength(1)
    expect(JSON.stringify(manifest)).not.toMatch(
      /tenant-private|entity-sur-private|ad-account-sur-private|external-campaign/
    )
    expect(() => assertFinanceAdvertisingSourceStagingEvidenceManifest(manifest)).not.toThrow()
  })

  it('is deterministic under sample and mapping reorder', () => {
    const first = input()
    expect(
      serializeFinanceAdvertisingSourceStagingEvidenceManifest({
        ...first,
        samples: [...first.samples].reverse(),
      })
    ).toBe(serializeFinanceAdvertisingSourceStagingEvidenceManifest(first))

    const multiple = source('sur', {
      campaignMappings: [
        { externalId: 'campaign-two', localId: 102 },
        { externalId: 'campaign-one', localId: 101 },
      ],
    })
    expect(
      inspectFinanceAdvertisingSourceContract({
        ...multiple,
        campaignMappings: [...multiple.campaignMappings].reverse(),
      }).relationshipMappingDigest
    ).toBe(inspectFinanceAdvertisingSourceContract(multiple).relationshipMappingDigest)
  })

  it('rejects forged artifacts and mappings changed after inspection', () => {
    const manifest = createFinanceAdvertisingSourceStagingEvidenceManifest(input())
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
          { ...manifest.entities[0]!, relationshipMappingDigest: `sha256:${'e'.repeat(64)}` },
          ...manifest.entities.slice(1),
        ],
      },
    ]) {
      expect(() => assertFinanceAdvertisingSourceStagingEvidenceManifest(forged)).toThrow(
        'FINANCE_ADVERTISING_SOURCE_STAGING_EVIDENCE_INVALID'
      )
    }

    const remapped = input()
    remapped.samples[0] = {
      ...remapped.samples[0]!,
      campaignMappings: [{ externalId: 'substituted', localId: 999 }],
    }
    expect(() => createFinanceAdvertisingSourceStagingEvidenceManifest(remapped)).toThrow(
      'FINANCE_ADVERTISING_SOURCE_STAGING_EVIDENCE_INVALID'
    )
  })

  it('rejects shared accounts and observations assigned to another entity', () => {
    const shared = input()
    shared.samples[1] = {
      ...shared.samples[1]!,
      provider: shared.samples[0]!.provider,
      externalAccountId: shared.samples[0]!.externalAccountId,
    }
    expect(() => createFinanceAdvertisingSourceStagingEvidenceManifest(shared)).toThrow(
      'FINANCE_ADVERTISING_SOURCE_STAGING_EVIDENCE_INVALID'
    )

    const crossed = input()
    crossed.samples[1] = { ...crossed.samples[1]!, observation: crossed.samples[0]!.observation }
    expect(() => createFinanceAdvertisingSourceStagingEvidenceManifest(crossed)).toThrow(
      'FINANCE_ADVERTISING_SOURCE_STAGING_EVIDENCE_INVALID'
    )
  })

  it('exports no provider invocation, pause, write or activation operation', async () => {
    const module = await import('../src/advertising-source-staging-evidence')
    expect(
      Object.keys(module).filter((key) =>
        /invoke|pause|write|execute|resolveSecret|apply|activate|deploy/i.test(key)
      )
    ).toEqual([])
  })
})
