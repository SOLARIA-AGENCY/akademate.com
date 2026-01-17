/**
 * @fileoverview Usage Meter API tests
 * Tests: GET/POST /api/billing/usage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

const { mockDbOperations, resetDbMocks, setExecuteQueue } = vi.hoisted(() => {
  let executeQueue: unknown[] = []

  const mockDbOperations = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
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
  subscriptions: {
    id: 'id',
    tenantId: 'tenant_id',
    updatedAt: 'updated_at',
  },
}))

const validTenantId = '550e8400-e29b-41d4-a716-446655440000'

const baseSubscription = {
  id: 'sub-uuid',
  tenantId: validTenantId,
  usageMeter: {
    alumnos: { value: 10, unit: 'alumnos', limit: 100, updatedAt: '2026-01-01T00:00:00.000Z' },
  },
}

describe('GET /api/billing/usage', () => {
  beforeEach(() => {
    resetDbMocks()
  })

  it('returns 400 when tenantId is missing', async () => {
    const request = new NextRequest('http://localhost/api/billing/usage')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid tenantId')
  })

  it('returns 404 when subscription is not found', async () => {
    setExecuteQueue([[]])

    const request = new NextRequest(`http://localhost/api/billing/usage?tenantId=${validTenantId}`)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Subscription not found')
  })

  it('returns usage meter data for tenant', async () => {
    setExecuteQueue([[baseSubscription]])

    const request = new NextRequest(`http://localhost/api/billing/usage?tenantId=${validTenantId}`)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.subscriptionId).toBe(baseSubscription.id)
    expect(data.usage).toEqual(baseSubscription.usageMeter)
  })
})

describe('POST /api/billing/usage', () => {
  beforeEach(() => {
    resetDbMocks()
  })

  it('returns 400 when payload is invalid', async () => {
    const request = new NextRequest('http://localhost/api/billing/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: 'not-a-uuid' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request')
  })

  it('returns 404 when subscription is not found', async () => {
    setExecuteQueue([[]])

    const request = new NextRequest('http://localhost/api/billing/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: validTenantId,
        usage: [{ metric: 'alumnos', value: 20, unit: 'alumnos', limit: 100 }],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Subscription not found')
  })

  it('updates usage meter for tenant subscription', async () => {
    setExecuteQueue([[baseSubscription]])

    const request = new NextRequest('http://localhost/api/billing/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: validTenantId,
        usage: [
          { metric: 'alumnos', value: 25, unit: 'alumnos', limit: 100 },
          { metric: 'storage', value: 12.5, unit: 'GB', limit: 50 },
        ],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.subscriptionId).toBe(baseSubscription.id)
    expect(mockDbOperations.update).toHaveBeenCalled()
    expect(mockDbOperations.set).toHaveBeenCalledWith(
      expect.objectContaining({
        usageMeter: expect.objectContaining({
          alumnos: expect.objectContaining({ value: 25, unit: 'alumnos', limit: 100 }),
          storage: expect.objectContaining({ value: 12.5, unit: 'GB', limit: 50 }),
        }),
      })
    )
  })
})
