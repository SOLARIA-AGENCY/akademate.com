import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import {
  WEBSITE_RENDERER_PUBLIC_BASELINE_LIMITS,
  WEBSITE_RENDERER_PUBLIC_CAMPUS_SELECT,
  WEBSITE_RENDERER_PUBLIC_COURSE_SELECT,
  WEBSITE_RENDERER_PUBLIC_CYCLE_SELECT,
  WEBSITE_RENDERER_PUBLIC_RUN_SELECT,
  WebsiteRendererPublicBaselineReaderError,
  createWebsiteRendererPublicBaselineLoader,
} from '../public-baseline-payload-reader'

function response(docs: readonly Record<string, unknown>[]) {
  return { docs }
}

function sources(
  overrides: Partial<Record<'courses' | 'cycles' | 'campuses' | 'course-runs', unknown>> = {}
) {
  return {
    courses: response([{ id: 10, slug: 'curso-publico', private_price: 900 }]),
    cycles: response([{ id: 20, slug: 'ciclo-publico', private_notes: 'secret' }]),
    campuses: response([{ id: 30, slug: 'sede-publica', private_email: 'secret@test' }]),
    'course-runs': response([{ id: 40, codigo: 'NOR-2026-001', current_enrollments: 12 }]),
    ...overrides,
  }
}

function payloadRequestWith(find: ReturnType<typeof vi.fn>): PayloadRequest {
  return { payload: { find } } as unknown as PayloadRequest
}

function findFrom(values = sources()) {
  return vi.fn(async ({ collection }: { collection: keyof typeof values }) => values[collection])
}

function loader(find: ReturnType<typeof vi.fn>) {
  return createWebsiteRendererPublicBaselineLoader({
    req: payloadRequestWith(find),
    targetTenantId: '7',
  })
}

function expectCode(action: () => Promise<unknown>, code: string): Promise<void> {
  return expect(action()).rejects.toEqual(
    expect.objectContaining<Partial<WebsiteRendererPublicBaselineReaderError>>({ code })
  )
}

