import { describe, expect, it } from 'vitest'
import {
  PUBLIC_PROJECTION_MINIMUM_ALIGNED_STAGING_RUNS,
  createPublicProjectionStagingEvidenceManifest,
  serializePublicProjectionStagingEvidenceManifest,
  type PublicProjectionStagingEvidenceSample,
} from '../src/multi-entity-public-projection-evidence'
import { planMultiEntityPublicProjection } from '../src/multi-entity-public-projection'
import {
  compareMultiEntityPublicProjection,
  type CurrentPublicProjectionBaseline,
  type RedactedPublicProjectionShadowComparison,
} from '../src/multi-entity-public-projection-runner'

const baseline: CurrentPublicProjectionBaseline = {
  courseSlugs: ['curso-publico'],
  cycleSlugs: [],
  campusSlugs: ['sede-publica'],
  runSlugs: ['NOR-2026-001'],
}

function observation(
  entityStatus: 'proposed' | 'validated' = 'validated',
  currentBaseline: CurrentPublicProjectionBaseline = baseline
): RedactedPublicProjectionShadowComparison {
  const plan = planMultiEntityPublicProjection({
    targetTenantId: 'tenant-secret',
    legalEntities: [{ id: 'entity-secret', tenantId: 'tenant-secret', status: entityStatus }],
    campusBindings: [
      {
        id: 'binding-secret',
        tenantId: 'tenant-secret',
        legalEntityId: 'entity-secret',
        campusId: 'campus-secret',
        status: 'validated',
      },
    ],
    courses: [
      {
        id: 'course-secret',
        tenantId: 'tenant-secret',
        slug: 'curso-publico',
        title: 'Curso público',
        active: true,
      },
    ],
    cycles: [],
    campuses: [
      {
        id: 'campus-secret',
        tenantId: 'tenant-secret',
        slug: 'sede-publica',
        name: 'Sede pública',
        city: null,
        active: true,
      },
    ],
    courseRuns: [
      {
        id: 'run-secret',
        tenantId: 'tenant-secret',
        legalEntityId: 'entity-secret',
        courseId: 'course-secret',
        cycleId: null,
        campusId: 'campus-secret',
        publicSlug: 'NOR-2026-001',
        status: 'enrollment_open',
        startDate: '2026-09-01',
        modality: 'presential',
      },
    ],
  })
  return compareMultiEntityPublicProjection(plan, currentBaseline)
}

function samples(
  count: number,
  value: RedactedPublicProjectionShadowComparison = observation()
): PublicProjectionStagingEvidenceSample[] {
  return Array.from({ length: count }, (_, index) => ({
    evidenceReference: `evidence://public-shadow/staging-${index + 1}`,
    observation: value,
  }))
}

