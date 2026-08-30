import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { planMultiEntityPublicProjection } from '../../../../../packages/tenant/src/multi-entity-public-projection'
import {
  PAYLOAD_PUBLIC_PROJECTION_CAMPUS_SELECT,
  PAYLOAD_PUBLIC_PROJECTION_COURSE_SELECT,
  PAYLOAD_PUBLIC_PROJECTION_CYCLE_SELECT,
  PAYLOAD_PUBLIC_PROJECTION_RUN_SELECT,
  PayloadPublicProjectionReaderError,
  createPayloadPublicProjectionInputLoader,
} from '../public-projection-payload-reader'

function page(docs: readonly Record<string, unknown>[]) {
  return {
    docs,
    page: 1,
    totalDocs: docs.length,
    totalPages: docs.length === 0 ? 0 : 1,
    hasNextPage: false,
    nextPage: null,
  }
}

function sourcePages(
  overrides: Partial<Record<'courses' | 'cycles' | 'campuses' | 'course-runs', unknown>> = {}
) {
  return {
    courses: page([
      {
        id: 10,
        tenant: 7,
        slug: 'curso-publico',
        name: 'Curso público',
        active: true,
        modality: 'presencial',
        base_price: 999,
        internal_notes: 'must-not-leak',
      },
    ]),
    cycles: page([]),
    campuses: page([
      {
        id: 20,
        tenant: 7,
        slug: 'sede-norte',
        name: 'CEP Norte',
        city: 'La Orotava',
        active: true,
        email: 'private@example.test',
        notes: 'must-not-leak',
      },
    ]),
    'course-runs': page([
      {
        id: 30,
        tenant: 7,
        course: 10,
        cycle: null,
        campus: 20,
        codigo: 'NOR-2026-001',
        status: 'enrollment_open',
        start_date: '2026-09-01T00:00:00.000Z',
        price_snapshot: 999,
        current_enrollments: 12,
      },
    ]),
    ...overrides,
  }
}

function payloadRequestWith(find: ReturnType<typeof vi.fn>): PayloadRequest {
  return { payload: { find } } as unknown as PayloadRequest
}

function options(find: ReturnType<typeof vi.fn>) {
  return {
    req: payloadRequestWith(find),
    targetTenantId: '7',
    legalEntities: [{ id: 'entity-norte', tenantId: '7', status: 'validated' as const }],
    campusBindings: [
      {
        id: 'binding-norte',
        tenantId: '7',
        legalEntityId: 'entity-norte',
        campusId: '20',
        status: 'validated' as const,
      },
    ],
    reviewedEntityResolutions: [
      {
        courseRunId: '30',
        legalEntityId: 'entity-norte',
        reviewReference: 'review://public-run-30',
      },
    ],
    pageSize: 100,
    maxPages: 10,
    maxRecords: 100,
  }
}

function findFrom(sources = sourcePages()) {
  return vi.fn(async ({ collection }: { collection: keyof typeof sources }) => sources[collection])
}

function expectCode(action: () => Promise<unknown>, code: string): Promise<void> {
  return expect(action()).rejects.toEqual(
    expect.objectContaining<Partial<PayloadPublicProjectionReaderError>>({ code })
  )
}

