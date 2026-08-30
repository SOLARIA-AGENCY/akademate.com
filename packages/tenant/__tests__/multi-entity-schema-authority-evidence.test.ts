import { describe, expect, it } from 'vitest'

import {
  assertMultiEntitySchemaAuthorityReviewEvidenceArtifact,
  createMultiEntitySchemaAuthorityReviewEvidenceArtifact,
  serializeMultiEntitySchemaAuthorityReviewEvidenceArtifact,
  type MultiEntitySchemaAuthorityReviewEvidenceInput,
} from '../src/multi-entity-schema-authority-evidence'

const campaignReviewReference = 'review://campaign/cep-multi-entity/schema-authority-v1'
const readinessReviewReference = 'review://staging/readiness/schema-authority-v1'
const decisionReference = 'review://authority/payload-cep/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const schemaFingerprintDigest = `sha256:${'c'.repeat(64)}`
const schemaExpansionPlanDigest = `sha256:${'d'.repeat(64)}`

function input(): MultiEntitySchemaAuthorityReviewEvidenceInput {
  return {
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    decisionReference,
    authority: 'payload',
    schemaFingerprintDigest,
    schemaExpansionPlanDigest,
  }
}

describe('multi-entity schema authority evidence', () => {
  it('seals an explicit authority decision without migration or activation authority', () => {
    const artifact = createMultiEntitySchemaAuthorityReviewEvidenceArtifact(input())
    expect(artifact).toMatchObject({
      kind: 'cep_multi_entity_schema_authority_review_evidence',
      gate: 'schema_authority_decided',
      verdict: 'review_recorded_no_execution_authority',
      authority: 'payload',
      schemaExpansionPlanDigest,
      canReadPayload: false,
      canWrite: false,
      canApply: false,
      canDeploy: false,
      canActivate: false,
      productionMigrationApplied: false,
      productionBackfillApplied: false,
      metrics: {
        reviewedDecisions: 1,
        schemaReads: 0,
        migrationsApplied: 0,
        backfillsApplied: 0,
        productionWrites: 0,
        runtimeActivations: 0,
      },
    })
    expect(() => assertMultiEntitySchemaAuthorityReviewEvidenceArtifact(artifact)).not.toThrow()
    expect(Object.isFrozen(artifact)).toBe(true)
  })

  it('is deterministic for either explicit authority option', () => {
    const first = serializeMultiEntitySchemaAuthorityReviewEvidenceArtifact(input())
    const second = serializeMultiEntitySchemaAuthorityReviewEvidenceArtifact({
      ...input(),
      authority: 'payload',
    })
    const controlPlane = createMultiEntitySchemaAuthorityReviewEvidenceArtifact({
      ...input(),
      authority: 'drizzle_control_plane',
    })
    expect(second).toBe(first)
    expect(controlPlane.authority).toBe('drizzle_control_plane')
    expect(controlPlane.artifactDigest).not.toBe(
      createMultiEntitySchemaAuthorityReviewEvidenceArtifact(input()).artifactDigest
    )
  })

  it.each([
    ['non-staging environment', { reviewEnvironment: 'production' }],
    ['invalid authority', { authority: 'both' }],
    ['invalid decision reference', { decisionReference: 'decision-1' }],
    ['reused decision reference', { decisionReference: campaignReviewReference }],
    ['invalid fingerprint', { schemaFingerprintDigest: 'sha256:not-a-digest' }],
    ['invalid plan digest', { schemaExpansionPlanDigest: 'sha256:not-a-digest' }],
    ['reused schema digest', { schemaExpansionPlanDigest: schemaFingerprintDigest }],
  ])('rejects %s', (_label, change) => {
    expect(() =>
      createMultiEntitySchemaAuthorityReviewEvidenceArtifact({
        ...input(),
        ...change,
      } as never)
    ).toThrow('MULTI_ENTITY_SCHEMA_AUTHORITY_EVIDENCE_INVALID')
  })

  it.each([
    ['artifact digest', { artifactDigest: `sha256:${'f'.repeat(64)}` }],
    ['authority digest', { authorityDigest: `sha256:${'e'.repeat(64)}` }],
    ['metrics', { metrics: { reviewedDecisions: 2 } }],
    ['extra key', { unexpected: true }],
    ['payload read capability', { canReadPayload: true }],
    ['write capability', { canWrite: true }],
    ['automatic binding capability', { canBindAutomatically: true }],
    ['verification capability', { canMarkVerified: true }],
    ['deployment capability', { canDeploy: true }],
    ['migration application', { productionMigrationApplied: true }],
    ['backfill application', { productionBackfillApplied: true }],
    ['activation capability', { canActivate: true }],
    ['permission capability', { canChangePermissions: true }],
  ])('rejects forged %s', (_label, change) => {
    const artifact = createMultiEntitySchemaAuthorityReviewEvidenceArtifact(input())
    expect(() =>
      assertMultiEntitySchemaAuthorityReviewEvidenceArtifact({ ...artifact, ...change })
    ).toThrow('MULTI_ENTITY_SCHEMA_AUTHORITY_EVIDENCE_INVALID')
  })

  it('does not serialize raw review references or schema literals', () => {
    const serialized = serializeMultiEntitySchemaAuthorityReviewEvidenceArtifact(input())
    expect(serialized).not.toContain('review://')
    expect(serialized).not.toContain(decisionReference)
    expect(serialized).not.toContain('payload_schema')
    expect(serialized).not.toContain('drizzle_schema')
  })
})