describe('public projection staging evidence manifest', () => {
  it('requires three independently referenced aligned samples before review', () => {
    expect(PUBLIC_PROJECTION_MINIMUM_ALIGNED_STAGING_RUNS).toBe(3)
    expect(createPublicProjectionStagingEvidenceManifest(samples(2))).toMatchObject({
      verdict: 'insufficient_evidence',
      canPublish: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: { runs: 2, requiredAlignedRuns: 3, alignedRuns: 2 },
    })

    expect(createPublicProjectionStagingEvidenceManifest(samples(3))).toMatchObject({
      verdict: 'ready_for_staging_review',
      canPublish: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: {
        runs: 3,
        alignedRuns: 3,
        divergentRuns: 0,
        blockedRuns: 0,
        totalDifferences: 0,
        projectedRunsMin: 1,
        projectedRunsMax: 1,
      },
    })
  })

  it('keeps empty evidence insufficient and numerically bounded', () => {
    expect(createPublicProjectionStagingEvidenceManifest([])).toMatchObject({
      verdict: 'insufficient_evidence',
      metrics: {
        runs: 0,
        projectedRunsMin: 0,
        projectedRunsMax: 0,
      },
    })
  })

  it('reports divergence even when three other samples align', () => {
    const divergent = observation('validated', {
      ...baseline,
      courseSlugs: ['otro-curso'],
    })
    const manifest = createPublicProjectionStagingEvidenceManifest([
      ...samples(3),
      { evidenceReference: 'evidence://public-shadow/divergent', observation: divergent },
    ])
    expect(manifest).toMatchObject({
      verdict: 'divergent',
      metrics: { alignedRuns: 3, divergentRuns: 1, blockedRuns: 0, totalDifferences: 2 },
    })
  })

  it('gives blocked observations precedence over aligned and divergent samples', () => {
    const divergent = observation('validated', { ...baseline, runSlugs: [] })
    const blocked = observation('proposed', {
      courseSlugs: [],
      cycleSlugs: [],
      campusSlugs: [],
      runSlugs: [],
    })
    const manifest = createPublicProjectionStagingEvidenceManifest([
      ...samples(3),
      { evidenceReference: 'evidence://public-shadow/divergent', observation: divergent },
      { evidenceReference: 'evidence://public-shadow/blocked', observation: blocked },
    ])
    expect(manifest).toMatchObject({
      verdict: 'blocked',
      metrics: { alignedRuns: 3, divergentRuns: 1, blockedRuns: 1 },
    })
  })

  it('rejects duplicate references, extra fields and more than 100 samples', () => {
    const duplicate = samples(2)
    duplicate[1] = { ...duplicate[1]!, evidenceReference: duplicate[0]!.evidenceReference }
    expect(() => createPublicProjectionStagingEvidenceManifest(duplicate)).toThrow(
      'MULTI_ENTITY_PUBLIC_PROJECTION_EVIDENCE_INVALID'
    )
    expect(() =>
      createPublicProjectionStagingEvidenceManifest([
        { ...samples(1)[0]!, sourceSha: 'secret' } as never,
      ])
    ).toThrow('MULTI_ENTITY_PUBLIC_PROJECTION_EVIDENCE_INVALID')
    expect(() => createPublicProjectionStagingEvidenceManifest(samples(101))).toThrow(
      'MULTI_ENTITY_PUBLIC_PROJECTION_EVIDENCE_INVALID'
    )
  })

  it.each([
    (value: RedactedPublicProjectionShadowComparison) => ({ ...value, canPublish: true }),
    (value: RedactedPublicProjectionShadowComparison) => ({
      ...value,
      projection: { ...value.projection, projectedRuns: -1 },
    }),
    (value: RedactedPublicProjectionShadowComparison) => ({
      ...value,
      comparison: { ...value.comparison, totalDifferences: 99 },
    }),
    (value: RedactedPublicProjectionShadowComparison) => ({
      ...value,
      comparison: {
        ...value.comparison,
        courses: { ...value.comparison.courses, matched: 99 },
      },
    }),
  ])('rejects forged or internally inconsistent observations', (forge) => {
    expect(() =>
      createPublicProjectionStagingEvidenceManifest([
        {
          evidenceReference: 'evidence://public-shadow/forged',
          observation: forge(observation()) as never,
        },
      ])
    ).toThrow('MULTI_ENTITY_PUBLIC_PROJECTION_EVIDENCE_INVALID')
  })

  it('serializes deterministic aggregate evidence without references or public values', () => {
    const input = samples(3)
    const before = JSON.stringify(input)
    const serialized = serializePublicProjectionStagingEvidenceManifest(input)
    expect(JSON.parse(serialized)).toEqual(
      createPublicProjectionStagingEvidenceManifest([...input].reverse())
    )
    expect(JSON.stringify(input)).toBe(before)
    for (const value of [
      'evidence://',
      'tenant-secret',
      'entity-secret',
      'curso-publico',
      'sede-publica',
      'NOR-2026-001',
    ]) {
      expect(serialized).not.toContain(value)
    }
  })

  it('exports no apply, publish, activation or permission mutation function', async () => {
    const module = await import('../src/multi-entity-public-projection-evidence')
    expect(
      Object.keys(module).filter((key) =>
        /apply|publish|activate|permission|execute|write/i.test(key)
      )
    ).toEqual([])
  })
})
