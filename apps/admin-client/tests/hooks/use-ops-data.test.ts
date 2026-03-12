import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useTenants, useOpsMetrics } from '../../hooks/use-ops-data'

const mockTenantsResponse = {
  docs: [
    { id: '1', name: 'CEP Formación', slug: 'cep', active: true, createdAt: '2025-01-01', limits: { maxUsers: 50, maxCourses: 100 } },
    { id: '2', name: 'Test Academy', slug: 'test', active: false, createdAt: '2025-01-02' },
  ],
  totalDocs: 2,
  page: 1,
  totalPages: 1,
}

const mockMetricsResponse = {
  tenants: { total: 2, active: 1, trial: 0 },
  users: { total: 45 },
  courses: { total: 12 },
  enrollments: { total: 88 },
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useTenants', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset()
  })

  it('fetches and returns tenants data', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTenantsResponse,
    } as Response)

    const { result } = renderHook(() => useTenants(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.docs).toHaveLength(2)
    expect(result.current.data?.docs[0].name).toBe('CEP Formación')
    expect(result.current.data?.totalDocs).toBe(2)
  })

  it('handles fetch error gracefully', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useTenants(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.data).toBeUndefined()
  })

  it('handles non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response)

    const { result } = renderHook(() => useTenants(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useOpsMetrics', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset()
  })

  it('fetches and returns metrics data', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetricsResponse,
    } as Response)

    const { result } = renderHook(() => useOpsMetrics(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.tenants.total).toBe(2)
    expect(result.current.data?.tenants.active).toBe(1)
    expect(result.current.data?.users.total).toBe(45)
  })

  it('handles fetch error gracefully', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useOpsMetrics(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
