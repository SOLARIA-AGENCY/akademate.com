/**
 * @fileoverview Transactions API tests
 * Tests: GET /api/billing/transactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'

const { mockDbOperations, resetDbMocks, setExecuteQueue } = vi.hoisted(() => {
  let executeQueue: unknown[] = []

  const mockDbOperations = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
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
  paymentTransactions: {
    tenantId: 'tenant_id',
    createdAt: 'created_at',
  },
}))

const validTenantId = '550e8400-e29b-41d4-a716-446655440000'

const mockTransactions = [
  {
    id: 'txn-1',
    tenantId: validTenantId,
    amount: 1000,
    currency: 'EUR',
    status: 'succeeded',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  },
]

describe('GET /api/billing/transactions', () => {
  beforeEach(() => {
    resetDbMocks()
  })

  it('returns 400 on invalid tenantId', async () => {
    const request = new NextRequest('http://localhost/api/billing/transactions?tenantId=bad')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request')
  })

  it('returns transactions for tenant', async () => {
    setExecuteQueue([mockTransactions])

    const request = new NextRequest(`http://localhost/api/billing/transactions?tenantId=${validTenantId}`)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.transactions).toEqual([
      expect.objectContaining({
        id: 'txn-1',
        tenantId: validTenantId,
        amount: 1000,
        currency: 'EUR',
        status: 'succeeded',
      }),
    ])
    expect(typeof data.transactions[0].createdAt).toBe('string')
  })
})