describe('WebsiteRenderer public baseline Payload reader', () => {
  it('captures the four canonical catalog surfaces sequentially', async () => {
    const find = findFrom()
    const req = payloadRequestWith(find)
    const baseline = await createWebsiteRendererPublicBaselineLoader({
      req,
      targetTenantId: '7',
    })()

    expect(find).toHaveBeenCalledTimes(4)
    expect(find.mock.calls.map(([request]) => request.collection)).toEqual([
      'courses',
      'cycles',
      'campuses',
      'course-runs',
    ])
    expect(baseline).toEqual({
      courseSlugs: ['curso-publico'],
      cycleSlugs: ['ciclo-publico'],
      campusSlugs: ['sede-publica'],
      runSlugs: ['NOR-2026-001'],
    })
  })

  it('uses the current canonical filters, limits and minimal read-only selects', async () => {
    const find = findFrom()
    const req = payloadRequestWith(find)
    await createWebsiteRendererPublicBaselineLoader({ req, targetTenantId: '7' })()

    expect(find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'courses',
        where: {
          and: [
            { tenant: { equals: 7 } },
            { active: { equals: true } },
            { course_type: { not_in: ['ciclo_medio', 'ciclo_superior'] } },
          ],
        },
        limit: WEBSITE_RENDERER_PUBLIC_BASELINE_LIMITS.courses,
        sort: 'name',
        depth: 0,
        overrideAccess: false,
        req,
        select: WEBSITE_RENDERER_PUBLIC_COURSE_SELECT,
        showHiddenFields: false,
        trash: false,
      })
    )
    expect(find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'cycles',
        limit: WEBSITE_RENDERER_PUBLIC_BASELINE_LIMITS.cycles,
        select: WEBSITE_RENDERER_PUBLIC_CYCLE_SELECT,
      })
    )
    expect(find).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        collection: 'campuses',
        limit: WEBSITE_RENDERER_PUBLIC_BASELINE_LIMITS.campuses,
        select: WEBSITE_RENDERER_PUBLIC_CAMPUS_SELECT,
      })
    )
    expect(find).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        collection: 'course-runs',
        where: {
          and: [{ tenant: { equals: 7 } }, { status: { in: ['enrollment_open', 'published'] } }],
        },
        limit: WEBSITE_RENDERER_PUBLIC_BASELINE_LIMITS.courseRuns,
        sort: 'start_date',
        select: WEBSITE_RENDERER_PUBLIC_RUN_SELECT,
      })
    )
  })

  it('uses the current convocation href fallback when codigo is absent', async () => {
    const find = findFrom(
      sources({ 'course-runs': response([{ id: 40, codigo: null, private_price: 1_000 }]) })
    )
    const baseline = await loader(find)()
    expect(baseline.runSlugs).toEqual(['40'])
    expect(JSON.stringify(baseline)).not.toContain('private_price')
  })

  it('rejects duplicate or malformed public values without returning a partial baseline', async () => {
    const duplicate = loader(
      findFrom(
        sources({
          cycles: response([
            { id: 20, slug: 'ciclo-publico' },
            { id: 21, slug: 'ciclo-publico' },
          ]),
        })
      )
    )
    await expectCode(() => duplicate(), 'WEBSITE_RENDERER_BASELINE_DUPLICATE_PUBLIC_VALUE')

    const malformed = loader(
      findFrom(sources({ campuses: response([{ id: 30, slug: '../private' }]) }))
    )
    await expectCode(() => malformed(), 'WEBSITE_RENDERER_BASELINE_PUBLIC_FIELD_INVALID')
  })

  it('rejects invalid tenant configuration before any I/O', () => {
    const find = findFrom()
    expect(() =>
      createWebsiteRendererPublicBaselineLoader({
        req: payloadRequestWith(find),
        targetTenantId: 'default',
      })
    ).toThrowError(
      expect.objectContaining({ code: 'WEBSITE_RENDERER_BASELINE_INVALID_CONFIGURATION' })
    )
    expect(find).not.toHaveBeenCalled()
  })

  it('redacts provider failures and stops subsequent surface reads', async () => {
    const find = vi.fn(async () => {
      throw new Error('postgres://admin:secret@example.test')
    })
    let captured: unknown
    try {
      await loader(find)()
    } catch (error) {
      captured = error
    }
    expect(captured).toEqual(
      expect.objectContaining({ code: 'WEBSITE_RENDERER_BASELINE_READ_FAILED' })
    )
    expect(JSON.stringify(captured)).not.toContain('admin:secret')
    expect(find).toHaveBeenCalledTimes(1)
  })

  it('rejects invalid and oversized provider responses', async () => {
    await expectCode(
      () => loader(findFrom(sources({ courses: { docs: 'not-an-array' } })))(),
      'WEBSITE_RENDERER_BASELINE_INVALID_RESPONSE'
    )
    const tooMany = Array.from(
      { length: WEBSITE_RENDERER_PUBLIC_BASELINE_LIMITS.campuses + 1 },
      (_, index) => ({ id: index + 1, slug: `sede-${index + 1}` })
    )
    await expectCode(
      () => loader(findFrom(sources({ campuses: response(tooMany) })))(),
      'WEBSITE_RENDERER_BASELINE_RECORD_LIMIT_EXCEEDED'
    )
  })

  it('remains disconnected from Payload config, routes and jobs', () => {
    const workspaceConfig = resolve(process.cwd(), 'src/payload.config.ts')
    const repositoryConfig = resolve(process.cwd(), 'apps/tenant-admin/src/payload.config.ts')
    const payloadConfig = readFileSync(
      existsSync(workspaceConfig) ? workspaceConfig : repositoryConfig,
      'utf8'
    )
    expect(payloadConfig).not.toContain('public-baseline-payload-reader')
    expect(payloadConfig).not.toContain('createWebsiteRendererPublicBaselineLoader')
  })

  it('exports no write, publish, activation or execution function', async () => {
    const module = await import('../public-baseline-payload-reader')
    expect(
      Object.keys(module).filter((key) => /write|publish|activate|execute|apply/i.test(key))
    ).toEqual([])
  })
})
