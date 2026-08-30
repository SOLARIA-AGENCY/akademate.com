import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { loadFinanceReconciliationSnapshot } from '../../../../../packages/finance/src/snapshot-loader'
import {
  PAYLOAD_FINANCE_CAMPAIGN_SELECT,
  PAYLOAD_FINANCE_ENROLLMENT_SELECT,
  PayloadFinanceRelationshipReaderError,
  createPayloadFinanceRelationshipReaders,
  type PayloadFinanceRelationshipReaderOptions,
  type ReviewedPayloadFinanceEntityPlan,
} from '../finance-payload-relationship-readers'

const scope = {
  tenantId: '018f47a2-4a7b-7d01-9a2f-9d4ab1c25e10',
  legalEntityId: '018f47a2-4a7b-7d02-8a2f-9d4ab1c25e11',
} as const
const plan: ReviewedPayloadFinanceEntityPlan = {
  ...scope,
  payloadTenantId: '7',
  reviewReference: 'review://finance/entity-sur/2026-07-24',
  enrollmentIds: [101],
  courseRunIds: [201],
  campaignIds: [301],
}

function payloadRequestWith(
  find: ReturnType<typeof vi.fn>,
  user: unknown = { id: 12, role: 'admin', tenant: 7 }
): PayloadRequest {
  return { user, payload: { find } } as unknown as PayloadRequest
}

function page(
  docs: readonly Readonly<Record<string, unknown>>[],
  pageNumber = 1,
  totalDocs = docs.length,
  totalPages = totalDocs === 0 ? 0 : 1
): Record<string, unknown> {
  const hasNextPage = pageNumber < totalPages
  return {
    docs,
    page: pageNumber,
    totalDocs,
    totalPages,
    hasNextPage,
    nextPage: hasNextPage ? pageNumber + 1 : null,
  }
}

function optionsWith(
  find: ReturnType<typeof vi.fn>,
  overrides: Partial<PayloadFinanceRelationshipReaderOptions> = {}
): PayloadFinanceRelationshipReaderOptions {
  return {
    req: payloadRequestWith(find),
    reviewedPlans: [plan],
    pageSize: 100,
    maxPages: 10,
    maxRecords: 100,
    ...overrides,
  }
}

function expectReaderCode(action: () => Promise<unknown>, code: string): Promise<void> {
  return expect(action()).rejects.toEqual(
    expect.objectContaining<Partial<PayloadFinanceRelationshipReaderError>>({ code })
  )
}

