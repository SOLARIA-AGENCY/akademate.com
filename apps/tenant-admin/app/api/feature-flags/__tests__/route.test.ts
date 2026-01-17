/**
 * @fileoverview Feature Flags API tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PATCH } from '../route'

const { mockDbOperations, resetDbMocks, setExecuteQueue } = vi.hoisted(() => {
  let executeQueue: unknown[] = []

  const mockDbOperations = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    execute: vi.fn(async () => executeQueue.shift()),
  }

  const resetDbMocks = () => {
    vi.clearAllMocks()
    executeQueue = []
    mockDbOperations.execute.mockImplementation(async () => executeQueue.shift())
  }

  const setExecuteQueue = (queue: unknown[]) => {
    executeQueue = queue
  }

  return {
    mockDbOperations,
    resetDbMocks,
    setExecuteQueue,
  }
})

vi.mock('@/@payload-config/lib/db', () => ({
  db: mockDbOperations,
  featureFlags: {
    key: 'key',
  },
  tenants: {
    id: 'id',
  },
}))

const validTenantId = '550e8400-e29b-41d4-a716-446655440000'

const mockTenant = {
  id: validTenantId,
  plan: 'starter',
}

const mockFlags = [
  {
    key: 'beta-feature',
    type: 'boolean',
    defaultValue: true,
    overrides: [],
    planRequirement: 'pro',
  },
  {
    key: 'rollout-feature',
    type: 'percentage',
    defaultValue: 50,
    overrides: [{ tenantId: validTenantId, value: 100 }],
    planRequirement: null,
  },
]

describe('GET /api/feature-flags', () => {
  beforeEach(() => {
    resetDbMocks()
  })

  it('returns 400 for invalid tenantId', async () => {
    const request = new NextRequest('http://localhost/api/feature-flags?tenantId=bad')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid tenantId')
  })

  it('returns 404 when tenant is missing', async () => {
    setExecuteQueue([[]])

    const request = new NextRequest(`http://localhost/api/feature-flags?tenantId=${validTenantId}`)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Tenant not found')
  })

  it('evaluates flags for tenant', async () => {
    setExecuteQueue([[mockTenant], mockFlags])

    const request = new NextRequest(`http://localhost/api/feature-flags?tenantId=${validTenantId}`)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.flags).toEqual([
      expect.objectContaining({
        key: 'beta-feature',
        eligible: false,
        effectiveValue: false,
      }),
      expect.objectContaining({
        key: 'rollout-feature',
        eligible: true,
        overrideValue: 100,
      }),
    ])
  })
})

describe('PATCH /api/feature-flags', () => {
  beforeEach(() => {
    resetDbMocks()
  })

  it('returns 400 for invalid payload', async () => {
    const request = new NextRequest('http://localhost/api/feature-flags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: 'bad', key: '' }),
    })

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request')
  })

  it('returns 404 when flag is missing', async () => {
    setExecuteQueue([[]])

    const request = new NextRequest('http://localhost/api/feature-flags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: validTenantId, key: 'missing', value: true }),
    })

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Flag not found')
  })

  it('updates override for tenant', async () => {
    setExecuteQueue([[mockFlags[0]], undefined])

    const request = new NextRequest('http://localhost/api/feature-flags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: validTenantId, key: 'beta-feature', value: true }),
    })

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.overrideValue).toBe(true)
    expect(mockDbOperations.update).toHaveBeenCalled()
    expect(mockDbOperations.set).toHaveBeenCalledWith(
      expect.objectContaining({
        overrides: [{ tenantId: validTenantId, value: true }],
      })
    )
  })
})
