import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { loadTeacherScheduleSnapshot } from '../../../../../packages/tenant/src/multi-entity-teacher-schedule-snapshot-loader'
import type { MultiEntityTopology } from '../../../../../packages/tenant/src/multi-entity-topology'
import {
  PAYLOAD_TEACHER_SCHEDULE_SELECT,
  PayloadTeacherScheduleReaderError,
  createPayloadTeacherSchedulePageReader,
  type PayloadTeacherSchedulePageRequest,
} from '../teacher-schedule-payload-reader'

const validPageRequest: PayloadTeacherSchedulePageRequest = {
  tenantId: 'cep',
  page: 1,
  limit: 100,
  depth: 0,
  overrideAccess: false,
  accessMode: 'current_effective_access',
}

function payloadRequestWith(find: ReturnType<typeof vi.fn>): PayloadRequest {
  return { payload: { find } } as unknown as PayloadRequest
}

function successfulPage(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    docs: [],
    page: 1,
    totalDocs: 0,
    totalPages: 0,
    hasNextPage: false,
    nextPage: null,
    ...overrides,
  }
}

function expectReaderCode(action: () => Promise<unknown>, code: string): Promise<void> {
  return expect(action()).rejects.toEqual(
    expect.objectContaining<Partial<PayloadTeacherScheduleReaderError>>({ code })
  )
}

