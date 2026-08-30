import { describe, expect, it } from 'vitest'

import {
  assertUnifiedPublicWebEvidenceArtifact,
  createUnifiedPublicWebEvidenceArtifact,
  serializeUnifiedPublicWebEvidenceArtifact,
  type UnifiedPublicWebEvidenceInput,
} from '../src/multi-entity-unified-public-web-evidence'
import {
  compareMultiEntityPublicProjection,
  type CurrentPublicProjectionBaseline,
} from '../src/multi-entity-public-projection-runner'
import { planMultiEntityPublicProjection } from '../src/multi-entity-public-projection'
import type { PublicProjectionStagingEvidenceSample } from '../src/multi-entity-public-projection-evidence'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const baseline: CurrentPublicProjectionBaseline = {
  courseSlugs: ['curso-publico'],
  cycleSlugs: [],
  campusSlugs: ['sede-norte', 'sede-santa-cruz', 'sede-sur'],
  runSlugs: ['NOR-2026-001', 'SC-2026-001', 'SUR-2026-001'],
}

function projectionInput(statuses = ['enrollment_open', 'enrollment_open', 'enrollment_open']) {
  return {
    targetTenantId: 'tenant-private',
    legalEntities: [1, 2, 3].map((index) => ({
      id: `entity-${index}-private`,
      tenantId: 'tenant-private',
      status: 'validated' as const,
    })),
    campusBindings: [1, 2, 3].map((index) => ({
      id: `binding-${index}-private`,
      tenantId: 'tenant-private',
      legalEntityId: `entity-${index}-private`,
      campusId: `campus-${index}-private`,
      status: 'validated' as const,
    })),
    courses: [
      {
        id: 'course-shared-private',
        tenantId: 'tenant-private',
        slug: 'curso-publico',
        title: 'Curso público',
        active: true,
      },
    ],
    cycles: [],
    campuses: [
      {
        id: 'campus-1-private',
        tenantId: 'tenant-private',
        slug: 'sede-norte',
        name: 'Norte',
        city: null,
        active: true,
      },
      {
        id: 'campus-2-private',
        tenantId: 'tenant-private',
        slug: 'sede-santa-cruz',
        name: 'Santa Cruz',
        city: null,
        active: true,
      },
      {
        id: 'campus-3-private',
        tenantId: 'tenant-private',
        slug: 'sede-sur',
        name: 'Sur',
        city: null,
        active: true,
      },
    ],
    courseRuns: [1, 2, 3].map((index) => ({
      id: `run-${index}-private`,
      tenantId: 'tenant-private',
      legalEntityId: `entity-${index}-private`,
      courseId: 'course-shared-private',
      cycleId: null,
      campusId: `campus-${index}-private`,
      publicSlug: ['NOR-2026-001', 'SC-2026-001', 'SUR-2026-001'][index - 1]!,
      status: statuses[index - 1] as 'enrollment_open',
      startDate: '2026-09-01',
      modality: 'presential' as const,
    })),
  }
}

function sample(index: number, statuses?: string[]): PublicProjectionStagingEvidenceSample {
  const source = projectionInput(statuses) as any
  if (statuses && statuses.length > 3) {
    source.courseRuns = [
      ...source.courseRuns,
      ...statuses.slice(3).map((status, offset) => ({
        ...source.courseRuns[0],
        id: `run-cancelled-${offset + 1}-private`,
        publicSlug: `ONLINE-2026-00${offset + 1}`,
        campusId: null,
        status,
      })),
    ]
  }
  const plan = planMultiEntityPublicProjection(source)
  return {
    evidenceReference: `evidence://public-web/sample-${index}`,
    observation: compareMultiEntityPublicProjection(plan, baseline),
  }
}

function input(): UnifiedPublicWebEvidenceInput {
  return {
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: [
      sample(1),
      sample(2, ['enrollment_open', 'enrollment_open', 'enrollment_open', 'cancelled']),
      sample(3, ['enrollment_open', 'enrollment_open', 'enrollment_open', 'cancelled', 'draft']),
    ],
  }
}

