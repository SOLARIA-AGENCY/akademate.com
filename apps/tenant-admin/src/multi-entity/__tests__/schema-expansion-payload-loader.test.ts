import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { planMultiEntitySchemaExpansion } from '../../../../../packages/tenant/src/multi-entity-schema-expansion-plan'
import {
  createPayloadSchemaExpansionRecordLoader,
  PAYLOAD_SCHEMA_EXPANSION_ENROLLMENT_LEGACY_SELECT,
  PAYLOAD_SCHEMA_EXPANSION_LEGACY_SELECT,
  PAYLOAD_SCHEMA_EXPANSION_WITH_OWNER_SELECT,
  PayloadSchemaExpansionRecordLoaderError,
  type PayloadSchemaExpansionRecordLoaderOptions,
  type ReviewedSchemaExpansionOwnerBinding,
} from '../schema-expansion-payload-loader'

function requestWith(
  find: ReturnType<typeof vi.fn>,
  user: unknown = { role: 'admin', tenant: 'cep' }
) {
  return { payload: { find }, user } as unknown as PayloadRequest
}

function page(
  docs: readonly Record<string, unknown>[],
  overrides: Readonly<Record<string, unknown>> = {}
) {
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

function binding(
  overrides: Partial<ReviewedSchemaExpansionOwnerBinding> = {}
): ReviewedSchemaExpansionOwnerBinding {
  return {
    collection: 'campuses',
    recordId: 'campus-norte',
    tenantId: 'cep',
    role: 'owner',
    legalEntityId: 'entity-norte',
    reviewReference: 'review://schema-owner/campus-norte',
    ...overrides,
  }
}

function optionsWith(
  find: ReturnType<typeof vi.fn>,
  overrides: Partial<PayloadSchemaExpansionRecordLoaderOptions> = {}
): PayloadSchemaExpansionRecordLoaderOptions {
  return {
    req: requestWith(find),
    context: {
      environment: 'staging',
      tenantId: 'cep',
      reviewReference: 'review://schema-snapshot/cep',
    },
    sources: [{ collection: 'campuses', legalEntityFieldAvailable: false }],
    reviewedOwnerBindings: [],
    pageSize: 100,
    maxPagesPerCollection: 10,
    maxRecords: 100,
    ...overrides,
  }
}

function expectCode(action: () => Promise<unknown>, code: string): Promise<void> {
  return expect(action()).rejects.toEqual(
    expect.objectContaining<Partial<PayloadSchemaExpansionRecordLoaderError>>({ code })
  )
}

describe('schema expansion Payload record loader', () => {
  it('loads a bounded legacy snapshot with effective access and leaves ownership missing', async () => {
    const find = vi.fn(async () =>
      page([{ id: 'campus-norte', tenant: 'cep', name: 'CEP Norte', created_by: 99 }])
    )
    const options = optionsWith(find)
    const records = await createPayloadSchemaExpansionRecordLoader(options)()
    const plan = planMultiEntitySchemaExpansion(records)

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'campuses',
        where: { tenant: { equals: 'cep' } },
        sort: 'id',
        depth: 0,
        overrideAccess: false,
        req: options.req,
        select: PAYLOAD_SCHEMA_EXPANSION_LEGACY_SELECT,
        showHiddenFields: false,
        trash: false,
      })
    )
    expect(records).toEqual([
      {
        collection: 'campuses',
        recordId: 'campus-norte',
        tenantId: 'cep',
        currentLegalEntityId: null,
        reviewedLegalEntityIds: [],
        dependencyLegalEntityIds: [],
      },
    ])
    expect(plan.items[0]).toMatchObject({
      status: 'missing',
      proposedLegalEntityId: null,
      reason: 'reviewed_owner_missing',
      operation: 'none',
    })
    expect(JSON.stringify(records)).not.toContain('CEP Norte')
    expect(JSON.stringify(records)).not.toContain('created_by')
  })

  it('accepts only injected review bindings and keeps multiple owners ambiguous', async () => {
    const find = vi.fn(async () =>
      page([
        {
          id: 'campus-norte',
          tenant: 'cep',
          name: 'A name must never become ownership evidence',
        },
      ])
    )
    const records = await createPayloadSchemaExpansionRecordLoader(
      optionsWith(find, {
        reviewedOwnerBindings: [
          binding(),
          binding({
            legalEntityId: 'entity-sur',
            reviewReference: 'review://schema-owner/campus-norte-sur',
          }),
        ],
      })
    )()
    const plan = planMultiEntitySchemaExpansion(records)

    expect(records[0]?.reviewedLegalEntityIds).toEqual(['entity-norte', 'entity-sur'])
    expect(plan.items[0]).toMatchObject({
      status: 'ambiguous',
      proposedLegalEntityId: null,
      operation: 'none',
      reason: 'multiple_reviewed_owners',
    })
  })

  it('uses legal_entity only when schema capability is explicitly declared', async () => {
    const find = vi.fn(async () =>
      page([{ id: 'campaign-1', tenant: 'cep', legal_entity: { id: 'entity-norte' } }])
    )
    const records = await createPayloadSchemaExpansionRecordLoader(
      optionsWith(find, {
        sources: [{ collection: 'campaigns', legalEntityFieldAvailable: true }],
        reviewedOwnerBindings: [
          binding({
            collection: 'campaigns',
            recordId: 'campaign-1',
            reviewReference: 'review://schema-owner/campaign-1',
          }),
        ],
      })
    )()

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ select: PAYLOAD_SCHEMA_EXPANSION_WITH_OWNER_SELECT })
    )
    expect(records[0]?.currentLegalEntityId).toBe('entity-norte')
    expect(planMultiEntitySchemaExpansion(records).items[0]).toMatchObject({
      status: 'ready',
      operation: 'none',
      proposedLegalEntityId: 'entity-norte',
    })
  })

  it('independently proves an enrollment course run belongs to the tenant', async () => {
    const find = vi.fn(async ({ collection, select }: Record<string, unknown>) => {
      if (collection === 'enrollments') {
        expect(select).toEqual(PAYLOAD_SCHEMA_EXPANSION_ENROLLMENT_LEGACY_SELECT)
        return page([{ id: 'enrollment-1', course_run: 'run-1' }])
      }
      if (collection === 'course-runs') {
        return page([{ id: 'run-1', tenant: 'cep', campus: 'campus-norte' }])
      }
      throw new Error('unexpected collection')
    })
    const records = await createPayloadSchemaExpansionRecordLoader(
      optionsWith(find, {
        sources: [{ collection: 'enrollments', legalEntityFieldAvailable: false }],
      })
    )()

    expect(find).toHaveBeenCalledTimes(2)
    expect(find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { 'course_run.tenant': { equals: 'cep' } } })
    )
    expect(find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'course-runs',
        where: { and: [{ tenant: { equals: 'cep' } }, { id: { in: ['run-1'] } }] },
      })
    )
    expect(records[0]).toMatchObject({ collection: 'enrollments', recordId: 'enrollment-1' })
  })

  it('fails closed when enrollment tenant ownership cannot be independently confirmed', async () => {
    const missing = vi.fn(async ({ collection }: { collection: string }) =>
      collection === 'enrollments' ? page([{ id: 'enrollment-1', course_run: 'run-1' }]) : page([])
    )
    await expectCode(
      () =>
        createPayloadSchemaExpansionRecordLoader(
          optionsWith(missing, {
            sources: [{ collection: 'enrollments', legalEntityFieldAvailable: false }],
          })
        )(),
      'SCHEMA_EXPANSION_PAYLOAD_TENANT_BOUNDARY_VIOLATION'
    )
  })

  it('rejects non-staging, absent context, unauthenticated, superadmin and cross-tenant requests before I/O', () => {
    const find = vi.fn()
    expect(() =>
      createPayloadSchemaExpansionRecordLoader(
        optionsWith(find, {
          context: { ...optionsWith(find).context, environment: 'production' as never },
        })
      )
    ).toThrowError(
      expect.objectContaining<Partial<PayloadSchemaExpansionRecordLoaderError>>({
        code: 'SCHEMA_EXPANSION_PAYLOAD_STAGING_REQUIRED',
      })
    )
    expect(() =>
      createPayloadSchemaExpansionRecordLoader(optionsWith(find, { context: undefined as never }))
    ).toThrowError(
      expect.objectContaining<Partial<PayloadSchemaExpansionRecordLoaderError>>({
        code: 'SCHEMA_EXPANSION_PAYLOAD_STAGING_REQUIRED',
      })
    )
    for (const req of [
      { payload: { find }, user: undefined } as unknown as PayloadRequest,
      requestWith(find, { role: 'superadmin', tenant: 'cep' }),
      requestWith(find, { role: 'admin', tenant: 'other' }),
    ]) {
      expect(() =>
        createPayloadSchemaExpansionRecordLoader(optionsWith(find, { req }))
      ).toThrowError(
        expect.objectContaining<Partial<PayloadSchemaExpansionRecordLoaderError>>({
          code: 'SCHEMA_EXPANSION_PAYLOAD_REQUEST_SCOPE_MISMATCH',
        })
      )
    }
    expect(find).not.toHaveBeenCalled()
  })

  it('rejects unsafe collections, non-review evidence, duplicate bindings and absent bound records', async () => {
    const find = vi.fn(async () => page([]))
    expect(() =>
      createPayloadSchemaExpansionRecordLoader(
        optionsWith(find, {
          sources: [{ collection: 'media' as never, legalEntityFieldAvailable: false }],
        })
      )
    ).toThrowError(
      expect.objectContaining<Partial<PayloadSchemaExpansionRecordLoaderError>>({
        code: 'SCHEMA_EXPANSION_PAYLOAD_UNSUPPORTED_COLLECTION',
      })
    )
    expect(() =>
      createPayloadSchemaExpansionRecordLoader(
        optionsWith(find, {
          reviewedOwnerBindings: [binding({ reviewReference: 'spreadsheet://owners' })],
        })
      )
    ).toThrowError(
      expect.objectContaining<Partial<PayloadSchemaExpansionRecordLoaderError>>({
        code: 'SCHEMA_EXPANSION_PAYLOAD_BINDING_INVALID',
      })
    )
    expect(() =>
      createPayloadSchemaExpansionRecordLoader(
        optionsWith(find, { reviewedOwnerBindings: [binding(), binding()] })
      )
    ).toThrowError(
      expect.objectContaining<Partial<PayloadSchemaExpansionRecordLoaderError>>({
        code: 'SCHEMA_EXPANSION_PAYLOAD_BINDING_DUPLICATE',
      })
    )
    await expectCode(
      () =>
        createPayloadSchemaExpansionRecordLoader(
          optionsWith(find, { reviewedOwnerBindings: [binding()] })
        )(),
      'SCHEMA_EXPANSION_PAYLOAD_BINDING_INVALID'
    )
  })

  it('rejects duplicate records and pagination drift', async () => {
    const duplicate = vi.fn(async () =>
      page([
        { id: 'campus-norte', tenant: 'cep' },
        { id: 'campus-norte', tenant: 'cep' },
      ])
    )
    await expectCode(
      () => createPayloadSchemaExpansionRecordLoader(optionsWith(duplicate))(),
      'SCHEMA_EXPANSION_PAYLOAD_DUPLICATE_RECORD'
    )

    const drift = vi.fn(async ({ page: pageNumber }: { page: number }) =>
      pageNumber === 1
        ? page([{ id: 'campus-1', tenant: 'cep' }], {
            totalDocs: 2,
            totalPages: 2,
            hasNextPage: true,
            nextPage: 2,
          })
        : page([{ id: 'campus-2', tenant: 'cep' }], {
            page: 2,
            totalDocs: 3,
            totalPages: 3,
            hasNextPage: true,
            nextPage: 3,
          })
    )
    await expectCode(
      () => createPayloadSchemaExpansionRecordLoader(optionsWith(drift, { pageSize: 1 }))(),
      'SCHEMA_EXPANSION_PAYLOAD_PAGINATION_CHANGED'
    )
  })

  it('sanitizes provider failures and is not registered in Payload runtime', async () => {
    const find = vi.fn(async () => {
      throw new Error('postgres://admin:secret@example.test/cep')
    })
    let captured: unknown
    try {
      await createPayloadSchemaExpansionRecordLoader(optionsWith(find))()
    } catch (error) {
      captured = error
    }
    expect(captured).toEqual(
      expect.objectContaining<Partial<PayloadSchemaExpansionRecordLoaderError>>({
        code: 'SCHEMA_EXPANSION_PAYLOAD_READ_FAILED',
      })
    )
    expect((captured as Error).message).toBe('Schema expansion Payload snapshot loading failed.')
    expect(JSON.stringify(captured)).not.toContain('admin:secret')

    const workspaceConfig = resolve(process.cwd(), 'src/payload.config.ts')
    const repositoryConfig = resolve(process.cwd(), 'apps/tenant-admin/src/payload.config.ts')
    const payloadConfig = readFileSync(
      existsSync(workspaceConfig) ? workspaceConfig : repositoryConfig,
      'utf8'
    )
    expect(payloadConfig).not.toContain('schema-expansion-payload-loader')
    expect(payloadConfig).not.toContain('createPayloadSchemaExpansionRecordLoader')
  })
})
