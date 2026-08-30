import { describe, expect, it } from 'vitest'

import {
  assertMultiEntityLegalProfileReviewEvidenceArtifact,
  createMultiEntityLegalProfileReviewEvidenceArtifact,
  serializeMultiEntityLegalProfileReviewEvidenceArtifact,
  type MultiEntityLegalProfileReviewEvidenceInput,
} from '../src/multi-entity-legal-profile-evidence'

const campaignReviewReference = 'review://campaign/cep-multi-entity/legal-profile-v1'
const readinessReviewReference = 'review://staging/readiness/legal-profile-v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`

function input(): MultiEntityLegalProfileReviewEvidenceInput {
  return {
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    entities: [
      entity('norte', false, '12345678Z'),
      entity('santa_cruz', false, '87654321X'),
      entity('sur', true, 'X1234567L'),
    ],
  }
}

function entity(role: 'norte' | 'santa_cruz' | 'sur', pilot: boolean, nif: string) {
  return {
    id: `entity-${role}-private`,
    tenantId: 'tenant-cep-private',
    role,
    pilot,
    reviewReference: `review://legal-profile/${role}/v1`,
    legalName: `  CEP Formación ${role}  `,
    nif,
    registeredAddress: {
      line1: `  Calle ${role}, 1 `,
      postalCode: ' 28001 ',
      locality: ' Madrid ',
      region: ' Comunidad de Madrid ',
      countryCode: ' es ',
    },
    legalContact: {
      fullName: ' María Legal ',
      email: ` LEGAL+${role}@CEP.EXAMPLE `,
      phone: ' +34 600 123 456 ',
    },
  }
}

describe('multi-entity legal profile evidence', () => {
  it('seals exactly Norte, Santa Cruz and one CEP Sur pilot without operational authority', () => {
    const artifact = createMultiEntityLegalProfileReviewEvidenceArtifact(input())
    expect(artifact).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_multi_entity_legal_profile_review_evidence',
      gate: 'legal_profile_reviewed',
      canReadPayload: false,
      canWrite: false,
      canApply: false,
      canBindAutomatically: false,
      canMarkVerified: false,
      canDeploy: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: { requiredEntities: 3, reviewedEntities: 3, pilotEntities: 1 },
    })
    expect(artifact.entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'cep_multi_entity_legal_profile_entity_evidence',
          role: 'norte',
          pilot: false,
        }),
        expect.objectContaining({
          kind: 'cep_multi_entity_legal_profile_entity_evidence',
          role: 'santa_cruz',
          pilot: false,
        }),
        expect.objectContaining({
          kind: 'cep_multi_entity_legal_profile_entity_evidence',
          role: 'sur',
          pilot: true,
        }),
      ])
    )
    expect(new Set(artifact.entities.map(({ artifactDigest }) => artifactDigest)).size).toBe(3)
    expect(() => assertMultiEntityLegalProfileReviewEvidenceArtifact(artifact)).not.toThrow()
    expect(Object.isFrozen(artifact)).toBe(true)
  })

  it('is deterministic after legal field normalization and entity reordering', () => {
    const first = serializeMultiEntityLegalProfileReviewEvidenceArtifact(input())
    const source = input()
    const reordered: MultiEntityLegalProfileReviewEvidenceInput = {
      ...source,
      entities: [...source.entities].reverse(),
    }
    expect(serializeMultiEntityLegalProfileReviewEvidenceArtifact(reordered)).toBe(first)
  })

  it.each([
    [
      'duplicate legal entity',
      (source: ReturnType<typeof input>) => ({
        ...source,
        entities: [
          ...source.entities.slice(0, 2),
          { ...source.entities[2]!, id: source.entities[1]!.id },
        ],
      }),
    ],
    [
      'duplicate NIF',
      (source: ReturnType<typeof input>) => ({
        ...source,
        entities: [
          ...source.entities.slice(0, 2),
          { ...source.entities[2]!, nif: source.entities[1]!.nif },
        ],
      }),
    ],
    [
      'cross-tenant entity',
      (source: ReturnType<typeof input>) => ({
        ...source,
        entities: source.entities.map((item, index) =>
          index === 1 ? { ...item, tenantId: 'other-tenant-private' } : item
        ),
      }),
    ],
    [
      'invalid NIF',
      (source: ReturnType<typeof input>) => ({
        ...source,
        entities: [...source.entities.slice(0, 2), { ...source.entities[2]!, nif: 'X1234567A' }],
      }),
    ],
    [
      'second pilot',
      (source: ReturnType<typeof input>) => ({
        ...source,
        entities: source.entities.map((item, index) =>
          index === 0 ? { ...item, pilot: true } : item
        ),
      }),
    ],
    [
      'duplicate review reference',
      (source: ReturnType<typeof input>) => ({
        ...source,
        entities: [
          ...source.entities.slice(0, 2),
          { ...source.entities[2]!, reviewReference: source.entities[1]!.reviewReference },
        ],
      }),
    ],
  ])('rejects %s', (_label, build) => {
    expect(() => createMultiEntityLegalProfileReviewEvidenceArtifact(build(input()))).toThrow(
      'MULTI_ENTITY_LEGAL_PROFILE_EVIDENCE_INVALID'
    )
  })

  it.each([
    ['digest', { artifactDigest: `sha256:${'c'.repeat(64)}` }],
    ['payload read', { canReadPayload: true }],
    ['write', { canWrite: true }],
    ['apply', { canApply: true }],
    ['automatic binding', { canBindAutomatically: true }],
    ['verification', { canMarkVerified: true }],
    ['deployment', { canDeploy: true }],
    ['activation', { canActivate: true }],
    ['permissions', { canChangePermissions: true }],
  ])('rejects forged %s authority', (_label, change) => {
    const artifact = createMultiEntityLegalProfileReviewEvidenceArtifact(input())
    expect(() =>
      assertMultiEntityLegalProfileReviewEvidenceArtifact({ ...artifact, ...change })
    ).toThrow('MULTI_ENTITY_LEGAL_PROFILE_EVIDENCE_INVALID')
  })

  it('redacts legal identity, contact and review references and exports no operational function', async () => {
    const serialized = serializeMultiEntityLegalProfileReviewEvidenceArtifact(input())
    for (const sensitiveValue of [
      'tenant-cep-private',
      'entity-norte-private',
      'CEP Formación norte',
      '12345678Z',
      'Calle norte, 1',
      'LEGAL+norte@CEP.EXAMPLE',
      'review://',
    ]) {
      expect(serialized).not.toContain(sensitiveValue)
    }
    const module = await import('../src/multi-entity-legal-profile-evidence')
    expect(
      Object.keys(module).some((key) =>
        /readPayload|write|apply|deploy|activate|permission/i.test(key)
      )
    ).toBe(false)
  })
})
