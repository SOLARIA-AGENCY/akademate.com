import { useQuery } from '@tanstack/react-query'

export interface OpsTenant {
  id: string
  name: string
  slug: string
  domain?: string | null
  active: boolean
  contactEmail?: string | null
  contactPhone?: string | null
  notes?: string | null
  createdAt: string
  updatedAt?: string
  limits?: {
    maxUsers?: number | null
    maxCourses?: number | null
    maxLeadsPerMonth?: number | null
    storageQuotaMB?: number | null
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

async function fetchTenant(id: string): Promise<OpsTenant> {
  const res = await fetch(`/api/ops/tenants/${id}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Error al obtener tenant')
  const data = await res.json()
  return data.doc
}

async function fetchMetrics(): Promise<OpsMetrics> {
  const res = await fetch('/api/ops/metrics', { credentials: 'include' })
  if (!res.ok) throw new Error('Error al obtener métricas')
  return res.json()
}

export interface MrrData {
  mrr_eur: number
  arr_eur: number
  mrr_growth_pct: number | null
  active_tenants: number
  plan_breakdown: Record<string, { count: number; mrr: number }>
  calculated_at: string
}

export interface ChurnData {
  churned_count: number
  churned_mrr_eur: number
  logo_churn_rate_pct: number
  active_at_month_start: number
  churned_tenants: { id: string; name: string; plan: string; mrr_lost: number }[]
  period_start: string
  calculated_at: string
}

export interface GrowthData {
  new_this_month: number
  new_last_month: number
  signup_growth_pct: number | null
  trial_to_paid_pct: number | null
  recent_signups: { id: string; name: string; slug: string; created_at: string }[]
  period_start: string
  calculated_at: string
}

export interface ServiceHealthData {
  overall: 'operational' | 'degraded' | 'outage'
  operationalCount: number
  totalServices: number
  services: { name: string; status: string; latencyMs: number | null; message: string; uptime: number }[]
  checkedAt: string
}

export function useTenants() {
  return useQuery({
    queryKey: ['ops', 'tenants'],
    queryFn: fetchTenants,
  })
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ['ops', 'tenant', id],
    queryFn: () => fetchTenant(id),
    enabled: Boolean(id),
  })
}

export function useOpsMetrics() {
  return useQuery({
    queryKey: ['ops', 'metrics'],
    queryFn: fetchMetrics,
  })
}

export function useMrr() {
  return useQuery<MrrData>({
    queryKey: ['ops', 'mrr'],
    queryFn: async () => {
      const res = await fetch('/api/ops/mrr', { credentials: 'include' })
      if (!res.ok) throw new Error('Error al obtener MRR')
      return res.json()
    },
    staleTime: 60_000,
  })
}

export function useChurn() {
  return useQuery<ChurnData>({
    queryKey: ['ops', 'churn'],
    queryFn: async () => {
      const res = await fetch('/api/ops/churn', { credentials: 'include' })
      if (!res.ok) throw new Error('Error al obtener churn')
      return res.json()
    },
    staleTime: 60_000,
  })
}

export function useGrowth() {
  return useQuery<GrowthData>({
    queryKey: ['ops', 'growth'],
    queryFn: async () => {
      const res = await fetch('/api/ops/growth', { credentials: 'include' })
      if (!res.ok) throw new Error('Error al obtener growth')
      return res.json()
    },
    staleTime: 60_000,
  })
}

export function useServiceHealth() {
  return useQuery<ServiceHealthData>({
    queryKey: ['ops', 'service-health'],
    queryFn: async () => {
      const res = await fetch('/api/ops/service-health', { credentials: 'include' })
      if (!res.ok) throw new Error('Error al obtener service health')
      return res.json()
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
