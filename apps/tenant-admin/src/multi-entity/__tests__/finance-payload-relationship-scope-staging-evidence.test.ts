import { createHash } from 'node:crypto'

import { describe, expect, it, vi } from 'vitest'

import {
  createFinanceAdvertisingSourceStagingEvidenceManifest,
  createFinancePaymentSourceStagingEvidenceManifest,
  inspectFinanceAdvertisingSourceContract,
  inspectFinancePaymentSourceContract,
  type FinanceAdvertisingSourceInspectionInput,
  type FinancePaymentSourceInspectionInput,
} from '../../../../../packages/finance/src'
import {
  assertFinancePayloadRelationshipScopeStagingEvidenceManifest,
  createFinancePayloadRelationshipScopeStagingEvidenceManifest,
  serializeFinancePayloadRelationshipScopeStagingEvidenceManifest,
  type FinancePayloadRelationshipScopeStagingEvidenceInput,
} from '../finance-payload-relationship-scope-staging-evidence'
import {
  assertEnrollmentCampaignScopeStagingEvidenceManifest,
  createEnrollmentCampaignScopeStagingEvidenceManifest,
  serializeEnrollmentCampaignScopeStagingEvidenceManifest,
  type EnrollmentCampaignScopeStagingEvidenceInput,
} from '../enrollment-campaign-scope-staging-evidence'
import {
  ENROLLMENT_CAMPAIGN_SCOPE_REVIEWED_READINESS_GATE,
  EnrollmentCampaignScopeBindingError,
  createEnrollmentCampaignScopeBindingProposal,
} from '../enrollment-campaign-scope-evidence-binding'
import {
  FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_REVIEWED_READINESS_GATE,
  FinancePayloadRelationshipScopeBindingError,
  createFinancePayloadRelationshipScopeBindingProposal,
} from '../finance-payload-relationship-scope-evidence-binding'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const labels = ['norte', 'santa-cruz', 'sur'] as const

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function fixture(): FinancePayloadRelationshipScopeStagingEvidenceInput {
  const paymentSources = labels.map(
    (label, index): FinancePaymentSourceInspectionInput => ({
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
      enrollmentMappings: [{ externalId: `external-enrollment-${label}`, localId: 101 + index }],
    })
  )
  const advertisingSources = labels.map(
    (label, index): FinanceAdvertisingSourceInspectionInput => ({
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
      campaignMappings: [{ externalId: `external-campaign-${label}`, localId: 301 + index }],
    })
  )
  const paymentManifest = createFinancePaymentSourceStagingEvidenceManifest({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label, index) => {
      const current = paymentSources[index]!
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
  const advertisingManifest = createFinanceAdvertisingSourceStagingEvidenceManifest({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label, index) => {
      const current = advertisingSources[index]!
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
  const paymentByReview = new Map(
    paymentManifest.entities.map((artifact) => [artifact.entityReviewReferenceDigest, artifact])
  )
  const advertisingByReview = new Map(
    advertisingManifest.entities.map((artifact) => [artifact.entityReviewReferenceDigest, artifact])
  )
  return {
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label, index) => {
      const entityReviewReference = `review://finance/${label}/entity/v1`
      return {
        accountingConnectionId: `accounting-${label}-private`,
        payloadPlan: {
          tenantId: 'tenant-private',
          legalEntityId: `entity-${label}-private`,
          payloadTenantId: '7',
          reviewReference: `review://finance/${label}/payload-plan/v1`,
          enrollmentIds: [101 + index],
          courseRunIds: [201 + index],
          campaignIds: [301 + index],
        },
        paymentSource: paymentSources[index]!,
        paymentSourceArtifact: paymentByReview.get(sha256(entityReviewReference))!,
        advertisingSource: advertisingSources[index]!,
        advertisingSourceArtifact: advertisingByReview.get(sha256(entityReviewReference))!,
        role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
        entityReviewReference,
        ...(label === 'sur'
          ? { pilotReviewReference: 'review://finance/sur/payload-scope-pilot/v1' }
          : {}),
      }
    }),
  }
}

function enrollmentCampaignFixture(): EnrollmentCampaignScopeStagingEvidenceInput {
  const payloadInput = fixture()
  const payloadRelationshipScope =
    createFinancePayloadRelationshipScopeStagingEvidenceManifest(payloadInput)
  return {
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    payloadRelationshipScope,
    samples: payloadInput.samples.map((sample, index) => ({
      payloadPlan: sample.payloadPlan,
      enrollmentRelationships: [
        {
          enrollmentId: sample.payloadPlan.enrollmentIds[0]!,
          courseRunId: sample.payloadPlan.courseRunIds[0]!,
        },
      ],
      campaignRelationships: [
        {
          campaignId: sample.payloadPlan.campaignIds[0]!,
          courseRunId: sample.payloadPlan.courseRunIds[0]!,
        },
      ],
      role: sample.role,
      entityReviewReference: sample.entityReviewReference,
      relationshipReviewReference: `review://finance/${labels[index]}/enrollment-campaign-scope/v1`,
      ...(sample.role === 'cep_sur_pilot'
        ? { pilotReviewReference: 'review://finance/sur/enrollment-campaign-pilot/v1' }
        : {}),
    })),
  }
}

describe('finance Payload relationship scope staging evidence', () => {
  it('seals exact three-entity coverage without reading Payload or providers', () => {
    const input = fixture()
    const manifest = createFinancePayloadRelationshipScopeStagingEvidenceManifest(input)
    expect(manifest).toMatchObject({
      kind: 'cep_finance_payload_relationship_scope_staging_evidence',
      mode: 'three_entity_cross_source_payload_relationship_review',
      verdict: 'eligible_for_manual_staging_binding',
      canReadPayload: false,
      canInvokeProvider: false,
      canBindAutomatically: false,
      canMarkVerified: false,
      canDeploy: false,
      canActivate: false,
      canChangePermissions: false,
      canUsePlatformSuperadmin: false,
      metrics: {
        expectedEntities: 3,
        reviewedPayloadPlans: 3,
        exactEnrollmentCoverages: 3,
        exactCampaignCoverages: 3,
        linkedPaymentSources: 3,
        linkedAdvertisingSources: 3,
        pilotEntities: 1,
        payloadReads: 0,
        providerInvocations: 0,
      },
    })
    expect(manifest.entities).toHaveLength(3)
    expect(JSON.stringify(manifest)).not.toMatch(
      /tenant-private|entity-sur-private|external-enrollment|external-campaign|ad-account/
    )
    for (const sample of input.samples) {
      expect(sample.paymentSource.client.listPaymentEvents).not.toHaveBeenCalled()
      expect(sample.advertisingSource.client.listDailyAdvertisingSpend).not.toHaveBeenCalled()
    }
    expect(() =>
      assertFinancePayloadRelationshipScopeStagingEvidenceManifest(manifest)
    ).not.toThrow()
  })

  it('rejects enrollment and campaign mappings outside exact Payload coverage', () => {
    const enrollmentMismatch = fixture()
    enrollmentMismatch.samples[0] = {
      ...enrollmentMismatch.samples[0]!,
      payloadPlan: { ...enrollmentMismatch.samples[0]!.payloadPlan, enrollmentIds: [999] },
    }
    expect(() =>
      createFinancePayloadRelationshipScopeStagingEvidenceManifest(enrollmentMismatch)
    ).toThrow('FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_STAGING_EVIDENCE_INVALID')

    const campaignMismatch = fixture()
    campaignMismatch.samples[1] = {
      ...campaignMismatch.samples[1]!,
      payloadPlan: { ...campaignMismatch.samples[1]!.payloadPlan, campaignIds: [999] },
    }
    expect(() =>
      createFinancePayloadRelationshipScopeStagingEvidenceManifest(campaignMismatch)
    ).toThrow('FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_STAGING_EVIDENCE_INVALID')
  })

  it('rejects IDs shared across entities and non-numeric external local mappings', () => {
    const shared = fixture()
    shared.samples[1] = {
      ...shared.samples[1]!,
      payloadPlan: {
        ...shared.samples[1]!.payloadPlan,
        enrollmentIds: shared.samples[0]!.payloadPlan.enrollmentIds,
      },
      paymentSource: {
        ...shared.samples[1]!.paymentSource,
        enrollmentMappings: shared.samples[0]!.paymentSource.enrollmentMappings,
      },
    }
    expect(() => createFinancePayloadRelationshipScopeStagingEvidenceManifest(shared)).toThrow(
      'FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_STAGING_EVIDENCE_INVALID'
    )

    const stringLocalId = fixture()
    stringLocalId.samples[2] = {
      ...stringLocalId.samples[2]!,
      paymentSource: {
        ...stringLocalId.samples[2]!.paymentSource,
        enrollmentMappings: [{ externalId: 'external-sur', localId: '103' }],
      },
    }
    expect(() =>
      createFinancePayloadRelationshipScopeStagingEvidenceManifest(stringLocalId)
    ).toThrow('FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_STAGING_EVIDENCE_INVALID')
  })

  it('rejects a source artifact or accounting scope reassigned to another entity', () => {
    const substitutedArtifact = fixture()
    substitutedArtifact.samples[0] = {
      ...substitutedArtifact.samples[0]!,
      paymentSourceArtifact: substitutedArtifact.samples[1]!.paymentSourceArtifact,
    }
    expect(() =>
      createFinancePayloadRelationshipScopeStagingEvidenceManifest(substitutedArtifact)
    ).toThrow('FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_STAGING_EVIDENCE_INVALID')

    const substitutedAccounting = fixture()
    substitutedAccounting.samples[0] = {
      ...substitutedAccounting.samples[0]!,
      accountingConnectionId: 'accounting-other-private',
    }
    expect(() =>
      createFinancePayloadRelationshipScopeStagingEvidenceManifest(substitutedAccounting)
    ).toThrow('FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_STAGING_EVIDENCE_INVALID')
  })

  it('is deterministic and rejects forged content-addressed artifacts', () => {
    const first = fixture()
    expect(
      serializeFinancePayloadRelationshipScopeStagingEvidenceManifest({
        ...first,
        samples: [...first.samples].reverse(),
      })
    ).toBe(serializeFinancePayloadRelationshipScopeStagingEvidenceManifest(first))

    const manifest = createFinancePayloadRelationshipScopeStagingEvidenceManifest(first)
    expect(() =>
      assertFinancePayloadRelationshipScopeStagingEvidenceManifest({
        ...manifest,
        entities: [
          { ...manifest.entities[0]!, payloadPlanDigest: `sha256:${'c'.repeat(64)}` },
          ...manifest.entities.slice(1),
        ],
      })
    ).toThrow('FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_STAGING_EVIDENCE_INVALID')
  })

  it('exports no Payload read, provider invocation or permission operation', async () => {
    const module = await import('../finance-payload-relationship-scope-staging-evidence')
    expect(
      Object.keys(module).filter((key) =>
        /readPayload|invoke|execute|apply|activate|deploy|permission|superadmin/i.test(key)
      )
    ).toEqual([])
  })

  it('proposes three manual readiness bindings without granting authority', () => {
    const manifest = createFinancePayloadRelationshipScopeStagingEvidenceManifest(fixture())
    const reviews = labels.map((label) => `review://finance/${label}/entity/v1`)
    const proposal = createFinancePayloadRelationshipScopeBindingProposal({
      manifest,
      campaignReviewReference,
      readinessReviewReference,
      entities: manifest.entities.map((entity) => ({
        artifactDigest: entity.artifactDigest,
        entityReviewReference: reviews.find(
          (review) => sha256(review) === entity.entityReviewReferenceDigest
        )!,
      })),
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
          binding.gate === FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_REVIEWED_READINESS_GATE &&
          binding.artifactKind === 'cep_finance_payload_relationship_scope_review_evidence'
      )
    ).toBe(true)
  })

  it('rejects a partial or cross-campaign binding proposal', () => {
    const manifest = createFinancePayloadRelationshipScopeStagingEvidenceManifest(fixture())
    const reviews = labels.map((label) => `review://finance/${label}/entity/v1`)
    const targets = manifest.entities.map((entity) => ({
      artifactDigest: entity.artifactDigest,
      entityReviewReference: reviews.find(
        (review) => sha256(review) === entity.entityReviewReferenceDigest
      )!,
    }))
    const expectCode = (
      run: () => unknown,
      code: FinancePayloadRelationshipScopeBindingError['code']
    ) =>
      expect(run).toThrowError(
        expect.objectContaining<Partial<FinancePayloadRelationshipScopeBindingError>>({ code })
      )

    expectCode(
      () =>
        createFinancePayloadRelationshipScopeBindingProposal({
          manifest,
          campaignReviewReference,
          readinessReviewReference,
          entities: targets.slice(1),
        }),
      'FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_BINDING_INPUT_INVALID'
    )
    expectCode(
      () =>
        createFinancePayloadRelationshipScopeBindingProposal({
          manifest,
          campaignReviewReference: 'review://campaign/other/v1',
          readinessReviewReference,
          entities: targets,
        }),
      'FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_CAMPAIGN_MISMATCH'
    )
  })
})

describe('enrollment/campaign course-run scope staging evidence', () => {
  it('seals the three redacted relationship graphs without reading or writing', () => {
    const manifest = createEnrollmentCampaignScopeStagingEvidenceManifest(
      enrollmentCampaignFixture()
    )

    expect(manifest).toMatchObject({
      kind: 'cep_multi_entity_enrollment_campaign_scope_staging_evidence',
      mode: 'three_entity_reviewed_relationship_graph',
      verdict: 'eligible_for_manual_staging_binding',
      canReadPayload: false,
      canReadMeta: false,
      canInvokeProvider: false,
      canWrite: false,
      canBindAutomatically: false,
      canMarkVerified: false,
      canDeploy: false,
      canActivate: false,
      canChangePermissions: false,
      canUsePlatformSuperadmin: false,
      metrics: {
        expectedEntities: 3,
        reviewedEntities: 3,
        pilotEntities: 1,
        reviewedCourseRuns: 3,
        reviewedEnrollmentRelationships: 3,
        reviewedCampaignRelationships: 3,
        payloadReads: 0,
        metaReads: 0,
        providerInvocations: 0,
        writes: 0,
      },
    })
    expect(manifest.entities).toHaveLength(3)
    expect(JSON.stringify(manifest)).not.toMatch(
      /tenant-private|entity-sur-private|external-campaign|external-enrollment|review:\/\//
    )
    expect(() => assertEnrollmentCampaignScopeStagingEvidenceManifest(manifest)).not.toThrow()
  })

  it('rejects a cross-entity course-run edge and incomplete child coverage', () => {
    const crossEntity = enrollmentCampaignFixture()
    crossEntity.samples[0] = {
      ...crossEntity.samples[0]!,
      campaignRelationships: [
        {
          campaignId: crossEntity.samples[0]!.payloadPlan.campaignIds[0]!,
          courseRunId: crossEntity.samples[1]!.payloadPlan.courseRunIds[0]!,
        },
      ],
    }
    expect(() => createEnrollmentCampaignScopeStagingEvidenceManifest(crossEntity)).toThrow(
      'ENROLLMENT_CAMPAIGN_SCOPE_STAGING_EVIDENCE_INVALID'
    )

    const incomplete = enrollmentCampaignFixture()
    incomplete.samples[1] = {
      ...incomplete.samples[1]!,
      enrollmentRelationships: [],
    }
    expect(() => createEnrollmentCampaignScopeStagingEvidenceManifest(incomplete)).toThrow(
      'ENROLLMENT_CAMPAIGN_SCOPE_STAGING_EVIDENCE_INVALID'
    )

    const reusedReview = enrollmentCampaignFixture()
    reusedReview.samples[0] = {
      ...reusedReview.samples[0]!,
      relationshipReviewReference: reusedReview.samples[1]!.entityReviewReference,
    }
    expect(() => createEnrollmentCampaignScopeStagingEvidenceManifest(reusedReview)).toThrow(
      'ENROLLMENT_CAMPAIGN_SCOPE_STAGING_EVIDENCE_INVALID'
    )
  })

  it('rejects a substituted parent artifact and forged graph digest', () => {
    const substituted = enrollmentCampaignFixture()
    substituted.payloadRelationshipScope = {
      ...substituted.payloadRelationshipScope,
      sourceDigest: `sha256:${'f'.repeat(64)}`,
    }
    expect(() => createEnrollmentCampaignScopeStagingEvidenceManifest(substituted)).toThrow(
      'ENROLLMENT_CAMPAIGN_SCOPE_STAGING_EVIDENCE_INVALID'
    )

    const manifest = createEnrollmentCampaignScopeStagingEvidenceManifest(
      enrollmentCampaignFixture()
    )
    expect(() =>
      assertEnrollmentCampaignScopeStagingEvidenceManifest({
        ...manifest,
        entities: [
          {
            ...manifest.entities[0]!,
            campaignCourseRunGraphDigest: `sha256:${'c'.repeat(64)}`,
          },
          ...manifest.entities.slice(1),
        ],
      })
    ).toThrow('ENROLLMENT_CAMPAIGN_SCOPE_STAGING_EVIDENCE_INVALID')
  })

  it('is deterministic when samples and edges arrive in another order', () => {
    const source = enrollmentCampaignFixture()
    expect(
      serializeEnrollmentCampaignScopeStagingEvidenceManifest({
        ...source,
        samples: [...source.samples].reverse(),
      })
    ).toBe(serializeEnrollmentCampaignScopeStagingEvidenceManifest(source))
  })

  it('proposes exactly three manual bindings and rejects cross-campaign use', () => {
    const manifest = createEnrollmentCampaignScopeStagingEvidenceManifest(
      enrollmentCampaignFixture()
    )
    const reviews = labels.map((label) => `review://finance/${label}/entity/v1`)
    const targets = manifest.entities.map((entity) => ({
      artifactDigest: entity.artifactDigest,
      entityReviewReference: reviews.find(
        (review) => sha256(review) === entity.entityReviewReferenceDigest
      )!,
    }))
    const proposal = createEnrollmentCampaignScopeBindingProposal({
      manifest,
      campaignReviewReference,
      readinessReviewReference,
      entities: targets,
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
          binding.gate === ENROLLMENT_CAMPAIGN_SCOPE_REVIEWED_READINESS_GATE &&
          binding.artifactKind === 'cep_multi_entity_enrollment_campaign_scope_review_evidence'
      )
    ).toBe(true)

    expect(() =>
      createEnrollmentCampaignScopeBindingProposal({
        manifest,
        campaignReviewReference: 'review://campaign/other/v1',
        readinessReviewReference,
        entities: targets,
      })
    ).toThrowError(
      expect.objectContaining<Partial<EnrollmentCampaignScopeBindingError>>({
        code: 'ENROLLMENT_CAMPAIGN_SCOPE_CAMPAIGN_MISMATCH',
      })
    )
  })

  it('exports no read, execute, apply, activation or permission operation', async () => {
    const module = await import('../enrollment-campaign-scope-staging-evidence')
    expect(
      Object.keys(module).filter((key) =>
        /read|invoke|execute|apply|activate|deploy|permission|superadmin/i.test(key)
      )
    ).toEqual([])
  })
})
