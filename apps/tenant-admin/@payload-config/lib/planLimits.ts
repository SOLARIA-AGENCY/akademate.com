export const PLAN_LIMITS = {
  starter: { sedes: 1, cursos: 20, ciclos: 0 },
  pro: { sedes: 5, cursos: 100, ciclos: 10 },
  enterprise: { sedes: Infinity, cursos: Infinity, ciclos: Infinity },
} as const

export type ResourceKey = 'sedes' | 'cursos' | 'ciclos'
export type PlanKey = keyof typeof PLAN_LIMITS

export function getLimit(plan: string | null | undefined, resource: ResourceKey): number {
  const key = (plan ?? 'starter') as PlanKey
  return PLAN_LIMITS[key]?.[resource] ?? PLAN_LIMITS.starter[resource]
}

export const RESOURCE_LABELS: Record<ResourceKey, string> = {
  sedes: 'sedes',
  cursos: 'cursos',
  ciclos: 'ciclos formativos',
}

export const PLAN_LABELS: Record<PlanKey, string> = {
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
}
