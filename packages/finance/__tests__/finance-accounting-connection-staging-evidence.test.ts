import { describe, expect, it } from 'vitest'

import {
  assertFinanceAccountingConnectionStagingEvidenceManifest,
  createFinanceAccountingConnectionStagingEvidenceManifest,
  serializeFinanceAccountingConnectionStagingEvidenceManifest,
  type FinanceAccountingConnectionStagingEvidenceInput,
  type FinanceAccountingConnectionStagingEvidenceSample,
} from '../src'

const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`

function sample(
  label: 'norte' | 'santa-cruz' | 'sur',
  change: Partial<FinanceAccountingConnectionStagingEvidenceSample> = {}
): FinanceAccountingConnectionStagingEvidenceSample {
  const pilot = label === 'sur'
  return {
    tenantId: 'tenant-private',
    legalEntityId: `entity-${label}-private`,
    accountingConnectionId: `connection-${label}-private`,
    provider: 'accounting-provider',
    externalCompanyId: `company-${label}-private`,
    integrationMode: 'read_only',
    connectionStatus: 'active',
    reviewedState: 'configured_not_resolved',
    role: pilot ? 'cep_sur_pilot' : 'existing_entity',
    entityReviewReference: `review://finance/${label}/entity/v1`,
    connectionReviewReference: `review://finance/${label}/connection/v1`,
    ...(pilot ? { pilotReviewReference: 'review://finance/sur/connection-pilot/v1' } : {}),
    ...change,
  }
}

