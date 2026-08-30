import { describe, expect, it } from 'vitest'

import {
  assertFinanceAccountingSecretReferenceStagingEvidenceManifest,
  createFinanceAccountingSecretReferenceStagingEvidenceManifest,
  serializeFinanceAccountingSecretReferenceStagingEvidenceManifest,
  type FinanceAccountingSecretReferenceStagingEvidenceInput,
  type FinanceAccountingSecretReferenceStagingEvidenceSample,
} from '../src'

const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const references = {
  norte: 'op://cep/accounting/norte',
  'santa-cruz': 'vault://cep/accounting/santa-cruz',
  sur: 'aws-sm://cep/accounting/sur',
} as const

function sample(
  label: keyof typeof references,
  change: Partial<FinanceAccountingSecretReferenceStagingEvidenceSample> = {}
): FinanceAccountingSecretReferenceStagingEvidenceSample {
  const pilot = label === 'sur'
  return {
    tenantId: 'tenant-private',
    legalEntityId: `entity-${label}-private`,
    accountingConnectionId: `connection-${label}-private`,
    secretReference: references[label],
    configuredState: 'reference_configured_not_resolved',
    role: pilot ? 'cep_sur_pilot' : 'existing_entity',
    entityReviewReference: `review://finance/${label}/entity/v1`,
    secretReviewReference: `review://finance/${label}/secret-reference/v1`,
    ...(pilot ? { pilotReviewReference: 'review://finance/sur/secret-pilot/v1' } : {}),
    ...change,
  }
}

