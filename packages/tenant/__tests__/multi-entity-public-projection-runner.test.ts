import { describe, expect, it, vi } from 'vitest'
import { planMultiEntityPublicProjection } from '../src/multi-entity-public-projection'
import {
  MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_ENVIRONMENT,
  MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_FLAG,
  compareMultiEntityPublicProjection,
  resolvePublicProjectionShadowRunnerGate,
  runPublicProjectionShadowComparison,
  type CurrentPublicProjectionBaseline,
} from '../src/multi-entity-public-projection-runner'

function input(entityStatus: 'proposed' | 'validated' = 'validated') {
  return {
    targetTenantId: 'tenant-secret',
    legalEntities: [{ id: 'entity-secret', tenantId: 'tenant-secret', status: entityStatus }],
    campusBindings: [
      {
        id: 'binding-secret',
        tenantId: 'tenant-secret',
        legalEntityId: 'entity-secret',
        campusId: 'campus-secret',
        status: 'validated' as const,
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
        city: 'Ciudad pública',
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
        status: 'enrollment_open' as const,
        startDate: '2026-09-01',
        modality: 'presential' as const,
      },
    ],
  }
}

const baseline: CurrentPublicProjectionBaseline = {
  courseSlugs: ['curso-publico'],
  cycleSlugs: [],
  campusSlugs: ['sede-publica'],
  runSlugs: ['NOR-2026-001'],
}

const staging = {
  [MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_FLAG]: 'true',
  [MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_ENVIRONMENT]: 'staging',
}

describe('public projection shadow comparison runner', () => {
  it.each([
    [{}, 'flag_disabled'],
    [
      { [MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_FLAG]: 'true' },
      'environment_missing_or_invalid',
    ],
    [
      {
        [MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_FLAG]: 'true',
        [MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_ENVIRONMENT]: 'production',
      },
      'production_forbidden',
    ],
  ])('fails closed for gate %o', (environment, reason) => {
    expect(resolvePublicProjectionShadowRunnerGate(environment)).toEqual({
      enabled: false,
      reason,
    })
  })

  it('does not load either source while the flag is closed', async () => {
    const loadProjectionInput = vi.fn(async () => input())
    const loadCurrentBaseline = vi.fn(async () => baseline)
    const result = await runPublicProjectionShadowComparison({
      environment: {},
      loadProjectionInput,
      loadCurrentBaseline,
    })

    expect(result).toEqual({
      status: 'skipped',
      reason: 'flag_disabled',
      canPublish: false,
      canActivate: false,
    })
    expect(loadProjectionInput).not.toHaveBeenCalled()
    expect(loadCurrentBaseline).not.toHaveBeenCalled()
  })

  it('reports an aligned staging comparison without exposing values', async () => {
    const loadProjectionInput = vi.fn(async () => input())
    const loadCurrentBaseline = vi.fn(async () => baseline)
    const result = await runPublicProjectionShadowComparison({
      environment: staging,
      loadProjectionInput,
      loadCurrentBaseline,
    })

    expect(loadProjectionInput).toHaveBeenCalledTimes(1)
    expect(loadCurrentBaseline).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      status: 'observed',
      reason: 'shadow_compared',
      canPublish: false,
      canActivate: false,
      observation: {
        verdict: 'aligned',
        comparison: {
          totalDifferences: 0,
          courses: { baseline: 1, projected: 1, matched: 1 },
          cycles: { baseline: 0, projected: 0, matched: 0 },
          campuses: { baseline: 1, projected: 1, matched: 1 },
          runs: { baseline: 1, projected: 1, matched: 1 },
        },
      },
    })
    const serialized = JSON.stringify(result)
    for (const secret of [
      'tenant-secret',
      'entity-secret',
      'curso-publico',
      'sede-publica',
      'NOR-2026-001',
    ]) {
      expect(serialized).not.toContain(secret)
    }
  })

  it('counts missing and new values without exposing which values differ', () => {
    const plan = planMultiEntityPublicProjection(input())
    const observation = compareMultiEntityPublicProjection(plan, {
      courseSlugs: ['otro-curso'],
      cycleSlugs: [],
      campusSlugs: ['sede-publica'],
      runSlugs: [],
    })

    expect(observation.verdict).toBe('divergent')
    expect(observation.comparison.courses).toEqual({
      baseline: 1,
      projected: 1,
      matched: 0,
      missingFromProjection: 1,
      newInProjection: 1,
    })
    expect(observation.comparison.totalDifferences).toBe(3)
    expect(JSON.stringify(observation)).not.toContain('otro-curso')
  })

  it('keeps a blocked projection blocked regardless of matching empty baseline', () => {
    const plan = planMultiEntityPublicProjection(input('proposed'))
    const observation = compareMultiEntityPublicProjection(plan, {
      courseSlugs: [],
      cycleSlugs: [],
      campusSlugs: [],
      runSlugs: [],
    })
    expect(observation.verdict).toBe('blocked')
    expect(observation.canPublish).toBe(false)
  })

  it.each([
    { ...baseline, courseSlugs: ['curso-publico', 'curso-publico'] },
    { ...baseline, runSlugs: ['invalid path'] },
    { ...baseline, hiddenEntityIds: ['entity-secret'] },
  ])('rejects malformed or widened baseline contracts', (value) => {
    expect(() =>
      compareMultiEntityPublicProjection(planMultiEntityPublicProjection(input()), value as never)
    ).toThrow('MULTI_ENTITY_PUBLIC_BASELINE_INVALID')
  })

  it('rejects a forged projection plan before comparison telemetry is emitted', () => {
    const plan = planMultiEntityPublicProjection(input())
    expect(() =>
      compareMultiEntityPublicProjection({ ...plan, canPublish: true } as never, baseline)
    ).toThrow('MULTI_ENTITY_PUBLIC_PROJECTION_PLAN_INVALID')
  })

  it('redacts projection and baseline loader failures', async () => {
    const projectionFailure = await runPublicProjectionShadowComparison({
      environment: staging,
      loadProjectionInput: async () => {
        throw new Error('postgres://admin:secret@example.test')
      },
      loadCurrentBaseline: async () => baseline,
    })
    expect(projectionFailure).toEqual({
      status: 'failed',
      reason: 'projection_snapshot_load_failed',
      canPublish: false,
      canActivate: false,
    })

    const baselineFailure = await runPublicProjectionShadowComparison({
      environment: staging,
      loadProjectionInput: async () => input(),
      loadCurrentBaseline: async () => {
        throw new Error('https://user:secret@example.test')
      },
    })
    expect(baselineFailure).toEqual({
      status: 'failed',
      reason: 'baseline_load_failed',
      canPublish: false,
      canActivate: false,
    })
    expect(JSON.stringify([projectionFailure, baselineFailure])).not.toContain('secret@example')
  })

  it('contains no apply, write, publish or activate function', async () => {
    const module = await import('../src/multi-entity-public-projection-runner')
    expect(
      Object.keys(module).filter((key) => /apply|write|publish|activate|execute/i.test(key))
    ).toEqual([])
  })
})
