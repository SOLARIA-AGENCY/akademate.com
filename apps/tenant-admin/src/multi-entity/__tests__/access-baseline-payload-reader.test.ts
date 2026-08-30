import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { createMultiEntityAccessBaseline } from '../../../../../packages/tenant/src/multi-entity-access-baseline'
import {
  PAYLOAD_ACCESS_BASELINE_USER_SELECT,
  PayloadAccessBaselineReaderError,
  createPayloadAccessBaselineInputLoader,
} from '../access-baseline-payload-reader'

const POLICY_DIGEST = `sha256:${'a'.repeat(64)}`

function page(
  docs: readonly Record<string, unknown>[],
  overrides: Partial<{
    page: number
    totalDocs: number
    totalPages: number
    hasNextPage: boolean
    nextPage: number | null
  }> = {}
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

function requestWith(find: ReturnType<typeof vi.fn>, role = 'superadmin'): PayloadRequest {
  return {
    payload: { find },
    user: { id: 1, role, collection: 'users' },
  } as unknown as PayloadRequest
}

function options(find: ReturnType<typeof vi.fn>) {
  return {
    req: requestWith(find),
    targetTenantId: '7',
    policyDigest: POLICY_DIGEST,
    auditReviewReference: 'review://access-baseline/staging-001',
    pageSize: 100,
    maxPages: 10,
    maxUsers: 100,
  }
}

function validUsers() {
  return [
    { id: 1, role: 'superadmin', tenant: null, is_active: true, email: 'platform@secret' },
    { id: 10, role: 'admin', tenant: 7, is_active: true, email: 'admin@secret' },
    { id: 11, role: 'marketing', tenant: { id: 7, name: 'CEP secret' }, is_active: null },
  ]
}

function expectCode(action: () => Promise<unknown>, code: string): Promise<void> {
  return expect(action()).rejects.toEqual(
    expect.objectContaining<Partial<PayloadAccessBaselineReaderError>>({ code })
  )
}

describe('access baseline Payload reader', () => {
  it('reads the complete tenant and platform-superadmin scope with minimal fields', async () => {
    const find = vi.fn(async () => page(validUsers()))
    const req = requestWith(find)
    const snapshot = await createPayloadAccessBaselineInputLoader({ ...options(find), req })()

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        where: {
          or: [{ tenant: { equals: 7 } }, { role: { equals: 'superadmin' } }],
        },
        page: 1,
        limit: 100,
        pagination: true,
        sort: 'id',
        depth: 0,
        overrideAccess: false,
        req,
        select: PAYLOAD_ACCESS_BASELINE_USER_SELECT,
        showHiddenFields: false,
        trash: false,
      })
    )
    expect(snapshot.users).toEqual([
      { id: '1', role: 'superadmin', tenantId: null, isActive: true },
      { id: '10', role: 'admin', tenantId: '7', isActive: true },
      { id: '11', role: 'marketing', tenantId: '7', isActive: null },
    ])
    expect(createMultiEntityAccessBaseline(snapshot)).toMatchObject({
      canChangePermissions: false,
      metrics: { users: 3, activeUsers: 2, unsetActiveStateUsers: 1 },
    })
    expect(JSON.stringify(snapshot)).not.toContain('@secret')
    expect(JSON.stringify(snapshot)).not.toContain('CEP secret')
    expect(JSON.stringify(snapshot)).not.toContain('review://')
  })

  it('requires an explicitly reviewed platform audit actor before I/O', () => {
    const find = vi.fn()
    expect(() =>
      createPayloadAccessBaselineInputLoader({
        ...options(find),
        req: requestWith(find, 'admin'),
      })
    ).toThrowError(expect.objectContaining({ code: 'ACCESS_BASELINE_PAYLOAD_AUDIT_ROLE_REQUIRED' }))
    expect(() =>
      createPayloadAccessBaselineInputLoader({
        ...options(find),
        auditReviewReference: 'ticket-1',
      })
    ).toThrowError(
      expect.objectContaining({ code: 'ACCESS_BASELINE_PAYLOAD_INVALID_CONFIGURATION' })
    )
    expect(find).not.toHaveBeenCalled()
  })

  it('reads stable pagination sequentially', async () => {
    const find = vi.fn(async ({ page: requestedPage }: { page: number }) =>
      requestedPage === 1
        ? page([validUsers()[0]!], {
            totalDocs: 2,
            totalPages: 2,
            hasNextPage: true,
            nextPage: 2,
          })
        : page([validUsers()[1]!], {
            page: 2,
            totalDocs: 2,
            totalPages: 2,
          })
    )
    const snapshot = await createPayloadAccessBaselineInputLoader({
      ...options(find),
      pageSize: 1,
    })()
    expect(snapshot.users).toHaveLength(2)
    expect(find).toHaveBeenCalledTimes(2)
  })

  it('detects pagination drift and duplicate users', async () => {
    const drift = vi.fn(async ({ page: requestedPage }: { page: number }) =>
      requestedPage === 1
        ? page([validUsers()[0]!], {
            totalDocs: 2,
            totalPages: 2,
            hasNextPage: true,
            nextPage: 2,
          })
        : page([validUsers()[1]!], {
            page: 2,
            totalDocs: 3,
            totalPages: 3,
            hasNextPage: true,
            nextPage: 3,
          })
    )
    await expectCode(
      () => createPayloadAccessBaselineInputLoader({ ...options(drift), pageSize: 1 })(),
      'ACCESS_BASELINE_PAYLOAD_PAGINATION_CHANGED'
    )

    const duplicate = vi.fn(async () => page([validUsers()[1]!, validUsers()[1]!]))
    await expectCode(
      () => createPayloadAccessBaselineInputLoader(options(duplicate))(),
      'ACCESS_BASELINE_PAYLOAD_DUPLICATE_USER'
    )
  })

  it.each([
    [{ id: 10, role: 'unknown', tenant: 7, is_active: true }, 'invalid role'],
    [{ id: 10, role: 'admin', tenant: 8, is_active: true }, 'cross tenant'],
    [{ id: 1, role: 'superadmin', tenant: 7, is_active: true }, 'scoped superadmin'],
    [{ id: 10, role: 'admin', tenant: 7 }, 'missing active state'],
  ])('rejects an invalid user snapshot: %s', async (user) => {
    const find = vi.fn(async () => page([user]))
    await expectCode(
      () => createPayloadAccessBaselineInputLoader(options(find))(),
      'ACCESS_BASELINE_PAYLOAD_USER_INVALID'
    )
  })

  it('enforces page and user limits before returning a snapshot', async () => {
    const find = vi.fn(async () => page(validUsers(), { totalDocs: 3, totalPages: 1 }))
    await expectCode(
      () => createPayloadAccessBaselineInputLoader({ ...options(find), maxUsers: 2 })(),
      'ACCESS_BASELINE_PAYLOAD_USER_LIMIT_EXCEEDED'
    )
  })

  it('redacts provider failures and performs no retry or subsequent read', async () => {
    const find = vi.fn(async () => {
      throw new Error('postgres://admin:secret@example.test')
    })
    let captured: unknown
    try {
      await createPayloadAccessBaselineInputLoader(options(find))()
    } catch (error) {
      captured = error
    }
    expect(captured).toEqual(
      expect.objectContaining({ code: 'ACCESS_BASELINE_PAYLOAD_READ_FAILED' })
    )
    expect(JSON.stringify(captured)).not.toContain('admin:secret')
    expect(find).toHaveBeenCalledTimes(1)
  })

  it('remains disconnected from Payload config, routes and jobs', () => {
    const workspaceConfig = resolve(process.cwd(), 'src/payload.config.ts')
    const repositoryConfig = resolve(process.cwd(), 'apps/tenant-admin/src/payload.config.ts')
    const payloadConfig = readFileSync(
      existsSync(workspaceConfig) ? workspaceConfig : repositoryConfig,
      'utf8'
    )
    expect(payloadConfig).not.toContain('access-baseline-payload-reader')
    expect(payloadConfig).not.toContain('createPayloadAccessBaselineInputLoader')
  })

  it('exports no write, mutation, activation or permission function', async () => {
    const module = await import('../access-baseline-payload-reader')
    expect(
      Object.keys(module).filter((key) =>
        /write|mutate|activate|permission|execute|apply/i.test(key)
      )
    ).toEqual([])
  })
})
