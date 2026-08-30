export const PLAN_TIERS = ['starter', 'pro', 'enterprise'] as const
export type PlanTier = (typeof PLAN_TIERS)[number]

export const PLAN_MARKETING_ALIAS = {
  starter: 'Launch',
  pro: 'Business',
  enterprise: 'Enterprise',
} as const

export const DEPLOYMENT_MODES = ['managed_cloud', 'dedicated_cloud', 'on_premise'] as const
export type DeploymentMode = (typeof DEPLOYMENT_MODES)[number]

export const CONFIGURATION_SOURCES = [
  'SYSTEM',
  'PLAN',
  'BLUEPRINT',
  'TENANT',
  'ENTERPRISE_OVERRIDE',
  'ENV',
] as const
export type ConfigurationSource = (typeof CONFIGURATION_SOURCES)[number]

export const CAPABILITY_IDS = [
  'courses',
  'course_cycles',
  'advanced_course_runs',
  'academic_phases',
  'session_level_scheduling',
  'multi_instructor_courses',
  'external_practices',
  'partner_organizations',
  'external_venues',
  'room_resource_scheduling',
  'instructor_workload',
  'instructor_finance',
  'regulated_programmes',
  'academic_documents',
  'advanced_conflict_detection',
  'recurring_sessions',
  'memberships',
  'academic_levels',
  'lms',
] as const
export type CapabilityId = (typeof CAPABILITY_IDS)[number]

export const BLUEPRINT_IDS = [
  'professional_training',
  'professional_training_advanced',
  'cep-professional-training-enterprise-v1',
  'yoga_pilates_wellness',
  'language_academy',
] as const
export type BlueprintId = (typeof BLUEPRINT_IDS)[number]

export type TenantOperatingInput = {
  planTier?: string | null
  deploymentMode?: string | null
  academyBlueprint?: string | null
  blueprintVersion?: string | null
  enabledCapabilities?: string[] | null
  lockedCapabilities?: string[] | null
  customCapabilities?: string[] | null
}

export type EnvOperatingInput = {
  planTier?: string | null
  deploymentMode?: string | null
  blueprintId?: string | null
}

export type ResolvedOperatingProfile = {
  planTier: PlanTier
  planLabel: string
  deploymentMode: DeploymentMode
  academyBlueprint: BlueprintId
  blueprintVersion: string
  academyModelLabel: string
  blueprintLabel: string
  customisationLabel: string | null
  effectiveCapabilities: CapabilityId[]
  lockedCapabilities: CapabilityId[]
  sources: {
    planTier: ConfigurationSource
    deploymentMode: ConfigurationSource
    academyBlueprint: ConfigurationSource
  }
}

export function isPlanTier(value: string | null | undefined): value is PlanTier {
  return (PLAN_TIERS as readonly string[]).includes(String(value ?? ''))
}

export function isDeploymentMode(value: string | null | undefined): value is DeploymentMode {
  return (DEPLOYMENT_MODES as readonly string[]).includes(String(value ?? ''))
}

export function isCapabilityId(value: string): value is CapabilityId {
  return (CAPABILITY_IDS as readonly string[]).includes(value)
}

export function isBlueprintId(value: string | null | undefined): value is BlueprintId {
  return (BLUEPRINT_IDS as readonly string[]).includes(String(value ?? ''))
}
