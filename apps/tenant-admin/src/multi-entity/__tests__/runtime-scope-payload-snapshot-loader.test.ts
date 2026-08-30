import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { planMultiEntityRuntimeScopeShadow } from '../../../../../packages/tenant/src/multi-entity-runtime-scope-runner'
import {
  createPayloadRuntimeScopeSnapshotLoader,
  PAYLOAD_RUNTIME_SCOPE_CAMPAIGN_SELECT,
  PAYLOAD_RUNTIME_SCOPE_COURSE_RUN_SELECT,
  PAYLOAD_RUNTIME_SCOPE_ENROLLMENT_SELECT,
  PAYLOAD_RUNTIME_SCOPE_LEAD_SELECT,
  PayloadRuntimeScopeSnapshotLoaderError,
  type PayloadRuntimeScopeSnapshotLoaderOptions,
} from '../runtime-scope-payload-snapshot-loader'

function payloadRequestWith(find: ReturnType<typeof vi.fn>): PayloadRequest {
  return { payload: { find }, user: { role: 'admin', tenant: 'cep' } } as unknown as PayloadRequest
}

function page(docs: readonly Record<string, unknown>[], overrides: Record<string, unknown> = {}) {
  return {
    docs,
    page: 1,
    totalDocs: docs.length,
    totalPages: docs.length === 0 ? 0 : 1,
    hasNextPage: false,
    nextPage: null,
    ...overrides,
  }
}

const context = {
  tenantId: 'cep',
  legalEntityId: 'entity-norte',
  campusId: 'campus-norte',
  reviewReference: 'review://context/cep-norte',
} as const

const resolutions = [
  {
    resourceType: 'course_run',
    resourceId: 'run-norte',
    tenantId: 'cep',
    legalEntityId: 'entity-norte',
    campusId: 'campus-norte',
    status: 'validated',
    reviewReference: 'review://course-run/norte',
  },
  {
    resourceType: 'enrollment',
    resourceId: 'enrollment-norte',
    tenantId: 'cep',
    legalEntityId: 'entity-norte',
    campusId: 'campus-norte',
    status: 'validated',
    reviewReference: 'review://enrollment/norte',
    courseRunId: 'run-norte',
  },
  {
    resourceType: 'campaign',
    resourceId: 'campaign-norte',
    tenantId: 'cep',
    legalEntityId: 'entity-norte',
    campusId: 'campus-norte',
    status: 'validated',
    reviewReference: 'review://campaign/norte',
  },
  {
    resourceType: 'lead',
    resourceId: 'lead-norte',
    tenantId: 'cep',
    legalEntityId: 'entity-norte',
    campusId: 'campus-norte',
    status: 'validated',
    reviewReference: 'review://lead/norte',
    campaignId: 'campaign-norte',
  },
] as const

const topology = {
  legalEntities: [{ id: 'entity-norte', tenantId: 'cep', status: 'validated' }],
  campuses: [
    { id: 'campus-norte', tenantId: 'cep' },
    { id: 'campus-sur', tenantId: 'cep' },
  ],
  campusBindings: [
    {
      id: 'binding-norte',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      campusId: 'campus-norte',
      status: 'validated',
    },
    {
      id: 'binding-sur',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      campusId: 'campus-sur',
      status: 'validated',
    },
  ],
  staffAssignments: [],
  accountingConnections: [],
} as const

function optionsWith(
  find: ReturnType<typeof vi.fn>,
  overrides: Partial<PayloadRuntimeScopeSnapshotLoaderOptions> = {}
): PayloadRuntimeScopeSnapshotLoaderOptions {
  return {
    req: payloadRequestWith(find),
    targetTenantId: 'cep',
    context,
    topology,
    reviewedResourceResolutions: resolutions,
    pageSize: 100,
    maxPages: 10,
    maxRecords: 100,
    ...overrides,
  }
}

function successfulFind() {
  return vi.fn(async ({ collection }: { collection: string }) => {
    switch (collection) {
      case 'course-runs':
        return page([
          {
            id: 'run-norte',
            tenant: 'cep',
            campus: 'campus-norte',
            privateNotes: 'must-not-leak',
          },
        ])
      case 'enrollments':
        return page([{ id: 'enrollment-norte', course_run: 'run-norte', amount_paid: 900 }])
      case 'campaigns':
        return page([{ id: 'campaign-norte', tenant: 'cep', secret: 'must-not-leak' }])
      case 'leads':
        return page([
          {
            id: 'lead-norte',
            tenant: 'cep',
            campus: 'campus-norte',
            campaign: 'campaign-norte',
            email: 'must-not-leak@example.test',
          },
        ])
      default:
        throw new Error(`Unexpected collection: ${collection}`)
    }
  })
}