describe('public projection Payload input loader', () => {
  it('reads four public collections sequentially with current access and minimal selects', async () => {
    const find = findFrom()
    const req = payloadRequestWith(find)
    const load = createPayloadPublicProjectionInputLoader({ ...options(find), req })
    const snapshot = await load()

    expect(find).toHaveBeenCalledTimes(4)
    expect(find.mock.calls.map(([request]) => request.collection)).toEqual([
      'courses',
      'cycles',
      'campuses',
      'course-runs',
    ])
    expect(find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'courses',
        where: { and: [{ tenant: { equals: '7' } }, { active: { equals: true } }] },
        sort: 'id',
        depth: 0,
        overrideAccess: false,
        req,
        select: PAYLOAD_PUBLIC_PROJECTION_COURSE_SELECT,
        showHiddenFields: false,
        trash: false,
      })
    )
    expect(find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'cycles',
        select: PAYLOAD_PUBLIC_PROJECTION_CYCLE_SELECT,
        depth: 0,
        overrideAccess: false,
      })
    )
    expect(find).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        collection: 'campuses',
        select: PAYLOAD_PUBLIC_PROJECTION_CAMPUS_SELECT,
        depth: 0,
        overrideAccess: false,
      })
    )
    expect(find).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        collection: 'course-runs',
        where: {
          and: [{ tenant: { equals: '7' } }, { status: { in: ['published', 'enrollment_open'] } }],
        },
        select: PAYLOAD_PUBLIC_PROJECTION_RUN_SELECT,
        depth: 0,
        overrideAccess: false,
      })
    )
    expect(snapshot).toMatchObject({
      targetTenantId: '7',
      courses: [
        {
          id: '10',
          tenantId: '7',
          slug: 'curso-publico',
          title: 'Curso público',
          active: true,
        },
      ],
      cycles: [],
      campuses: [
        {
          id: '20',
          tenantId: '7',
          slug: 'sede-norte',
          name: 'CEP Norte',
          city: 'La Orotava',
          active: true,
        },
      ],
      courseRuns: [
        {
          id: '30',
          legalEntityId: 'entity-norte',
          courseId: '10',
          cycleId: null,
          campusId: '20',
          publicSlug: 'NOR-2026-001',
          status: 'enrollment_open',
          modality: 'presential',
        },
      ],
    })
    expect(planMultiEntityPublicProjection(snapshot).ready).toBe(true)
  })

  it('drops prices, enrollments, contact data and internal notes from the snapshot', async () => {
    const snapshot = await createPayloadPublicProjectionInputLoader(options(findFrom()))()
    const serialized = JSON.stringify(snapshot)
    for (const secret of ['999', 'current_enrollments', 'private@example.test', 'must-not-leak']) {
      expect(serialized).not.toContain(secret)
    }
  })

  it('accepts populated relationship objects but projects only scalar IDs', async () => {
    const sources = sourcePages({
      'course-runs': page([
        {
          id: 30,
          tenant: { id: 7, name: 'secret tenant name' },
          course: { id: 10, base_price: 999 },
          cycle: null,
          campus: { id: 20, email: 'secret@example.test' },
          codigo: 'NOR-2026-001',
          status: 'published',
          start_date: '2026-09-01',
        },
      ]),
    })
    const snapshot = await createPayloadPublicProjectionInputLoader(options(findFrom(sources)))()
    expect(snapshot.courseRuns[0]).toMatchObject({ courseId: '10', campusId: '20' })
    expect(JSON.stringify(snapshot)).not.toContain('secret@example')
    expect(JSON.stringify(snapshot)).not.toContain('base_price')
  })

  it('requires one reviewed legal-entity resolution for every returned public run', async () => {
    const find = findFrom()
    const load = createPayloadPublicProjectionInputLoader({
      ...options(find),
      reviewedEntityResolutions: [],
    })
    await expectCode(() => load(), 'PUBLIC_PROJECTION_PAYLOAD_RESOLUTION_MISSING')
  })

  it('rejects stale resolutions that do not match a returned public run', async () => {
    const find = findFrom(sourcePages({ 'course-runs': page([]) }))
    const load = createPayloadPublicProjectionInputLoader(options(find))
    await expectCode(() => load(), 'PUBLIC_PROJECTION_PAYLOAD_RESOLUTION_RECORD_MISSING')
  })

  it('rejects invalid, duplicate or non-validated entity resolutions before I/O', () => {
    const find = findFrom()
    expect(() =>
      createPayloadPublicProjectionInputLoader({
        ...options(find),
        reviewedEntityResolutions: [
          { courseRunId: '30', legalEntityId: 'entity-norte', reviewReference: 'ticket-30' },
        ],
      })
    ).toThrowError(
      expect.objectContaining({ code: 'PUBLIC_PROJECTION_PAYLOAD_RESOLUTION_INVALID' })
    )
    expect(() =>
      createPayloadPublicProjectionInputLoader({
        ...options(find),
        reviewedEntityResolutions: [
          ...options(find).reviewedEntityResolutions,
          ...options(find).reviewedEntityResolutions,
        ],
      })
    ).toThrowError(
      expect.objectContaining({ code: 'PUBLIC_PROJECTION_PAYLOAD_RESOLUTION_DUPLICATE' })
    )
    expect(find).not.toHaveBeenCalled()
  })

  it('projects cycle-only convocations through the shared cycle catalog', async () => {
    const sources = sourcePages({
      cycles: page([
        {
          id: 40,
          tenant: 7,
          slug: 'grado-superior-marketing',
          name: 'Grado Superior en Marketing',
          active: true,
          duration: { modality: 'semipresencial', private_price: 4_000 },
        },
      ]),
      'course-runs': page([
        {
          id: 30,
          tenant: 7,
          course: null,
          cycle: 40,
          campus: 20,
          codigo: 'NOR-2026-001',
          status: 'published',
          start_date: '2026-09-01',
        },
      ]),
    })
    const snapshot = await createPayloadPublicProjectionInputLoader(options(findFrom(sources)))()
    expect(snapshot.cycles).toEqual([
      {
        id: '40',
        tenantId: '7',
        slug: 'grado-superior-marketing',
        title: 'Grado Superior en Marketing',
        active: true,
      },
    ])
    expect(snapshot.courseRuns[0]).toMatchObject({
      courseId: null,
      cycleId: '40',
      modality: 'presential',
    })
    expect(JSON.stringify(snapshot)).not.toContain('private_price')
    expect(planMultiEntityPublicProjection(snapshot).ready).toBe(true)
  })

  it('rejects cross-tenant rows without returning a partial snapshot', async () => {
    const sources = sourcePages({
      courses: page([
        {
          id: 10,
          tenant: 8,
          slug: 'curso-publico',
          name: 'Curso público',
          active: true,
          modality: 'online',
        },
      ]),
    })
    const load = createPayloadPublicProjectionInputLoader(options(findFrom(sources)))
    await expectCode(() => load(), 'PUBLIC_PROJECTION_PAYLOAD_TENANT_BOUNDARY_VIOLATION')
  })

  it('enforces the combined bounded record limit before returning data', async () => {
    const find = findFrom()
    const load = createPayloadPublicProjectionInputLoader({ ...options(find), maxRecords: 4 })
    await expectCode(() => load(), 'PUBLIC_PROJECTION_PAYLOAD_RECORD_LIMIT_EXCEEDED')
  })

  it('detects pagination drift before reading later collections', async () => {
    const find = vi.fn(async ({ collection, page: requestedPage }: any) => {
      if (collection !== 'courses') return page([])
      if (requestedPage === 1) {
        return {
          docs: [
            {
              id: 10,
              tenant: 7,
              slug: 'curso-uno',
              name: 'Curso uno',
              active: true,
              modality: 'online',
            },
          ],
          page: 1,
          totalDocs: 2,
          totalPages: 2,
          hasNextPage: true,
          nextPage: 2,
        }
      }
      return {
        docs: [
          {
            id: 11,
            tenant: 7,
            slug: 'curso-dos',
            name: 'Curso dos',
            active: true,
            modality: 'online',
          },
        ],
        page: 2,
        totalDocs: 3,
        totalPages: 3,
        hasNextPage: true,
        nextPage: 3,
      }
    })
    const load = createPayloadPublicProjectionInputLoader({
      ...options(find),
      pageSize: 1,
    })
    await expectCode(() => load(), 'PUBLIC_PROJECTION_PAYLOAD_PAGINATION_CHANGED')
    expect(find).toHaveBeenCalledTimes(2)
  })

  it('redacts provider failures and stops subsequent collection reads', async () => {
    const find = vi.fn(async () => {
      throw new Error('postgres://admin:secret@example.test/cep')
    })
    const load = createPayloadPublicProjectionInputLoader(options(find))
    let captured: unknown
    try {
      await load()
    } catch (error) {
      captured = error
    }
    expect(captured).toEqual(
      expect.objectContaining({ code: 'PUBLIC_PROJECTION_PAYLOAD_READ_FAILED' })
    )
    expect(JSON.stringify(captured)).not.toContain('admin:secret')
    expect(find).toHaveBeenCalledTimes(1)
  })

  it('rejects invalid requests, limits and widened topology records', () => {
    const find = findFrom()
    expect(() =>
      createPayloadPublicProjectionInputLoader({
        ...options(find),
        req: { payload: {} } as PayloadRequest,
      })
    ).toThrowError(
      expect.objectContaining({ code: 'PUBLIC_PROJECTION_PAYLOAD_INVALID_CONFIGURATION' })
    )
    expect(() =>
      createPayloadPublicProjectionInputLoader({ ...options(find), pageSize: 1_001 })
    ).toThrowError(
      expect.objectContaining({ code: 'PUBLIC_PROJECTION_PAYLOAD_INVALID_CONFIGURATION' })
    )
    expect(() =>
      createPayloadPublicProjectionInputLoader({
        ...options(find),
        legalEntities: [
          { ...options(find).legalEntities[0]!, secretReference: 'op://secret' } as never,
        ],
      })
    ).toThrowError(
      expect.objectContaining({ code: 'PUBLIC_PROJECTION_PAYLOAD_INVALID_CONFIGURATION' })
    )
  })

  it('remains disconnected from Payload config, routes and jobs', () => {
    const workspaceConfig = resolve(process.cwd(), 'src/payload.config.ts')
    const repositoryConfig = resolve(process.cwd(), 'apps/tenant-admin/src/payload.config.ts')
    const payloadConfig = readFileSync(
      existsSync(workspaceConfig) ? workspaceConfig : repositoryConfig,
      'utf8'
    )
    expect(payloadConfig).not.toContain('public-projection-payload-reader')
    expect(payloadConfig).not.toContain('createPayloadPublicProjectionInputLoader')
  })
})
