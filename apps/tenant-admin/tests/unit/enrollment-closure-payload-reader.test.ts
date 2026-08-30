import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  createMetaAdDraftCampaignReader,
  createPayloadEnrollmentClosureSnapshotLoader,
  EnrollmentClosurePayloadReaderError,
  runPayloadEnrollmentClosureShadowObservation,
} from '../../src/multi-entity/enrollment-closure-payload-reader'

const scope = {
  tenantId: '7',
  legalEntityId: 'entity-sur',
  courseRunId: '41',
  reviewReference: 'review://cep-sur/course-run-41',
} as const

function payloadRequest(find: ReturnType<typeof vi.fn>, user: unknown = { id: 12 }) {
  return {
    user,
    payload: { find },
  } as unknown as PayloadRequest
}

function courseRun() {
  return {
    id: 41,
    tenant: 7,
    training_type: 'private',
    status: 'in_progress',
    enrollment_status: 'open',
    start_date: '2026-07-19T00:00:00.000Z',
    enrollment_deadline: null,
    max_students: 20,
    current_enrollments: 12,
  }
}

function session(id: number, date: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    tenant: 7,
    course_run: 41,
    session_date: `${date}T00:00:00.000Z`,
    time_start: '09:00:00',
    status: 'scheduled',
    ...overrides,
  }
}

function expectReaderCode(error: unknown, code: string): void {
  expect(error).toBeInstanceOf(EnrollmentClosurePayloadReaderError)
  expect(error).toMatchObject({ code })
  expect(String((error as Error).message)).not.toContain('secret')
}

describe('Payload enrollment-closure snapshot reader', () => {
  it('reads an authenticated, tenant-scoped snapshot without bypassing access control', async () => {
    const find = vi.fn(async (query: Record<string, unknown>) => {
      if (query.collection === 'course-runs') return { docs: [courseRun()] }
      return {
        docs: [session(1, '2026-07-19'), session(2, '2026-07-20')],
        page: 1,
        totalDocs: 2,
        totalPages: 1,
        hasNextPage: false,
      }
    })
    const readCampaigns = vi.fn(async () => [
      {
        tenantId: '7',
        legalEntityId: 'entity-sur',
        courseRunId: '41',
        id: 'meta-9001',
        status: 'active' as const,
      },
    ])

    const snapshot = await createPayloadEnrollmentClosureSnapshotLoader({
      req: payloadRequest(find),
      scope,
      now: '2026-07-24T12:00:00+02:00',
      readCampaigns,
      pageSize: 2,
    })()

    expect(snapshot).toMatchObject({
      scope: { tenantId: '7', legalEntityId: 'entity-sur', courseRunId: '41' },
      courseRun: {
        tenantId: '7',
        legalEntityId: 'entity-sur',
        courseRunId: '41',
        trainingType: 'private',
        enrollmentStatus: 'open',
      },
      sessions: [
        { id: '1', startsAt: '2026-07-19T09:00:00+02:00' },
        { id: '2', startsAt: '2026-07-20T09:00:00+02:00' },
      ],
      campaigns: [{ id: 'meta-9001', status: 'active' }],
    })
    expect(readCampaigns).toHaveBeenCalledWith(scope)
    expect(find).toHaveBeenCalledTimes(2)

    for (const call of find.mock.calls) {
      expect(call[0]).toMatchObject({
        depth: 0,
        overrideAccess: false,
        showHiddenFields: false,
        trash: false,
      })
      expect(call[0].where).toEqual(
        expect.objectContaining({
          and: expect.arrayContaining([expect.objectContaining({ tenant: { equals: 7 } })]),
        })
      )
    }
  })

  it('fails closed before I/O without a current authenticated Payload request', () => {
    const find = vi.fn()

    expect(() =>
      createPayloadEnrollmentClosureSnapshotLoader({
        req: payloadRequest(find, null),
        scope,
        now: '2026-07-24T12:00:00+02:00',
        readCampaigns: async () => [],
      })
    ).toThrowError(
      expect.objectContaining({
        code: 'ENROLLMENT_CLOSURE_PAYLOAD_INVALID_CONFIGURATION',
      })
    )
    expect(find).not.toHaveBeenCalled()
  })

  it('rejects a cross-tenant session and does not read campaigns afterwards', async () => {
    const find = vi.fn(async (query: Record<string, unknown>) => {
      if (query.collection === 'course-runs') return { docs: [courseRun()] }
      return {
        docs: [session(1, '2026-07-19', { tenant: 8 })],
        page: 1,
        totalDocs: 1,
        totalPages: 1,
        hasNextPage: false,
      }
    })
    const readCampaigns = vi.fn(async () => [])
    const loader = createPayloadEnrollmentClosureSnapshotLoader({
      req: payloadRequest(find),
      scope,
      now: '2026-07-24T12:00:00+02:00',
      readCampaigns,
    })

    await expect(loader()).rejects.toMatchObject({
      code: 'ENROLLMENT_CLOSURE_PAYLOAD_SESSION_INVALID',
    })
    expect(readCampaigns).not.toHaveBeenCalled()
  })

  it('rejects pagination drift instead of producing a partial calendar', async () => {
    const find = vi.fn(async (query: Record<string, unknown>) => {
      if (query.collection === 'course-runs') return { docs: [courseRun()] }
      if (query.page === 1) {
        return {
          docs: [session(1, '2026-07-19')],
          page: 1,
          totalDocs: 2,
          totalPages: 2,
          hasNextPage: true,
        }
      }
      return {
        docs: [session(2, '2026-07-20')],
        page: 2,
        totalDocs: 3,
        totalPages: 3,
        hasNextPage: true,
      }
    })
    const loader = createPayloadEnrollmentClosureSnapshotLoader({
      req: payloadRequest(find),
      scope,
      now: '2026-07-24T12:00:00+02:00',
      readCampaigns: async () => [],
      pageSize: 1,
    })

    await expect(loader()).rejects.toMatchObject({
      code: 'ENROLLMENT_CLOSURE_PAYLOAD_PAGINATION_CHANGED',
    })
  })

  it('redacts failures from Payload and campaign providers', async () => {
    const payloadFailure = createPayloadEnrollmentClosureSnapshotLoader({
      req: payloadRequest(vi.fn(async () => Promise.reject(new Error('secret payload detail')))),
      scope,
      now: '2026-07-24T12:00:00+02:00',
      readCampaigns: async () => [],
    })
    try {
      await payloadFailure()
      throw new Error('expected payload failure')
    } catch (error) {
      expectReaderCode(error, 'ENROLLMENT_CLOSURE_PAYLOAD_COURSE_RUN_READ_FAILED')
    }

    const find = vi.fn(async (query: Record<string, unknown>) =>
      query.collection === 'course-runs'
        ? { docs: [courseRun()] }
        : { docs: [], page: 1, totalDocs: 0, totalPages: 0, hasNextPage: false }
    )
    const campaignFailure = createPayloadEnrollmentClosureSnapshotLoader({
      req: payloadRequest(find),
      scope,
      now: '2026-07-24T12:00:00+02:00',
      readCampaigns: async () => Promise.reject(new Error('secret Meta token')),
    })
    try {
      await campaignFailure()
      throw new Error('expected campaign failure')
    } catch (error) {
      expectReaderCode(error, 'ENROLLMENT_CLOSURE_CAMPAIGNS_READ_FAILED')
    }
  })
})

