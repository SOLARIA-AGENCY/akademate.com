import { describe, expect, it } from 'vitest'
import {
  createRedactedMultiEntityPublicProjectionObservation,
  planMultiEntityPublicProjection,
  serializeMultiEntityPublicProjectionObservation,
  type MultiEntityPublicProjectionInput,
  type PublicProjectionCourseRun,
} from '../src/multi-entity-public-projection'

function input(
  overrides: Partial<MultiEntityPublicProjectionInput> = {}
): MultiEntityPublicProjectionInput {
  return {
    targetTenantId: 'cep-tenant-secret',
    legalEntities: [
      { id: 'entity-norte-secret', tenantId: 'cep-tenant-secret', status: 'validated' },
      { id: 'entity-santa-cruz-secret', tenantId: 'cep-tenant-secret', status: 'validated' },
      { id: 'entity-sur-secret', tenantId: 'cep-tenant-secret', status: 'validated' },
    ],
    campusBindings: [
      {
        id: 'binding-norte-secret',
        tenantId: 'cep-tenant-secret',
        legalEntityId: 'entity-norte-secret',
        campusId: 'campus-norte-secret',
        status: 'validated',
      },
      {
        id: 'binding-santa-cruz-secret',
        tenantId: 'cep-tenant-secret',
        legalEntityId: 'entity-santa-cruz-secret',
        campusId: 'campus-santa-cruz-secret',
        status: 'validated',
      },
      {
        id: 'binding-sur-secret',
        tenantId: 'cep-tenant-secret',
        legalEntityId: 'entity-sur-secret',
        campusId: 'campus-sur-secret',
        status: 'validated',
      },
    ],
    courses: [
      {
        id: 'course-shared-secret',
        tenantId: 'cep-tenant-secret',
        slug: 'auxiliar-veterinaria',
        title: 'Auxiliar de veterinaria',
        active: true,
      },
      {
        id: 'course-without-run-secret',
        tenantId: 'cep-tenant-secret',
        slug: 'nutricion-deportiva',
        title: 'Nutrición deportiva',
        active: true,
      },
    ],
    cycles: [],
    campuses: [
      {
        id: 'campus-norte-secret',
        tenantId: 'cep-tenant-secret',
        slug: 'sede-norte',
        name: 'CEP Norte',
        city: 'La Orotava',
        active: true,
      },
      {
        id: 'campus-santa-cruz-secret',
        tenantId: 'cep-tenant-secret',
        slug: 'sede-santa-cruz',
        name: 'CEP Santa Cruz',
        city: 'Santa Cruz de Tenerife',
        active: true,
      },
      {
        id: 'campus-sur-secret',
        tenantId: 'cep-tenant-secret',
        slug: 'sede-sur',
        name: 'CEP Sur',
        city: null,
        active: true,
      },
    ],
    courseRuns: [
      run({
        id: 'run-norte-secret',
        legalEntityId: 'entity-norte-secret',
        campusId: 'campus-norte-secret',
        publicSlug: 'av-norte-2026',
        startDate: '2026-09-01',
      }),
      run({
        id: 'run-sur-secret',
        legalEntityId: 'entity-sur-secret',
        campusId: 'campus-sur-secret',
        publicSlug: 'av-sur-2026',
        startDate: '2026-10-01T09:00:00Z',
      }),
    ],
    ...overrides,
  }
}

function run(overrides: Partial<PublicProjectionCourseRun> = {}): PublicProjectionCourseRun {
  return {
    id: 'run-default-secret',
    tenantId: 'cep-tenant-secret',
    legalEntityId: 'entity-norte-secret',
    courseId: 'course-shared-secret',
    cycleId: null,
    campusId: 'campus-norte-secret',
    publicSlug: 'run-default',
    status: 'enrollment_open',
    startDate: '2026-09-01',
    modality: 'presential',
    ...overrides,
  }
}