function input(
  change: Partial<FinanceAccountingSecretReferenceStagingEvidenceInput> = {}
): FinanceAccountingSecretReferenceStagingEvidenceInput {
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

describe('finance accounting secret reference staging evidence', () => {
  it('seals three unique opaque references without resolving or reading credentials', () => {
    const manifest = createFinanceAccountingSecretReferenceStagingEvidenceManifest(input())

    expect(manifest).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_finance_secret_reference_staging_evidence',
      mode: 'three_entity_opaque_secret_reference_review',
      verdict: 'eligible_for_manual_staging_binding',
      canResolveSecret: false,
      canReadCredential: false,
      canBindAutomatically: false,
      canMarkVerified: false,
      canDeploy: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: {
        expectedEntities: 3,
        configuredReferences: 3,
        uniqueReferences: 3,
        pilotEntities: 1,
        resolvedSecrets: 0,
        readCredentials: 0,
      },
    })
    expect(manifest.entities.map(({ secretBackend }) => secretBackend).sort()).toEqual([
      'aws_sm',
      'op',
      'vault',
    ])
    expect(
      new Set(manifest.entities.map(({ secretReferenceDigest }) => secretReferenceDigest)).size
    ).toBe(3)
    expect(Object.isFrozen(manifest.entities)).toBe(true)
    expect(() =>
      assertFinanceAccountingSecretReferenceStagingEvidenceManifest(manifest)
    ).not.toThrow()
  })

  it('is deterministic and never serializes a locator, credential or review', () => {
    const source = input()
    const first = serializeFinanceAccountingSecretReferenceStagingEvidenceManifest(source)
    const second = serializeFinanceAccountingSecretReferenceStagingEvidenceManifest({
      ...source,
      samples: [...source.samples].reverse(),
    })

    expect(second).toBe(first)
    for (const privateValue of [
      ...Object.values(references),
      'tenant-private',
      'entity-norte-private',
      'connection-sur-private',
      'review://',
    ]) {
      expect(first).not.toContain(privateValue)
    }
    expect(first).not.toContain('password=')
  })

  it.each([
    ['production review', { reviewEnvironment: 'production' }],
    ['same digests', { targetTenantDigest: sourceDigest }],
    ['missing entity', { samples: [sample('norte'), sample('sur')] }],
  ])('rejects an invalid envelope: %s', (_label, change) => {
    expect(() =>
      createFinanceAccountingSecretReferenceStagingEvidenceManifest(input(change as never))
    ).toThrow('FINANCE_ACCOUNTING_SECRET_REFERENCE_STAGING_EVIDENCE_INVALID')
  })

  it.each([
    ['plaintext value', 'password=secret'],
    ['environment variable', 'env://ACCOUNTING_TOKEN'],
    ['bare locator', 'cep/accounting/norte'],
    ['whitespace', 'op://cep/accounting/norte token'],
  ])('rejects invalid secret locator %s', (_label, secretReference) => {
    expect(() =>
      createFinanceAccountingSecretReferenceStagingEvidenceManifest(
        input({
          samples: [sample('norte', { secretReference }), sample('santa-cruz'), sample('sur')],
        })
      )
    ).toThrow('FINANCE_ACCOUNTING_SECRET_REFERENCE_STAGING_EVIDENCE_INVALID')
  })

  it('accepts every approved backend while retaining only its non-secret kind', () => {
    const manifest = createFinanceAccountingSecretReferenceStagingEvidenceManifest(
      input({
        samples: [
          sample('norte', { secretReference: 'gcp-sm://cep/accounting/norte' }),
          sample('santa-cruz'),
          sample('sur'),
        ],
      })
    )
    expect(manifest.entities.some(({ secretBackend }) => secretBackend === 'gcp_sm')).toBe(true)
  })

  it.each([
    [
      'tenant mismatch',
      [sample('norte'), sample('santa-cruz', { tenantId: 'other-private' }), sample('sur')],
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
      'shared reference',
      [sample('norte'), sample('santa-cruz', { secretReference: references.norte }), sample('sur')],
    ],
  ])('rejects invalid entity isolation: %s', (_label, samples) => {
    expect(() =>
      createFinanceAccountingSecretReferenceStagingEvidenceManifest(input({ samples }))
    ).toThrow('FINANCE_ACCOUNTING_SECRET_REFERENCE_STAGING_EVIDENCE_INVALID')
  })

  it('rejects claims of resolved secrets and reused reviews', () => {
    expect(() =>
      createFinanceAccountingSecretReferenceStagingEvidenceManifest(
        input({
          samples: [
            sample('norte', { configuredState: 'resolved' as never }),
            sample('santa-cruz'),
            sample('sur'),
          ],
        })
      )
    ).toThrow('FINANCE_ACCOUNTING_SECRET_REFERENCE_STAGING_EVIDENCE_INVALID')
    expect(() =>
      createFinanceAccountingSecretReferenceStagingEvidenceManifest(
        input({
          samples: [
            sample('norte', { secretReviewReference: 'review://finance/norte/entity/v1' }),
            sample('santa-cruz'),
            sample('sur'),
          ],
        })
      )
    ).toThrow('FINANCE_ACCOUNTING_SECRET_REFERENCE_STAGING_EVIDENCE_INVALID')
  })

  it.each([
    [
      'manifest digest',
      (value: object) => ({ ...value, artifactDigest: `sha256:${'c'.repeat(64)}` }),
    ],
    ['read credential', (value: object) => ({ ...value, canReadCredential: true })],
    [
      'secret digest',
      (
        value: ReturnType<typeof createFinanceAccountingSecretReferenceStagingEvidenceManifest>
      ) => ({
        ...value,
        entities: [
          { ...value.entities[0]!, secretReferenceDigest: `sha256:${'d'.repeat(64)}` },
          ...value.entities.slice(1),
        ],
      }),
    ],
  ])('rejects forged sealed evidence: %s', (_label, forge) => {
    const manifest = createFinanceAccountingSecretReferenceStagingEvidenceManifest(input())
    expect(() =>
      assertFinanceAccountingSecretReferenceStagingEvidenceManifest(forge(manifest) as never)
    ).toThrow('FINANCE_ACCOUNTING_SECRET_REFERENCE_STAGING_EVIDENCE_INVALID')
  })

  it('exports no secret resolution, credential read, binding or activation function', async () => {
    const module = await import('../src/accounting-secret-reference-staging-evidence')
    expect(
      Object.keys(module).filter((key) =>
        /resolveSecret|readCredential|execute|apply|activate|deploy|bind|markVerified/i.test(key)
      )
    ).toEqual([])
  })
})
