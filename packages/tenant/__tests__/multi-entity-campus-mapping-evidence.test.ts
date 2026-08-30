import { describe, expect, it } from 'vitest'

import {
  assertCampusMappingEvidenceArtifact,
  createCampusMappingEvidenceArtifact,
  type CampusMappingEvidenceInput,
} from '../src/multi-entity-campus-mapping-evidence'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`

function sample(
  label: 'norte' | 'santa-cruz' | 'sur',
  index: number
): CampusMappingEvidenceInput['samples'][number] {
  const pilot = label === 'sur'
  const campusId = `campus-${label}`
  return {
    tenantId: 'tenant-private',
    legalEntityId: `entity-${label}-private`,
    role: pilot ? 'cep_sur_pilot' : 'existing_entity',
    entityReviewReference: `review://entity/${label}/campus/v1`,
    ...(pilot ? { pilotReviewReference: 'review://entity/sur/campus-pilot/v1' } : {}),
    campuses: [{ id: campusId, tenantId: 'tenant-private', status: 'validated' }],
    classrooms: [
      {
        id: `classroom-${label}-${index}`,
        tenantId: 'tenant-private',
        campusId,
        status: 'validated',
      },
    ],
    bindings: [
      {
        id: `binding-${label}`,
        tenantId: 'tenant-private',
        legalEntityId: `entity-${label}-private`,
        campusId,
        status: 'validated',
      },
    ],
  }
}

function input(
  samples: CampusMappingEvidenceInput['samples'] = [
    sample('norte', 1),
    sample('santa-cruz', 2),
    sample('sur', 3),
  ]
): CampusMappingEvidenceInput {
  return {
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples,
  }
}

describe('multi-entity campus mapping evidence', () => {
  it('seals three entity campus/classroom mappings without raw topology values', () => {
    const artifact = createCampusMappingEvidenceArtifact(input())

    expect(artifact).toMatchObject({
      kind: 'cep_multi_entity_campus_mapping_review_evidence',
      mode: 'three_entity_redacted_campus_mapping_review',
      verdict: 'eligible_for_manual_staging_binding',
      canReadPayload: false,
      canBindAutomatically: false,
      canMarkVerified: false,
      canDeploy: false,
      canActivate: false,
      canWrite: false,
      canApply: false,
      canChangePermissions: false,
      metrics: {
        expectedEntities: 3,
        mappedEntities: 3,
        validatedCampuses: 3,
        validatedClassrooms: 3,
        validatedBindings: 3,
        orphanCampuses: 0,
        orphanClassrooms: 0,
        crossEntityRecords: 0,
        payloadReads: 0,
        writes: 0,
      },
    })
    expect(artifact.entities).toHaveLength(3)
    expect(JSON.stringify(artifact)).not.toContain('campus-norte')
    expect(JSON.stringify(artifact)).not.toContain('classroom-norte-1')
    expect(JSON.stringify(artifact)).not.toContain('entity-sur-private')
    expect(() => assertCampusMappingEvidenceArtifact(artifact)).not.toThrow()
  })

  it('detects duplicate campus ownership across entities', () => {
    const duplicate = sample('santa-cruz', 2)
    const samples = [
      sample('norte', 1),
      { ...duplicate, campuses: [{ ...duplicate.campuses[0]!, id: 'campus-norte' }] },
      sample('sur', 3),
    ]

    expect(() => createCampusMappingEvidenceArtifact(input(samples))).toThrow(
      'MULTI_ENTITY_CAMPUS_MAPPING_EVIDENCE_INVALID'
    )
  })

  it('detects orphan classrooms and bindings to an unknown campus', () => {
    const north = sample('norte', 1)
    const orphan = {
      ...north,
      classrooms: [{ ...north.classrooms[0]!, campusId: 'campus-missing' }],
    }
    expect(() =>
      createCampusMappingEvidenceArtifact(
        input([orphan, sample('santa-cruz', 2), sample('sur', 3)])
      )
    ).toThrow('MULTI_ENTITY_CAMPUS_MAPPING_EVIDENCE_INVALID')

    const unknownBinding = {
      ...north,
      bindings: [{ ...north.bindings[0]!, campusId: 'campus-missing' }],
    }
    expect(() =>
      createCampusMappingEvidenceArtifact(
        input([unknownBinding, sample('santa-cruz', 2), sample('sur', 3)])
      )
    ).toThrow('MULTI_ENTITY_CAMPUS_MAPPING_EVIDENCE_INVALID')
  })

  it('detects tenant and entity ownership mismatches', () => {
    const north = sample('norte', 1)
    const crossTenant = {
      ...north,
      classrooms: [{ ...north.classrooms[0]!, tenantId: 'tenant-other' }],
    }
    expect(() =>
      createCampusMappingEvidenceArtifact(
        input([crossTenant, sample('santa-cruz', 2), sample('sur', 3)])
      )
    ).toThrow('MULTI_ENTITY_CAMPUS_MAPPING_EVIDENCE_INVALID')

    const crossEntity = {
      ...north,
      bindings: [{ ...north.bindings[0]!, legalEntityId: 'entity-other' }],
    }
    expect(() =>
      createCampusMappingEvidenceArtifact(
        input([crossEntity, sample('santa-cruz', 2), sample('sur', 3)])
      )
    ).toThrow('MULTI_ENTITY_CAMPUS_MAPPING_EVIDENCE_INVALID')
  })

  it('requires one CEP Sur pilot and rejects reused review references', () => {
    const noPilot = [
      sample('norte', 1),
      sample('santa-cruz', 2),
      { ...sample('sur', 3), role: 'existing_entity' as const, pilotReviewReference: undefined },
    ]
    expect(() => createCampusMappingEvidenceArtifact(input(noPilot))).toThrow(
      'MULTI_ENTITY_CAMPUS_MAPPING_EVIDENCE_INVALID'
    )

    const reusedReview = [
      { ...sample('norte', 1), entityReviewReference: 'review://shared/v1' },
      { ...sample('santa-cruz', 2), entityReviewReference: 'review://shared/v1' },
      sample('sur', 3),
    ]
    expect(() => createCampusMappingEvidenceArtifact(input(reusedReview))).toThrow(
      'MULTI_ENTITY_CAMPUS_MAPPING_EVIDENCE_INVALID'
    )
  })
})
