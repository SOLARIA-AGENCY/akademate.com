import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { createFinanceAccountingSecretReferenceStagingEvidenceManifest } from '../../../../../packages/finance/src'
import {
  FINANCE_ACCOUNTING_SECRET_REFERENCE_READINESS_GATE,
  FinanceAccountingSecretReferenceBindingError,
  createFinanceAccountingSecretReferenceBindingProposal,
} from '../finance-accounting-secret-reference-evidence-binding'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const labels = ['norte', 'santa-cruz', 'sur'] as const

function manifest() {
  return createFinanceAccountingSecretReferenceStagingEvidenceManifest({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label) => ({
      tenantId: 'tenant-private',
      legalEntityId: `entity-${label}-private`,
      accountingConnectionId: `connection-${label}-private`,
      secretReference: `op://cep/accounting/${label}`,
      configuredState: 'reference_configured_not_resolved',
      role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
      entityReviewReference: `review://finance/${label}/entity/v1`,
      secretReviewReference: `review://finance/${label}/secret-reference/v1`,
      ...(label === 'sur' ? { pilotReviewReference: 'review://finance/sur/secret-pilot/v1' } : {}),
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

function expectCode(
  run: () => unknown,
  code: FinanceAccountingSecretReferenceBindingError['code']
) {
  expect(run).toThrowError(
    expect.objectContaining<Partial<FinanceAccountingSecretReferenceBindingError>>({ code })
  )
}

describe('finance accounting secret reference evidence binding', () => {
  it('proposes three entity bindings without resolving secrets', () => {
    const source = manifest()
    const proposal = createFinanceAccountingSecretReferenceBindingProposal({
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
          binding.gate === FINANCE_ACCOUNTING_SECRET_REFERENCE_READINESS_GATE &&
          binding.artifactKind === 'cep_finance_secret_reference_configuration_evidence'
      )
    ).toBe(true)
  })

  it('rejects forged evidence, context mismatch and partial mapping', () => {
    const source = manifest()
    expectCode(
      () =>
        createFinanceAccountingSecretReferenceBindingProposal({
          manifest: { ...source, artifactDigest: `sha256:${'c'.repeat(64)}` },
          campaignReviewReference,
          readinessReviewReference,
          entities: targets(source),
        }),
      'FINANCE_ACCOUNTING_SECRET_REFERENCE_MANIFEST_INVALID'
    )
    expectCode(
      () =>
        createFinanceAccountingSecretReferenceBindingProposal({
          manifest: source,
          campaignReviewReference: 'review://campaign/other/v1',
          readinessReviewReference,
          entities: targets(source),
        }),
      'FINANCE_ACCOUNTING_SECRET_REFERENCE_CAMPAIGN_MISMATCH'
    )
    expectCode(
      () =>
        createFinanceAccountingSecretReferenceBindingProposal({
          manifest: source,
          campaignReviewReference,
          readinessReviewReference,
          entities: targets(source).slice(1),
        }),
      'FINANCE_ACCOUNTING_SECRET_REFERENCE_BINDING_INPUT_INVALID'
    )
  })

  it('rejects reassigned reviews and exports no secret operation', async () => {
    const source = manifest()
    const entityTargets = targets(source)
    expectCode(
      () =>
        createFinanceAccountingSecretReferenceBindingProposal({
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
      'FINANCE_ACCOUNTING_SECRET_REFERENCE_MAPPING_INVALID'
    )
    const module = await import('../finance-accounting-secret-reference-evidence-binding')
    expect(
      Object.keys(module).filter((key) =>
        /resolveSecret|readCredential|execute|apply|activate|deploy|markVerified/i.test(key)
      )
    ).toEqual([])
  })
})
