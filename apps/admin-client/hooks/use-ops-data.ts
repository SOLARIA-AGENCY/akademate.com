import { useQuery } from '@tanstack/react-query'

export interface OpsTenant {
  id: string
  name: string
  slug: string
  domain?: string
  active: boolean
  createdAt: string
  limits?: {
    maxUsers?: number
    maxCourses?: number
  }
}

export interface OpsTenantsResponse {
  docs: OpsTenant[]
  totalDocs: number
  page: number
  totalPages: number
}

export interface OpsMetrics {
  tenants: { total: number; active: number; trial: number }
  users: { total: number }
  courses: { total: number }
  enrollments: { total: number }
}

async function fetchTenants(): Promise<OpsTenantsResponse> {
  const res = await fetch('/api/ops/tenants?limit=100', { credentials: 'include' })
  if (!res.ok) throw new Error('Error al obtener tenants')
  return res.json()
}

async function fetchMetrics(): Promise<OpsMetrics> {
  const res = await fetch('/api/ops/metrics', { credentials: 'include' })
  if (!res.ok) throw new Error('Error al obtener métricas')
  return res.json()
}

export function useTenants() {
  return useQuery({
    queryKey: ['ops', 'tenants'],
    queryFn: fetchTenants,
  })
}

export function useOpsMetrics() {
  return useQuery({
    queryKey: ['ops', 'metrics'],
    queryFn: fetchMetrics,
  })
}