describe('Meta draft campaign reader', () => {
  it('uses one bounded SELECT scoped by tenant and convocatoria and maps latest statuses', async () => {
    const execute = vi.fn(async () => ({
      rows: [
        { campaign_id: 'meta-2', status: 'meta_paused', updated_at: '2026-07-24', id: 3 },
        { campaign_id: 'meta-1', status: 'active', updated_at: '2026-07-23', id: 2 },
        { campaign_id: 'meta-1', status: 'review', updated_at: '2026-07-22', id: 1 },
      ],
    }))
    const reader = createMetaAdDraftCampaignReader({
      execute,
      reviewReference: scope.reviewReference,
      maxCampaigns: 5,
    })

    await expect(reader(scope)).resolves.toEqual([
      {
        tenantId: '7',
        legalEntityId: 'entity-sur',
        courseRunId: '41',
        id: 'meta-1',
        status: 'active',
      },
      {
        tenantId: '7',
        legalEntityId: 'entity-sur',
        courseRunId: '41',
        id: 'meta-2',
        status: 'paused',
      },
    ])
    const query = String(execute.mock.calls[0]?.[0])
    expect(query.trimStart().toUpperCase().startsWith('SELECT')).toBe(true)
    expect(query).toContain('WHERE tenant_id = 7')
    expect(query).toContain('AND convocatoria_id = 41')
    expect(query).toContain('LIMIT 6')
    expect(query).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|ALTER|CREATE|DROP)\b/i)
  })

  it('rejects an unreviewed scope before issuing SQL', async () => {
    const execute = vi.fn(async () => [])
    const reader = createMetaAdDraftCampaignReader({
      execute,
      reviewReference: scope.reviewReference,
    })

    await expect(
      reader({ ...scope, reviewReference: 'review://a-different-review' })
    ).rejects.toMatchObject({ code: 'ENROLLMENT_CLOSURE_CAMPAIGN_INVALID' })
    expect(execute).not.toHaveBeenCalled()
  })

  it('fails closed on invalid rows and bounded-result overflow', async () => {
    const invalid = createMetaAdDraftCampaignReader({
      execute: async () => [{ campaign_id: 'meta-1', status: 'unknown' }],
      reviewReference: scope.reviewReference,
    })
    await expect(invalid(scope)).rejects.toMatchObject({
      code: 'ENROLLMENT_CLOSURE_CAMPAIGN_INVALID',
    })

    const overflow = createMetaAdDraftCampaignReader({
      execute: async () => [
        { campaign_id: 'meta-1', status: 'active' },
        { campaign_id: 'meta-2', status: 'active' },
      ],
      reviewReference: scope.reviewReference,
      maxCampaigns: 1,
    })
    await expect(overflow(scope)).rejects.toMatchObject({
      code: 'ENROLLMENT_CLOSURE_PAYLOAD_LIMIT_EXCEEDED',
    })
  })
})