function expectCode(action: () => Promise<unknown>, code: string): Promise<void> {
  return expect(action()).rejects.toEqual(
    expect.objectContaining<Partial<PayloadRuntimeScopeSnapshotLoaderError>>({ code })
  )
}

describe('runtime scope Payload snapshot loader', () => {
  it('uses the current request, exact minimal selects and preserves shadow-only unresolved media', async () => {
    const find = successfulFind()
    const snapshot = await createPayloadRuntimeScopeSnapshotLoader(optionsWith(find))()

    expect(find).toHaveBeenCalledTimes(4)
    expect(find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'course-runs',
        where: { and: [{ tenant: { equals: 'cep' } }, { id: { in: ['run-norte'] } }] },
        depth: 0,
        overrideAccess: false,
        req: optionsWith(find).req,
        select: PAYLOAD_RUNTIME_SCOPE_COURSE_RUN_SELECT,
        showHiddenFields: false,
        trash: false,
      })
    )
    expect(find.mock.calls.map(([input]) => input.select)).toEqual([
      PAYLOAD_RUNTIME_SCOPE_COURSE_RUN_SELECT,
      PAYLOAD_RUNTIME_SCOPE_ENROLLMENT_SELECT,
      PAYLOAD_RUNTIME_SCOPE_CAMPAIGN_SELECT,
      PAYLOAD_RUNTIME_SCOPE_LEAD_SELECT,
    ])
    expect(find.mock.calls.map(([input]) => input.collection)).not.toContain('media')
    expect(find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'enrollments',
        where: {
          and: [{ 'course_run.tenant': { equals: 'cep' } }, { id: { in: ['enrollment-norte'] } }],
        },
      })
    )
    expect(snapshot.records).toHaveLength(4)
    expect(
      snapshot.records.find((record) => record.resourceType === 'course_run')?.resource
    ).toEqual({
      resourceType: 'course_run',
      resourceId: 'run-norte',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      campusId: 'campus-norte',
    })
    expect(JSON.stringify(snapshot)).not.toContain('privateNotes')
    expect(JSON.stringify(snapshot)).not.toContain('amount_paid')
    expect(JSON.stringify(snapshot)).not.toContain('must-not-leak')
    expect(snapshot.records.find((record) => record.resourceType === 'lead')?.resource).toEqual({
      resourceType: 'lead',
      resourceId: 'lead-norte',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      campusId: 'campus-norte',
    })
    expect(planMultiEntityRuntimeScopeShadow(snapshot).verdict).toBe('ready')
  })

  it('never infers an entity from a campus and rejects an enrollment without its reviewed course-run owner', async () => {
    const find = successfulFind()
    const invalid = resolutions.map((resolution) =>
      resolution.resourceType === 'enrollment'
        ? { ...resolution, courseRunId: 'other-run' }
        : resolution
    )

    await expectCode(
      () =>
        createPayloadRuntimeScopeSnapshotLoader(
          optionsWith(find, { reviewedResourceResolutions: invalid })
        )(),
      'RUNTIME_SCOPE_PAYLOAD_ENROLLMENT_RELATION_INVALID'
    )
  })

  it('requires a reviewed campus and campaign relation for a lead without exposing PII', async () => {
    const find = successfulFind()
    find.mockImplementation(async ({ collection }: { collection: string }) => {
      if (collection === 'leads') {
        return page([
          {
            id: 'lead-norte',
            tenant: 'cep',
            campus: 'campus-sur',
            campaign: 'campaign-sur',
            email: 'private@example.test',
          },
        ])
      }
      if (collection === 'campaigns') {
        return page([{ id: 'campaign-norte', tenant: 'cep' }])
      }
      if (collection === 'course-runs') {
        return page([{ id: 'run-norte', tenant: 'cep', campus: 'campus-norte' }])
      }
      if (collection === 'enrollments') {
        return page([{ id: 'enrollment-norte', course_run: 'run-norte' }])
      }
      throw new Error(`Unexpected collection: ${collection}`)
    })

    await expectCode(
      () => createPayloadRuntimeScopeSnapshotLoader(optionsWith(find))(),
      'RUNTIME_SCOPE_PAYLOAD_LEAD_RELATION_INVALID'
    )
    expect(JSON.stringify(find.mock.calls)).not.toContain('private@example.test')
  })

  it('keeps a lead with no campaign relation in the reviewed campus scope', async () => {
    const find = successfulFind()
    find.mockImplementation(async ({ collection }: { collection: string }) => {
      if (collection === 'leads') {
        return page([{ id: 'lead-norte', tenant: 'cep', campus: 'campus-norte' }])
      }
      if (collection === 'campaigns') return page([])
      if (collection === 'course-runs') {
        return page([{ id: 'run-norte', tenant: 'cep', campus: 'campus-norte' }])
      }
      if (collection === 'enrollments') {
        return page([{ id: 'enrollment-norte', course_run: 'run-norte' }])
      }
      throw new Error(`Unexpected collection: ${collection}`)
    })

    const leadResolution = resolutions.find((resolution) => resolution.resourceType === 'lead')!
    const snapshot = await createPayloadRuntimeScopeSnapshotLoader(
      optionsWith(find, {
        reviewedResourceResolutions: [leadResolution],
      })
    )()

    expect(snapshot.records).toEqual([
      expect.objectContaining({ resourceType: 'lead', legacyAllowed: true }),
    ])
  })

  it('rejects inactive, malformed, and duplicate reviewed resolutions before any Payload read', () => {
    const find = successfulFind()
    expect(() =>
      createPayloadRuntimeScopeSnapshotLoader(
        optionsWith(find, {
          reviewedResourceResolutions: [{ ...resolutions[0], status: 'inactive' }],
        })
      )
    ).toThrowError(
      expect.objectContaining<Partial<PayloadRuntimeScopeSnapshotLoaderError>>({
        code: 'RUNTIME_SCOPE_PAYLOAD_RESOLUTION_INVALID',
      })
    )
    expect(() =>
      createPayloadRuntimeScopeSnapshotLoader(
        optionsWith(find, {
          topology: { ...topology, campusBindings: [] },
        })
      )
    ).toThrowError(
      expect.objectContaining<Partial<PayloadRuntimeScopeSnapshotLoaderError>>({
        code: 'RUNTIME_SCOPE_PAYLOAD_CONTEXT_INVALID',
      })
    )
    expect(() =>
      createPayloadRuntimeScopeSnapshotLoader(
        optionsWith(find, { context: { ...context, extra: 'not-reviewed' } as never })
      )
    ).toThrowError(
      expect.objectContaining<Partial<PayloadRuntimeScopeSnapshotLoaderError>>({
        code: 'RUNTIME_SCOPE_PAYLOAD_CONTEXT_INVALID',
      })
    )
    expect(() =>
      createPayloadRuntimeScopeSnapshotLoader(
        optionsWith(find, { reviewedResourceResolutions: [resolutions[0], resolutions[0]] })
      )
    ).toThrowError(
      expect.objectContaining<Partial<PayloadRuntimeScopeSnapshotLoaderError>>({
        code: 'RUNTIME_SCOPE_PAYLOAD_RESOLUTION_DUPLICATE',
      })
    )
    expect(find).not.toHaveBeenCalled()
  })

  it('rejects ambiguous reviewed topology before any Payload read', () => {
    const find = successfulFind()
    const ambiguousTopology = {
      ...topology,
      campusBindings: [
        ...topology.campusBindings,
        {
          ...topology.campusBindings[0],
          id: 'binding-norte-proposed',
          status: 'proposed' as const,
        },
      ],
    }

    expect(() =>
      createPayloadRuntimeScopeSnapshotLoader(optionsWith(find, { topology: ambiguousTopology }))
    ).toThrowError(
      expect.objectContaining<Partial<PayloadRuntimeScopeSnapshotLoaderError>>({
        code: 'RUNTIME_SCOPE_PAYLOAD_INVALID_CONFIGURATION',
      })
    )
    expect(find).not.toHaveBeenCalled()
  })

  it('refuses media until a tenant-safe ownership source is approved', () => {
    const find = successfulFind()
    expect(() =>
      createPayloadRuntimeScopeSnapshotLoader(
        optionsWith(find, {
          reviewedResourceResolutions: [
            ...resolutions,
            {
              resourceType: 'media',
              resourceId: 'media-norte',
              tenantId: 'cep',
              legalEntityId: 'entity-norte',
              campusId: 'campus-norte',
              status: 'validated',
              reviewReference: 'review://media/norte',
            },
          ],
        })
      )
    ).toThrowError(
      expect.objectContaining<Partial<PayloadRuntimeScopeSnapshotLoaderError>>({
        code: 'RUNTIME_SCOPE_PAYLOAD_UNSUPPORTED_RESOURCE',
      })
    )
    expect(find).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated, superadmin, cross-tenant, and over-limit input before I/O', () => {
    const find = successfulFind()
    for (const user of [
      undefined,
      { role: 'superadmin', tenant: 'cep' },
      { role: 'admin', tenant: 'other' },
    ]) {
      expect(() =>
        createPayloadRuntimeScopeSnapshotLoader({
          ...optionsWith(find),
          req: { payload: { find }, user } as unknown as PayloadRequest,
        })
      ).toThrowError(
        expect.objectContaining<Partial<PayloadRuntimeScopeSnapshotLoaderError>>({
          code: 'RUNTIME_SCOPE_PAYLOAD_REQUEST_SCOPE_MISMATCH',
        })
      )
    }
    const tooMany = Array.from({ length: 10_001 }, (_, index) => ({
      ...resolutions[0],
      resourceId: `run-${index}`,
      reviewReference: `review://course-run/${index}`,
    }))
    expect(() =>
      createPayloadRuntimeScopeSnapshotLoader(
        optionsWith(find, { reviewedResourceResolutions: tooMany })
      )
    ).toThrowError(
      expect.objectContaining<Partial<PayloadRuntimeScopeSnapshotLoaderError>>({
        code: 'RUNTIME_SCOPE_PAYLOAD_RECORD_LIMIT_EXCEEDED',
      })
    )
    expect(find).not.toHaveBeenCalled()
  })

  it('keeps reviewed proposed ownership when current effective access returns no document', async () => {
    const find = vi.fn(async () => page([]))
    const snapshot = await createPayloadRuntimeScopeSnapshotLoader(
      optionsWith(find, { reviewedResourceResolutions: [resolutions[2]] })
    )()
    const plan = planMultiEntityRuntimeScopeShadow(snapshot)

    expect(snapshot.records).toEqual([
      expect.objectContaining({
        legacyAllowed: false,
        resource: expect.objectContaining({
          resourceType: 'campaign',
          resourceId: 'campaign-norte',
        }),
      }),
    ])
    expect(plan).toMatchObject({
      verdict: 'blocked',
      metrics: { divergences: 1, wouldGrant: 1, wouldRevoke: 0, unresolved: 0 },
    })
  })

  it('rejects a cross-tenant source record even if the query is tenant-filtered', async () => {
    const find = successfulFind()
    find.mockImplementationOnce(async () =>
      page([{ id: 'run-norte', tenant: 'other', campus: 'campus-norte' }])
    )

    await expectCode(
      () => createPayloadRuntimeScopeSnapshotLoader(optionsWith(find))(),
      'RUNTIME_SCOPE_PAYLOAD_TENANT_BOUNDARY_VIOLATION'
    )
  })

  it('rejects pagination drift and duplicate returned IDs', async () => {
    const courseResolutions = [
      resolutions[0],
      {
        ...resolutions[0],
        resourceId: 'run-otro',
        reviewReference: 'review://course-run/otro',
      },
    ]
    const drift = vi.fn(async ({ page: pageNumber }: { page: number }) =>
      pageNumber === 1
        ? page([{ id: 'run-norte', tenant: 'cep', campus: 'campus-norte' }], {
            totalDocs: 2,
            totalPages: 2,
            hasNextPage: true,
            nextPage: 2,
          })
        : page([{ id: 'run-otro', tenant: 'cep', campus: 'campus-norte' }], {
            page: 2,
            totalDocs: 3,
            totalPages: 3,
            hasNextPage: true,
            nextPage: 3,
          })
    )
    await expectCode(
      () =>
        createPayloadRuntimeScopeSnapshotLoader(
          optionsWith(drift, {
            reviewedResourceResolutions: courseResolutions,
            pageSize: 1,
          })
        )(),
      'RUNTIME_SCOPE_PAYLOAD_PAGINATION_CHANGED'
    )

    const duplicate = vi.fn(async () =>
      page([
        { id: 'run-norte', tenant: 'cep', campus: 'campus-norte' },
        { id: 'run-norte', tenant: 'cep', campus: 'campus-norte' },
      ])
    )
    await expectCode(
      () =>
        createPayloadRuntimeScopeSnapshotLoader(
          optionsWith(duplicate, { reviewedResourceResolutions: [resolutions[0]] })
        )(),
      'RUNTIME_SCOPE_PAYLOAD_UNEXPECTED_RECORD'
    )
  })

  it('sanitizes provider errors and remains disconnected from Payload configuration', async () => {
    const find = vi.fn(async () => {
      throw new Error('postgres://admin:secret@example.test/cep')
    })
    let captured: unknown
    try {
      await createPayloadRuntimeScopeSnapshotLoader(optionsWith(find))()
    } catch (error) {
      captured = error
    }
    expect(captured).toEqual(
      expect.objectContaining<Partial<PayloadRuntimeScopeSnapshotLoaderError>>({
        code: 'RUNTIME_SCOPE_PAYLOAD_READ_FAILED',
      })
    )
    expect(JSON.stringify(captured)).not.toContain('admin:secret')
    expect((captured as Error).message).toBe('Runtime scope Payload snapshot loading failed.')

    const workspaceConfig = resolve(process.cwd(), 'src/payload.config.ts')
    const repositoryConfig = resolve(process.cwd(), 'apps/tenant-admin/src/payload.config.ts')
    const payloadConfig = readFileSync(
      existsSync(workspaceConfig) ? workspaceConfig : repositoryConfig,
      'utf8'
    )
    expect(payloadConfig).not.toContain('runtime-scope-payload-snapshot-loader')
    expect(payloadConfig).not.toContain('createPayloadRuntimeScopeSnapshotLoader')
  })
})