describe('finance Payload relationship readers', () => {
  it('reads reviewed enrollments through course-run tenant scope and strips unrelated data', async () => {
    const find = vi.fn(async () =>
      page([
        {
          id: 101,
          course_run: 201,
          amount_paid: 1250.5,
          student: { id: 900, first_name: 'private-student' },
          notes: 'private-note',
        },
      ])
    )
    const req = payloadRequestWith(find)
    const readers = createPayloadFinanceRelationshipReaders({
      ...optionsWith(find),
      req,
    })

    const result = await readers.readEnrollments(scope)

    expect(find).toHaveBeenCalledWith({
      collection: 'enrollments',
      where: {
        and: [{ course_run: { in: [201] } }, { 'course_run.tenant': { equals: 7 } }],
      },
      page: 1,
      limit: 100,
      pagination: true,
      sort: 'id',
      depth: 0,
      overrideAccess: false,
      req,
      select: PAYLOAD_FINANCE_ENROLLMENT_SELECT,
      showHiddenFields: false,
      trash: false,
    })
    expect(result).toEqual([
      {
        id: 101,
        tenantId: scope.tenantId,
        legalEntityId: scope.legalEntityId,
        amountPaid: 1250.5,
      },
    ])
    expect(JSON.stringify(result)).not.toContain('private-student')
    expect(JSON.stringify(result)).not.toContain('private-note')
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result[0])).toBe(true)
  })

  it('reads only reviewed campaigns with an explicit tenant filter', async () => {
    const find = vi.fn(async () =>
      page([{ id: 301, tenant: 7, name: 'private-campaign', budget: 5000 }])
    )
    const req = payloadRequestWith(find)
    const readers = createPayloadFinanceRelationshipReaders({ ...optionsWith(find), req })

    const result = await readers.readCampaigns(scope)

    expect(find).toHaveBeenCalledWith({
      collection: 'campaigns',
      where: {
        and: [{ tenant: { equals: 7 } }, { id: { in: [301] } }],
      },
      page: 1,
      limit: 100,
      pagination: true,
      sort: 'id',
      depth: 0,
      overrideAccess: false,
      req,
      select: PAYLOAD_FINANCE_CAMPAIGN_SELECT,
      showHiddenFields: false,
      trash: false,
    })
    expect(result).toEqual([
      { id: 301, tenantId: scope.tenantId, legalEntityId: scope.legalEntityId },
    ])
    expect(JSON.stringify(result)).not.toContain('private-campaign')
    expect(JSON.stringify(result)).not.toContain('5000')
  })

  it('paginates sequentially, rejects drift and returns deterministic enrollment order', async () => {
    const pagedPlan = { ...plan, enrollmentIds: [101, 102] }
    const pages = [
      page([{ id: 102, course_run: 201, amount_paid: 2 }], 1, 2, 2),
      page([{ id: 101, course_run: 201, amount_paid: 1 }], 2, 2, 2),
    ]
    const find = vi.fn(async ({ page: pageNumber }: { page: number }) => pages[pageNumber - 1])
    const readers = createPayloadFinanceRelationshipReaders(
      optionsWith(find, { reviewedPlans: [pagedPlan], pageSize: 1 })
    )

    const result = await readers.readEnrollments(scope)

    expect(find).toHaveBeenCalledTimes(2)
    expect(result.map(({ id }) => id)).toEqual([101, 102])

    const driftingFind = vi
      .fn()
      .mockResolvedValueOnce(pages[0])
      .mockResolvedValueOnce(page([{ id: 101, course_run: 201 }], 2, 3, 3))
    const driftingReaders = createPayloadFinanceRelationshipReaders(
      optionsWith(driftingFind, { reviewedPlans: [pagedPlan], pageSize: 1 })
    )
    await expectReaderCode(
      () => driftingReaders.readEnrollments(scope),
      'FINANCE_PAYLOAD_RELATIONSHIP_PAGINATION_CHANGED'
    )
  })

  it.each([
    { ...plan, reviewReference: 'not-reviewed' },
    { ...plan, enrollmentIds: [101, 101] },
    { ...plan, enrollmentIds: [101], courseRunIds: [] },
    { ...plan, campaignIds: [0] },
    { ...plan, tenantId: ' canonical-tenant ' },
    { ...plan, payloadTenantId: 'tenant-cep' },
  ])('rejects an invalid reviewed plan before any Payload read: %o', (invalidPlan) => {
    const find = vi.fn()

    expect(() =>
      createPayloadFinanceRelationshipReaders(optionsWith(find, { reviewedPlans: [invalidPlan] }))
    ).toThrowError(
      expect.objectContaining<Partial<PayloadFinanceRelationshipReaderError>>({
        code: 'FINANCE_PAYLOAD_RELATIONSHIP_PLAN_INVALID',
      })
    )
    expect(find).not.toHaveBeenCalled()
  })

  it('rejects IDs assigned to more than one legal entity', () => {
    const find = vi.fn()

    expect(() =>
      createPayloadFinanceRelationshipReaders(
        optionsWith(find, {
          reviewedPlans: [
            plan,
            {
              ...plan,
              legalEntityId: 'entity-norte',
              reviewReference: 'review://finance/entity-norte/2026-07-24',
            },
          ],
        })
      )
    ).toThrowError(
      expect.objectContaining<Partial<PayloadFinanceRelationshipReaderError>>({
        code: 'FINANCE_PAYLOAD_RELATIONSHIP_PLAN_DUPLICATE',
      })
    )
  })

  it('fails closed for an unreviewed entity scope without querying Payload', async () => {
    const find = vi.fn(async () => page([]))
    const readers = createPayloadFinanceRelationshipReaders(optionsWith(find))

    await expectReaderCode(
      () => readers.readEnrollments({ ...scope, legalEntityId: 'entity-norte' }),
      'FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_MISSING'
    )
    expect(find).not.toHaveBeenCalled()
  })

  it.each([
    [null, 'FINANCE_PAYLOAD_RELATIONSHIP_INVALID_CONFIGURATION'],
    [{ id: 12, role: 'admin', tenant: 8 }, 'FINANCE_PAYLOAD_RELATIONSHIP_REQUEST_SCOPE_MISMATCH'],
    [
      { id: 1, role: 'superadmin', tenant: null },
      'FINANCE_PAYLOAD_RELATIONSHIP_REQUEST_SCOPE_MISMATCH',
    ],
  ])('rejects an unauthorized request context before I/O: %o', (user, code) => {
    const find = vi.fn()

    expect(() =>
      createPayloadFinanceRelationshipReaders({
        ...optionsWith(find),
        req: payloadRequestWith(find, user),
      })
    ).toThrowError(expect.objectContaining({ code }))
    expect(find).not.toHaveBeenCalled()
  })

  it('accepts a reviewed empty scope without inventing records or performing I/O', async () => {
    const find = vi.fn()
    const readers = createPayloadFinanceRelationshipReaders(
      optionsWith(find, {
        reviewedPlans: [{ ...plan, enrollmentIds: [], courseRunIds: [], campaignIds: [] }],
      })
    )

    expect(await readers.readEnrollments(scope)).toEqual([])
    expect(await readers.readCampaigns(scope)).toEqual([])
    expect(find).not.toHaveBeenCalled()
  })

  it.each([
    [
      'enrollment parent outside the reviewed course runs',
      'enrollments',
      [{ id: 101, course_run: 999, amount_paid: 1 }],
      'FINANCE_PAYLOAD_RELATIONSHIP_RECORD_SCOPE_MISMATCH',
    ],
    [
      'campaign from another tenant',
      'campaigns',
      [{ id: 301, tenant: 8 }],
      'FINANCE_PAYLOAD_RELATIONSHIP_RECORD_SCOPE_MISMATCH',
    ],
    [
      'unexpected record outside reviewed coverage',
      'enrollments',
      [{ id: 999, course_run: 201, amount_paid: 1 }],
      'FINANCE_PAYLOAD_RELATIONSHIP_COVERAGE_MISMATCH',
    ],
  ])('rejects %s', async (_label, dataset, docs, code) => {
    const readers = createPayloadFinanceRelationshipReaders(
      optionsWith(vi.fn(async () => page(docs)))
    )

    await expectReaderCode(
      () =>
        dataset === 'enrollments' ? readers.readEnrollments(scope) : readers.readCampaigns(scope),
      code
    )
  })

  it('rejects missing records when current access returns only partial reviewed coverage', async () => {
    const readers = createPayloadFinanceRelationshipReaders(
      optionsWith(vi.fn(async () => page([], 1, 0, 0)))
    )

    await expectReaderCode(
      () => readers.readEnrollments(scope),
      'FINANCE_PAYLOAD_RELATIONSHIP_COVERAGE_MISMATCH'
    )
  })

  it.each([
    null,
    {},
    page(['not-a-document'] as never),
    { ...page([]), page: 2 },
    { ...page([]), totalDocs: -1 },
    { ...page([]), hasNextPage: 'yes' },
  ])('rejects malformed Payload pagination: %o', async (response) => {
    const readers = createPayloadFinanceRelationshipReaders(
      optionsWith(vi.fn(async () => response))
    )

    await expectReaderCode(
      () => readers.readEnrollments(scope),
      'FINANCE_PAYLOAD_RELATIONSHIP_PAGE_INVALID'
    )
  })

  it('redacts provider failures and exposes no provider message', async () => {
    const readers = createPayloadFinanceRelationshipReaders(
      optionsWith(
        vi.fn(async () => {
          throw new Error('postgres://finance-admin:secret@example.test/cep')
        })
      )
    )

    let captured: unknown
    try {
      await readers.readEnrollments(scope)
    } catch (error) {
      captured = error
    }

    expect(captured).toEqual(
      expect.objectContaining<Partial<PayloadFinanceRelationshipReaderError>>({
        code: 'FINANCE_PAYLOAD_RELATIONSHIP_ENROLLMENTS_READ_FAILED',
      })
    )
    expect(JSON.stringify(captured)).not.toContain('finance-admin:secret')
    expect((captured as Error).message).toBe('Finance Payload relationship reading failed.')
  })

  it('composes with the finance snapshot loader while payment and Meta readers stay separate', async () => {
    const find = vi.fn(async ({ collection }: { collection: string }) =>
      collection === 'enrollments'
        ? page([{ id: 101, course_run: 201, amount_paid: 0 }])
        : page([{ id: 301, tenant: 7 }])
    )
    const relationshipReaders = createPayloadFinanceRelationshipReaders(optionsWith(find))

    const snapshot = await loadFinanceReconciliationSnapshot({
      scope: { ...scope, connectionId: 'connection-sur' },
      readers: {
        readAccountingTransactions: async () => [],
        ...relationshipReaders,
        readPaymentEvents: async () => [],
        readAdvertisingSpend: async () => [],
      },
    })

    expect(snapshot.operational.enrollments).toEqual([
      { id: 101, tenantId: scope.tenantId, legalEntityId: scope.legalEntityId, amountPaid: 0 },
    ])
    expect(snapshot.operational.campaigns).toEqual([
      { id: 301, tenantId: scope.tenantId, legalEntityId: scope.legalEntityId },
    ])
    expect(Object.keys(relationshipReaders).sort()).toEqual(['readCampaigns', 'readEnrollments'])
  })

  it('remains disconnected from Payload configuration', () => {
    const workspaceRoot = existsSync(resolve(process.cwd(), 'src/payload.config.ts'))
      ? process.cwd()
      : resolve(process.cwd(), 'apps/tenant-admin')
    const serialized = readFileSync(resolve(workspaceRoot, 'src/payload.config.ts'), 'utf8')

    expect(serialized).not.toContain('finance-payload-relationship-readers')
    expect(serialized).not.toContain('createPayloadFinanceRelationshipReaders')
  })
})