describe('Payload enrollment-closure shadow composition', () => {
  const staging = {
    AKADEMATE_CEP_ENROLLMENT_CLOSURE_SHADOW_ENABLED: 'true',
    AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT: 'staging',
  }

  it('runs one redacted staging observation through the real reader composition', async () => {
    const find = vi.fn(async (query: Record<string, unknown>) => {
      if (query.collection === 'course-runs') return { docs: [courseRun()] }
      return {
        docs: Array.from({ length: 7 }, (_, index) =>
          session(index + 1, `2026-07-${String(19 + index).padStart(2, '0')}`)
        ),
        page: 1,
        totalDocs: 7,
        totalPages: 1,
        hasNextPage: false,
      }
    })
    const executeMetaRead = vi.fn(async () => [
      { campaign_id: 'meta-9001', status: 'active', updated_at: '2026-07-25', id: 1 },
    ])

    const result = await runPayloadEnrollmentClosureShadowObservation({
      req: payloadRequest(find),
      scope,
      now: '2026-07-25T09:00:00+02:00',
      executeMetaRead,
      environment: staging,
    })

    expect(result).toMatchObject({
      status: 'observed',
      reason: 'shadow_observed',
      canWrite: false,
      canPauseAds: false,
      observation: {
        verdict: 'planned',
        decision: {
          recommendedEnrollmentStatus: 'closed',
          reason: 'session_limit_reached',
          courseOperationalStatusUnchanged: true,
        },
        metrics: { sessions: 7, campaigns: 1, proposedPauses: 1 },
      },
    })
    expect(find).toHaveBeenCalledTimes(2)
    expect(executeMetaRead).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(result)).not.toContain('entity-sur')
    expect(JSON.stringify(result)).not.toContain('meta-9001')
  })

  it('performs no Payload or Meta I/O when disabled or pointed at production', async () => {
    for (const environment of [
      {},
      {
        ...staging,
        AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT: 'production',
      },
    ]) {
      const find = vi.fn(async () => Promise.reject(new Error('must not read Payload')))
      const executeMetaRead = vi.fn(async () => Promise.reject(new Error('must not read Meta')))

      const result = await runPayloadEnrollmentClosureShadowObservation({
        req: payloadRequest(find),
        scope,
        now: '2026-07-25T09:00:00+02:00',
        executeMetaRead,
        environment,
      })

      expect(result).toMatchObject({
        status: 'skipped',
        canWrite: false,
        canPauseAds: false,
      })
      expect(find).not.toHaveBeenCalled()
      expect(executeMetaRead).not.toHaveBeenCalled()
    }
  })

  it('reduces a staging reader failure to a static result without provider details', async () => {
    const find = vi.fn(async (query: Record<string, unknown>) =>
      query.collection === 'course-runs'
        ? { docs: [courseRun()] }
        : { docs: [], page: 1, totalDocs: 0, totalPages: 0, hasNextPage: false }
    )
    const result = await runPayloadEnrollmentClosureShadowObservation({
      req: payloadRequest(find),
      scope,
      now: '2026-07-25T09:00:00+02:00',
      executeMetaRead: async () => Promise.reject(new Error('secret Meta provider token')),
      environment: staging,
    })

    expect(result).toEqual({
      status: 'failed',
      reason: 'snapshot_load_failed',
      canWrite: false,
      canPauseAds: false,
    })
    expect(JSON.stringify(result)).not.toContain('secret')
  })
})