describe('teacher schedule Payload page reader', () => {
  it('uses the current request, tenant filter, stable pagination and minimal fields', async () => {
    const sourceDoc = {
      id: 42,
      tenant: 7,
      campus: 3,
      instructor: 11,
      instructors: [11, 12],
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      schedule_days: ['monday'],
      schedule_time_start: '09:00:00',
      schedule_time_end: '11:00:00',
      planning_status: 'published',
      legalEntity: 'must-not-leak-before-schema-activation',
      notes: 'private note',
      price_snapshot: 900,
    }
    const find = vi.fn(async () =>
      successfulPage({ docs: [sourceDoc], totalDocs: 1, totalPages: 1 })
    )
    const req = payloadRequestWith(find)
    const readPage = createPayloadTeacherSchedulePageReader({ req })

    const result = await readPage(validPageRequest)

    expect(find).toHaveBeenCalledTimes(1)
    expect(find).toHaveBeenCalledWith({
      collection: 'course-runs',
      where: { tenant: { equals: 'cep' } },
      page: 1,
      limit: 100,
      pagination: true,
      sort: 'id',
      depth: 0,
      overrideAccess: false,
      req,
      select: PAYLOAD_TEACHER_SCHEDULE_SELECT,
      showHiddenFields: false,
      trash: false,
    })
    expect(result.docs[0]).toEqual({
      id: 42,
      tenant: 7,
      campus: 3,
      instructor: 11,
      instructors: [11, 12],
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      schedule_days: ['monday'],
      schedule_time_start: '09:00:00',
      schedule_time_end: '11:00:00',
      planning_status: 'published',
    })
    expect(result.docs[0]).not.toHaveProperty('legalEntity')
    expect(result.docs[0]).not.toHaveProperty('notes')
    expect(result.docs[0]).not.toHaveProperty('price_snapshot')
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.docs)).toBe(true)
    expect(Object.isFrozen(result.docs[0])).toBe(true)
  })

  it.each([
    { ...validPageRequest, tenantId: ' cep' },
    { ...validPageRequest, page: 0 },
    { ...validPageRequest, limit: 1_001 },
    { ...validPageRequest, depth: 1 },
    { ...validPageRequest, overrideAccess: true },
    { ...validPageRequest, accessMode: 'system' },
  ])('rejects a widened or malformed page request before reading: %o', async (request) => {
    const find = vi.fn(async () => successfulPage())
    const readPage = createPayloadTeacherSchedulePageReader({ req: payloadRequestWith(find) })

    await expectReaderCode(
      () => readPage(request as unknown as PayloadTeacherSchedulePageRequest),
      'TEACHER_SCHEDULE_PAYLOAD_READER_INVALID_REQUEST'
    )
    expect(find).not.toHaveBeenCalled()
  })

  it('fails closed when no real Payload find function is supplied', () => {
    expect(() =>
      createPayloadTeacherSchedulePageReader({ req: { payload: {} } as unknown as PayloadRequest })
    ).toThrowError(
      expect.objectContaining<Partial<PayloadTeacherScheduleReaderError>>({
        code: 'TEACHER_SCHEDULE_PAYLOAD_READER_INVALID_CONFIGURATION',
      })
    )
  })

  it.each([
    null,
    {},
    successfulPage({ docs: ['not-a-document'] }),
    successfulPage({ page: 2 }),
    successfulPage({ totalDocs: -1 }),
    successfulPage({ totalPages: -1 }),
    successfulPage({ hasNextPage: 'yes' }),
    successfulPage({ nextPage: 0 }),
  ])('rejects malformed Payload output without returning a partial page: %o', async (response) => {
    const readPage = createPayloadTeacherSchedulePageReader({
      req: payloadRequestWith(vi.fn(async () => response)),
    })

    await expectReaderCode(
      () => readPage(validPageRequest),
      'TEACHER_SCHEDULE_PAYLOAD_READER_INVALID_RESPONSE'
    )
  })

  it('redacts provider failures instead of exposing their message or credentials', async () => {
    const readPage = createPayloadTeacherSchedulePageReader({
      req: payloadRequestWith(
        vi.fn(async () => {
          throw new Error('postgres://admin:secret@example.test/cep')
        })
      ),
    })

    let captured: unknown
    try {
      await readPage(validPageRequest)
    } catch (error) {
      captured = error
    }

    expect(captured).toEqual(
      expect.objectContaining<Partial<PayloadTeacherScheduleReaderError>>({
        code: 'TEACHER_SCHEDULE_PAYLOAD_READER_READ_FAILED',
      })
    )
    expect(JSON.stringify(captured)).not.toContain('admin:secret')
    expect((captured as Error).message).toBe('Teacher schedule Payload reading failed.')
  })

  it('composes with the bounded snapshot loader without inferring a legal entity', async () => {
    const topology: MultiEntityTopology = {
      legalEntities: [{ id: 'entity-norte', tenantId: 'cep', status: 'validated' }],
      campuses: [{ id: 'campus-norte', tenantId: 'cep' }],
      campusBindings: [],
      staffAssignments: [],
      accountingConnections: [],
    }
    const find = vi.fn(async () =>
      successfulPage({
        docs: [
          {
            id: 'run-norte',
            tenant: 'cep',
            campus: 'campus-norte',
            start_date: '2026-09-01',
            end_date: '2026-09-30',
            schedule_days: ['monday'],
            schedule_time_start: '09:00:00',
            schedule_time_end: '11:00:00',
            planning_status: 'published',
          },
        ],
        totalDocs: 1,
        totalPages: 1,
      })
    )
    const readCourseRunsPage = createPayloadTeacherSchedulePageReader({
      req: payloadRequestWith(find),
    })

    const snapshot = await loadTeacherScheduleSnapshot({
      targetTenantId: 'cep',
      topology,
      reviewedEntityResolutions: [],
      readCourseRunsPage,
      pageSize: 100,
      maxPages: 1,
      maxRecords: 10,
    })

    expect(snapshot.courseRuns).toHaveLength(1)
    expect(snapshot.courseRuns[0]).not.toHaveProperty('legalEntity')
  })

  it('remains disconnected from Payload configuration', () => {
    const workspaceConfig = resolve(process.cwd(), 'src/payload.config.ts')
    const repositoryConfig = resolve(process.cwd(), 'apps/tenant-admin/src/payload.config.ts')
    const payloadConfig = readFileSync(
      existsSync(workspaceConfig) ? workspaceConfig : repositoryConfig,
      'utf8'
    )

    expect(payloadConfig).not.toContain('teacher-schedule-payload-reader')
    expect(payloadConfig).not.toContain('createPayloadTeacherSchedulePageReader')
  })
})