describe('multi-entity unified public projection', () => {
  it('publishes one shared course with entity-local runs from multiple campuses', () => {
    const plan = planMultiEntityPublicProjection(input())

    expect(plan).toMatchObject({
      mode: 'unified_public_projection_shadow',
      canPublish: false,
      canActivate: false,
      ready: true,
      summary: {
        sourceCourses: 2,
        sharedPublicCourses: 2,
        sourceCycles: 0,
        sharedPublicCycles: 0,
        sourceCampuses: 3,
        publicCampuses: 3,
        sourceRuns: 2,
        projectedRuns: 2,
        ignoredNonPublicRuns: 0,
        blockedIssues: 0,
      },
    })
    expect(plan.courses).toEqual([
      {
        slug: 'auxiliar-veterinaria',
        title: 'Auxiliar de veterinaria',
        runs: [
          expect.objectContaining({ slug: 'av-norte-2026' }),
          expect.objectContaining({ slug: 'av-sur-2026' }),
        ],
      },
      { slug: 'nutricion-deportiva', title: 'Nutrición deportiva', runs: [] },
    ])
    expect(plan.campuses.find(({ slug }) => slug === 'sede-sur')).toEqual({
      slug: 'sede-sur',
      name: 'CEP Sur',
      city: null,
      courseSlugs: ['auxiliar-veterinaria'],
      cycleSlugs: [],
      openRuns: 1,
    })
  })

  it('never exposes tenant, legal entity, binding, campus or source record IDs', () => {
    const serialized = JSON.stringify(planMultiEntityPublicProjection(input()))
    for (const secret of [
      'cep-tenant-secret',
      'entity-norte-secret',
      'entity-santa-cruz-secret',
      'entity-sur-secret',
      'binding-norte-secret',
      'campus-norte-secret',
      'course-shared-secret',
      'run-norte-secret',
    ]) {
      expect(serialized).not.toContain(secret)
    }
  })

  it('blocks the entire projection when a CEP Sur entity remains proposed', () => {
    const source = input()
    const plan = planMultiEntityPublicProjection({
      ...source,
      legalEntities: source.legalEntities.map((entity) =>
        entity.id === 'entity-sur-secret' ? { ...entity, status: 'proposed' as const } : entity
      ),
    })

    expect(plan.ready).toBe(false)
    expect(plan.courses).toEqual([])
    expect(plan.cycles).toEqual([])
    expect(plan.campuses).toEqual([])
    expect(plan.issues.map(({ code }) => code)).toContain('legal_entity_missing_or_not_validated')
  })

  it('blocks a run assigned to a campus owned by another legal entity', () => {
    const plan = planMultiEntityPublicProjection(
      input({
        courseRuns: [
          run({
            legalEntityId: 'entity-sur-secret',
            campusId: 'campus-norte-secret',
          }),
        ],
      })
    )

    expect(plan.ready).toBe(false)
    expect(plan.issues).toContainEqual(
      expect.objectContaining({ code: 'campus_entity_mismatch', recordType: 'course_run' })
    )
  })

  it('blocks cross-tenant records rather than merging catalogs', () => {
    const source = input()
    const plan = planMultiEntityPublicProjection({
      ...source,
      courses: [{ ...source.courses[0]!, tenantId: 'other-tenant' }],
    })

    expect(plan.ready).toBe(false)
    expect(plan.issues).toContainEqual(
      expect.objectContaining({ code: 'tenant_mismatch', recordType: 'course' })
    )
  })

  it.each([
    [
      'course',
      { courses: [input().courses[0]!, { ...input().courses[1]!, slug: 'auxiliar-veterinaria' }] },
    ],
    [
      'campus',
      { campuses: [input().campuses[0]!, { ...input().campuses[1]!, slug: 'sede-norte' }] },
    ],
    ['run', { courseRuns: [run(), run({ id: 'run-2', publicSlug: 'run-default' })] }],
  ])('blocks duplicate public %s slugs', (_label, overrides) => {
    const plan = planMultiEntityPublicProjection(input(overrides))
    expect(plan.ready).toBe(false)
    expect(plan.issues.map(({ code }) => code)).toContain('duplicate_public_slug')
  })

  it('ignores draft and cancelled runs while retaining the shared master course', () => {
    const plan = planMultiEntityPublicProjection(
      input({
        courseRuns: [run({ status: 'draft' }), run({ id: 'cancelled', status: 'cancelled' })],
      })
    )

    expect(plan.ready).toBe(true)
    expect(plan.summary.ignoredNonPublicRuns).toBe(2)
    expect(plan.summary.projectedRuns).toBe(0)
    expect(plan.courses[0]?.runs).toEqual([])
  })

  it('blocks a public run whose master course is missing or inactive', () => {
    const source = input()
    const plan = planMultiEntityPublicProjection({
      ...source,
      courses: source.courses.map((course) =>
        course.id === 'course-shared-secret' ? { ...course, active: false } : course
      ),
    })

    expect(plan.ready).toBe(false)
    expect(plan.issues.map(({ code }) => code)).toContain('course_missing_or_inactive')
  })

  it('projects one shared cycle with entity-local runs without duplicating the master', () => {
    const plan = planMultiEntityPublicProjection(
      input({
        cycles: [
          {
            id: 'cycle-shared-secret',
            tenantId: 'cep-tenant-secret',
            slug: 'grado-superior-marketing',
            title: 'Grado Superior en Marketing',
            active: true,
          },
        ],
        courseRuns: [
          run({
            id: 'cycle-run-norte',
            courseId: null,
            cycleId: 'cycle-shared-secret',
            publicSlug: 'marketing-norte-2026',
          }),
          run({
            id: 'cycle-run-sur',
            legalEntityId: 'entity-sur-secret',
            courseId: null,
            cycleId: 'cycle-shared-secret',
            campusId: 'campus-sur-secret',
            publicSlug: 'marketing-sur-2026',
          }),
        ],
      })
    )

    expect(plan.ready).toBe(true)
    expect(plan.cycles).toEqual([
      {
        slug: 'grado-superior-marketing',
        title: 'Grado Superior en Marketing',
        runs: [
          expect.objectContaining({ slug: 'marketing-norte-2026' }),
          expect.objectContaining({ slug: 'marketing-sur-2026' }),
        ],
      },
    ])
    expect(plan.campuses.find(({ slug }) => slug === 'sede-sur')?.cycleSlugs).toEqual([
      'grado-superior-marketing',
    ])
  })

  it.each([
    { courseId: null, cycleId: null },
    { courseId: 'course-shared-secret', cycleId: 'cycle-shared-secret' },
  ])('blocks an ambiguous catalog relation: %o', (relation) => {
    const plan = planMultiEntityPublicProjection(
      input({
        cycles: [
          {
            id: 'cycle-shared-secret',
            tenantId: 'cep-tenant-secret',
            slug: 'grado-superior-marketing',
            title: 'Grado Superior en Marketing',
            active: true,
          },
        ],
        courseRuns: [run(relation)],
      })
    )
    expect(plan.ready).toBe(false)
    expect(plan.issues.map(({ code }) => code)).toContain('catalog_relation_invalid')
  })

  it('supports online runs without fabricating a campus or legal entity in output', () => {
    const plan = planMultiEntityPublicProjection(
      input({
        courseRuns: [
          run({
            campusId: null,
            modality: 'online',
            publicSlug: 'auxiliar-veterinaria-online',
          }),
        ],
      })
    )

    expect(plan.ready).toBe(true)
    expect(plan.courses[0]?.runs[0]).toMatchObject({
      slug: 'auxiliar-veterinaria-online',
      modality: 'online',
      campus: null,
    })
  })

  it('blocks active campuses without one validated entity binding', () => {
    const source = input()
    const plan = planMultiEntityPublicProjection({
      ...source,
      campusBindings: source.campusBindings.filter(
        ({ campusId }) => campusId !== 'campus-santa-cruz-secret'
      ),
    })

    expect(plan.ready).toBe(false)
    expect(plan.issues).toContainEqual(
      expect.objectContaining({
        code: 'campus_binding_missing_or_not_validated',
        recordType: 'campus',
      })
    )
  })

  it('blocks ambiguous active campus ownership', () => {
    const source = input()
    const plan = planMultiEntityPublicProjection({
      ...source,
      campusBindings: [
        ...source.campusBindings,
        {
          ...source.campusBindings[0]!,
          id: 'binding-ambiguous-secret',
          legalEntityId: 'entity-sur-secret',
        },
      ],
    })

    expect(plan.ready).toBe(false)
    expect(plan.issues.map(({ code }) => code)).toContain('campus_binding_ambiguous')
  })

  it.each(['2026-02-31', '09/01/2026', '2026-09-01T10:00:00+02:00'])(
    'rejects non-canonical or impossible public dates: %s',
    (startDate) => {
      const plan = planMultiEntityPublicProjection(input({ courseRuns: [run({ startDate })] }))
      expect(plan.ready).toBe(false)
      expect(plan.issues.map(({ code }) => code)).toContain('public_field_invalid')
    }
  )

  it('rejects extra fields, inherited required fields and unbounded snapshots', () => {
    const source = input()
    expect(() =>
      planMultiEntityPublicProjection({ ...source, financialTotal: 10 } as never)
    ).toThrow('MULTI_ENTITY_PUBLIC_PROJECTION_INPUT_INVALID')
    expect(() =>
      planMultiEntityPublicProjection({
        ...source,
        courses: [{ ...source.courses[0]!, internalCost: 99 } as never],
      })
    ).toThrow('MULTI_ENTITY_PUBLIC_PROJECTION_RECORD_INVALID')
    const inherited = Object.create({ title: 'Inherited title' }) as Record<string, unknown>
    Object.assign(inherited, {
      id: 'inherited-course',
      tenantId: 'cep-tenant-secret',
      slug: 'inherited-course',
      active: true,
    })
    expect(() =>
      planMultiEntityPublicProjection({ ...source, courses: [inherited] } as never)
    ).toThrow('MULTI_ENTITY_PUBLIC_PROJECTION_RECORD_INVALID')
    expect(() => planMultiEntityPublicProjection({ ...source, maxRecords: 1 })).toThrow(
      'MULTI_ENTITY_PUBLIC_PROJECTION_RECORD_LIMIT_EXCEEDED'
    )
  })

  it('is deterministic, immutable and independent of source order', () => {
    const source = input()
    const before = JSON.stringify(source)
    const first = planMultiEntityPublicProjection(source)
    const second = planMultiEntityPublicProjection({
      ...source,
      legalEntities: [...source.legalEntities].reverse(),
      campusBindings: [...source.campusBindings].reverse(),
      courses: [...source.courses].reverse(),
      cycles: [...source.cycles].reverse(),
      campuses: [...source.campuses].reverse(),
      courseRuns: [...source.courseRuns].reverse(),
    })

    expect(first).toEqual(second)
    expect(JSON.stringify(source)).toBe(before)
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first.courses[0]?.runs)).toBe(true)
  })

  it('serializes a redacted aggregate observation without public or internal values', () => {
    const source = input()
    const serialized = serializeMultiEntityPublicProjectionObservation(source)
    const observation = createRedactedMultiEntityPublicProjectionObservation(
      planMultiEntityPublicProjection(source)
    )

    expect(JSON.parse(serialized)).toEqual(observation)
    for (const value of [
      'cep-tenant-secret',
      'entity-norte-secret',
      'auxiliar-veterinaria',
      'Auxiliar de veterinaria',
      'sede-norte',
      'CEP Norte',
      'av-norte-2026',
    ]) {
      expect(serialized).not.toContain(value)
    }

    const blocked = input({
      courseRuns: [run({ legalEntityId: 'entity-sur-secret', campusId: 'campus-norte-secret' })],
    })
    const blockedSerialized = serializeMultiEntityPublicProjectionObservation(blocked)
    expect(JSON.parse(blockedSerialized)).toMatchObject({ verdict: 'blocked' })
    for (const value of ['entity-sur-secret', 'campus-norte-secret', 'run-default-secret']) {
      expect(blockedSerialized).not.toContain(value)
    }
  })

  it('rejects forged plans before producing evidence', () => {
    const plan = planMultiEntityPublicProjection(input())
    expect(() =>
      createRedactedMultiEntityPublicProjectionObservation({
        ...plan,
        canPublish: true,
      } as never)
    ).toThrow('MULTI_ENTITY_PUBLIC_PROJECTION_PLAN_INVALID')
    expect(() =>
      createRedactedMultiEntityPublicProjectionObservation({
        ...plan,
        summary: { ...plan.summary, projectedRuns: -1 },
      } as never)
    ).toThrow('MULTI_ENTITY_PUBLIC_PROJECTION_PLAN_INVALID')
  })

  it('exports no write, apply, publish or activation function', async () => {
    const module = await import('../src/multi-entity-public-projection')
    expect(
      Object.keys(module).filter((key) => /write|apply|publish|activate|execute/i.test(key))
    ).toEqual([])
  })
})