describe('unified public web evidence', () => {
  it('seals three aligned public samples covering three campuses and runs', () => {
    const artifact = createUnifiedPublicWebEvidenceArtifact(input())
    expect(artifact).toMatchObject({
      kind: 'cep_unified_public_web_review_evidence',
      mode: 'three_sample_unified_public_surface_review',
      verdict: 'eligible_for_manual_staging_binding',
      canReadPayload: false,
      canWrite: false,
      canPublish: false,
      canActivate: false,
      canChangePermissions: false,
      canExposeEntityData: false,
      metrics: {
        requiredSamples: 3,
        reviewedSamples: 3,
        alignedSamples: 3,
        divergentSamples: 0,
        blockedSamples: 0,
        minimumPublicCampuses: 3,
        minimumProjectedRuns: 3,
        minimumSharedPublicCourses: 1,
        sourceCampusesMin: 3,
        projectedRunsMin: 3,
        sharedPublicCoursesMin: 1,
        totalDifferences: 0,
      },
    })
    expect(() => assertUnifiedPublicWebEvidenceArtifact(artifact)).not.toThrow()
  })

  it('is deterministic and accepts filtered non-public runs without exposing them', () => {
    const source = input()
    const filtered = sample(1, [
      'enrollment_open',
      'enrollment_open',
      'enrollment_open',
      'cancelled',
      'draft',
      'completed',
    ])
    const artifact = createUnifiedPublicWebEvidenceArtifact({
      ...source,
      samples: [filtered, source.samples[1]!, source.samples[2]!],
    })
    expect(artifact.metrics.ignoredNonPublicRuns).toBe(3)
    expect(
      serializeUnifiedPublicWebEvidenceArtifact({
        ...source,
        samples: [...source.samples].reverse(),
      })
    ).toBe(serializeUnifiedPublicWebEvidenceArtifact(source))
    for (const value of [
      'tenant-private',
      'entity-1-private',
      'course-shared-private',
      'NOR-2026-001',
    ]) {
      expect(JSON.stringify(artifact)).not.toContain(value)
    }
  })

  it('rejects fewer samples, divergence and blocked projection', () => {
    const source = input()
    expect(() =>
      createUnifiedPublicWebEvidenceArtifact({ ...source, samples: source.samples.slice(1) })
    ).toThrow('UNIFIED_PUBLIC_WEB_EVIDENCE_INVALID')
    const divergent = sample(4)
    divergent.observation = compareMultiEntityPublicProjection(
      planMultiEntityPublicProjection(projectionInput()),
      { ...baseline, runSlugs: ['different-run'] }
    )
    expect(() =>
      createUnifiedPublicWebEvidenceArtifact({
        ...source,
        samples: [source.samples[0]!, source.samples[1]!, divergent],
      })
    ).toThrow('UNIFIED_PUBLIC_WEB_EVIDENCE_INVALID')
    const blockedPlan = planMultiEntityPublicProjection({
      ...projectionInput(),
      legalEntities: [{ ...projectionInput().legalEntities[0]!, status: 'proposed' }],
    })
    const blocked = {
      evidenceReference: 'evidence://public-web/blocked',
      observation: compareMultiEntityPublicProjection(blockedPlan, {
        courseSlugs: [],
        cycleSlugs: [],
        campusSlugs: [],
        runSlugs: [],
      }),
    }
    expect(() =>
      createUnifiedPublicWebEvidenceArtifact({
        ...source,
        samples: [source.samples[0]!, source.samples[1]!, blocked],
      })
    ).toThrow('UNIFIED_PUBLIC_WEB_EVIDENCE_INVALID')
  })

  it.each([
    ['digest', { artifactDigest: `sha256:${'f'.repeat(64)}` }],
    ['publish', { canPublish: true }],
    ['entity exposure', { canExposeEntityData: true }],
  ])('rejects forged sealed evidence: %s', (_label, change) => {
    const artifact = createUnifiedPublicWebEvidenceArtifact(input())
    expect(() => assertUnifiedPublicWebEvidenceArtifact({ ...artifact, ...change })).toThrow(
      'UNIFIED_PUBLIC_WEB_EVIDENCE_INVALID'
    )
  })

  it('rejects an otherwise valid artifact with non-canonical sample digest order', () => {
    const artifact = createUnifiedPublicWebEvidenceArtifact(input())
    expect(() =>
      assertUnifiedPublicWebEvidenceArtifact({
        ...artifact,
        sampleObservationDigests: [...artifact.sampleObservationDigests].reverse(),
      })
    ).toThrow('UNIFIED_PUBLIC_WEB_EVIDENCE_INVALID')
  })

  it('exports no publication or permission mutation function', async () => {
    const module = await import('../src/multi-entity-unified-public-web-evidence')
    expect(
      Object.keys(module).some((key) => /publish|activate|permission|write|apply/i.test(key))
    ).toBe(false)
  })
})