function input(
  change: Partial<FinanceAccountingConnectionStagingEvidenceInput> = {}
): FinanceAccountingConnectionStagingEvidenceInput {
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

describe('finance accounting connection staging evidence', () => {
  it('seals three exclusive read-only connections without resolving secrets or providers', () => {
    const manifest = createFinanceAccountingConnectionStagingEvidenceManifest(input())

    expect(manifest).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_finance_accounting_connection_staging_evidence',
      mode: 'three_entity_redacted_connection_review',
      verdict: 'eligible_for_manual_staging_binding',
      canResolveSecret: false,
      canConnectProvider: false,
      canBindAutomatically: false,
      canMarkVerified: false,
      canDeploy: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: {
        expectedEntities: 3,
        reviewedConnections: 3,
        readOnlyConnections: 3,
        activeConnections: 3,
        pilotEntities: 1,
        resolvedSecrets: 0,
        liveProviderConnections: 0,
      },
    })
    expect(manifest.entities).toHaveLength(3)
    expect(new Set(manifest.entities.map(({ scopeDigest }) => scopeDigest)).size).toBe(3)
    expect(
      new Set(manifest.entities.map(({ connectionBindingDigest }) => connectionBindingDigest)).size
    ).toBe(3)
    expect(
      new Set(
        manifest.entities.map(({ externalCompanyBindingDigest }) => externalCompanyBindingDigest)
      ).size
    ).toBe(3)
    expect(Object.isFrozen(manifest)).toBe(true)
    expect(Object.isFrozen(manifest.entities)).toBe(true)
    expect(() => assertFinanceAccountingConnectionStagingEvidenceManifest(manifest)).not.toThrow()
  })

  it('is deterministic and excludes raw scopes, companies, providers, reviews and secrets', () => {
    const source = input()
    const first = serializeFinanceAccountingConnectionStagingEvidenceManifest(source)
    const second = serializeFinanceAccountingConnectionStagingEvidenceManifest({
      ...source,
      samples: [...source.samples].reverse(),
    })

    expect(second).toBe(first)
    for (const privateValue of [
      'tenant-private',
      'entity-norte-private',
      'connection-sur-private',
      'company-santa-cruz-private',
      'accounting-provider',
      'review://',
      'secretReference',
      'op://',
    ]) {
      expect(first).not.toContain(privateValue)
    }
  })

  it.each([
    ['production review', { reviewEnvironment: 'production' }],
    ['same source and target', { targetTenantDigest: sourceDigest }],
    ['missing entity', { samples: [sample('norte'), sample('sur')] }],
    ['invalid campaign review', { campaignReviewReference: 'campaign-1' }],
  ])('rejects an invalid envelope: %s', (_label, change) => {
    expect(() =>
      createFinanceAccountingConnectionStagingEvidenceManifest(input(change as never))
    ).toThrow('FINANCE_ACCOUNTING_CONNECTION_STAGING_EVIDENCE_INVALID')
  })

  it.each([
    [
      'tenant mismatch',
      [sample('norte'), sample('santa-cruz', { tenantId: 'other-private' }), sample('sur')],
    ],
    [
      'duplicate entity',
      [
        sample('norte'),
        sample('santa-cruz', { legalEntityId: 'entity-norte-private' }),
        sample('sur'),
      ],
    ],
    [
      'shared connection',
      [
        sample('norte'),
        sample('santa-cruz', { accountingConnectionId: 'connection-norte-private' }),
        sample('sur'),
      ],
    ],
    [
      'shared external company',
      [
        sample('norte'),
        sample('santa-cruz', { externalCompanyId: 'company-norte-private' }),
        sample('sur'),
      ],
    ],
  ])('rejects invalid connection isolation: %s', (_label, samples) => {
    expect(() =>
      createFinanceAccountingConnectionStagingEvidenceManifest(input({ samples }))
    ).toThrow('FINANCE_ACCOUNTING_CONNECTION_STAGING_EVIDENCE_INVALID')
  })

  it.each([
    ['write mode', { integrationMode: 'read_write' }],
    ['inactive connection', { connectionStatus: 'inactive' }],
    ['claimed provider resolution', { reviewedState: 'resolved_live' }],
    ['reused entity review', { connectionReviewReference: 'review://finance/norte/entity/v1' }],
  ])('rejects unsafe or overstated connection metadata: %s', (_label, change) => {
    expect(() =>
      createFinanceAccountingConnectionStagingEvidenceManifest(
        input({ samples: [sample('norte', change as never), sample('santa-cruz'), sample('sur')] })
      )
    ).toThrow('FINANCE_ACCOUNTING_CONNECTION_STAGING_EVIDENCE_INVALID')
  })

  it('rejects secret material and extra metadata rather than hashing it into evidence', () => {
    expect(() =>
      createFinanceAccountingConnectionStagingEvidenceManifest(
        input({
          samples: [
            { ...sample('norte'), secretReference: 'op://cep/accounting/norte' } as never,
            sample('santa-cruz'),
            sample('sur'),
          ],
        })
      )
    ).toThrow('FINANCE_ACCOUNTING_CONNECTION_STAGING_EVIDENCE_INVALID')
  })

  it.each([
    [
      'manifest digest',
      (value: object) => ({ ...value, artifactDigest: `sha256:${'c'.repeat(64)}` }),
    ],
    ['secret capability', (value: object) => ({ ...value, canResolveSecret: true })],
    [
      'entity binding',
      (value: ReturnType<typeof createFinanceAccountingConnectionStagingEvidenceManifest>) => ({
        ...value,
        entities: [
          { ...value.entities[0]!, connectionBindingDigest: `sha256:${'d'.repeat(64)}` },
          ...value.entities.slice(1),
        ],
      }),
    ],
  ])('rejects forged sealed evidence: %s', (_label, forge) => {
    const manifest = createFinanceAccountingConnectionStagingEvidenceManifest(input())
    expect(() =>
      assertFinanceAccountingConnectionStagingEvidenceManifest(forge(manifest) as never)
    ).toThrow('FINANCE_ACCOUNTING_CONNECTION_STAGING_EVIDENCE_INVALID')
  })

  it('exports no secret resolution, provider connection, binding or activation function', async () => {
    const module = await import('../src/accounting-connection-staging-evidence')
    expect(
      Object.keys(module).filter((key) =>
        /resolveSecret|connectProvider|execute|apply|activate|deploy|bind|markVerified/i.test(key)
      )
    ).toEqual([])
  })
})
