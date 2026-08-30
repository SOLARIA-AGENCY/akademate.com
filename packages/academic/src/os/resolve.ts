import { BLUEPRINTS, MCP_TOOL_CAPABILITIES, PLAN_ENTITLEMENTS, ROUTE_CAPABILITIES } from './catalog'
import {
  PLAN_MARKETING_ALIAS,
  isBlueprintId,
  isCapabilityId,
  isDeploymentMode,
  isPlanTier,
  type CapabilityId,
  type ConfigurationSource,
  type EnvOperatingInput,
  type ResolvedOperatingProfile,
  type TenantOperatingInput,
} from './types'

function uniqueCapabilities(values: readonly string[]): CapabilityId[] {
  return Array.from(new Set(values.filter(isCapabilityId)))
}

export function hasCapability(
  profile: Pick<ResolvedOperatingProfile, 'effectiveCapabilities'>,
  capability: CapabilityId,
): boolean {
  return profile.effectiveCapabilities.includes(capability)
}

export function filterByCapability<T extends { capability?: CapabilityId | null }>(
  items: T[],
  profile: Pick<ResolvedOperatingProfile, 'effectiveCapabilities'>,
): T[] {
  return items.filter((item) => !item.capability || hasCapability(profile, item.capability))
}

export function resolveOperatingProfile(input: {
  tenant?: TenantOperatingInput | null
  env?: EnvOperatingInput | null
}): ResolvedOperatingProfile {
  const tenant = input.tenant ?? {}
  const env = input.env ?? {}

  let planSource: ConfigurationSource = 'SYSTEM'
  let planTier: ResolvedOperatingProfile['planTier'] = 'starter'
  if (isPlanTier(tenant.planTier)) {
    planTier = tenant.planTier
    planSource = 'TENANT'
  } else if (isPlanTier(env.planTier)) {
    planTier = env.planTier
    planSource = 'ENV'
  }

  let deploymentSource: ConfigurationSource = 'SYSTEM'
  let deploymentMode: ResolvedOperatingProfile['deploymentMode'] = 'managed_cloud'
  if (isDeploymentMode(tenant.deploymentMode)) {
    deploymentMode = tenant.deploymentMode
    deploymentSource = 'TENANT'
  } else if (isDeploymentMode(env.deploymentMode)) {
    deploymentMode = env.deploymentMode
    deploymentSource = 'ENV'
  }

  let blueprintSource: ConfigurationSource = 'SYSTEM'
  let academyBlueprint: ResolvedOperatingProfile['academyBlueprint'] = 'professional_training'
  if (isBlueprintId(tenant.academyBlueprint)) {
    academyBlueprint = tenant.academyBlueprint
    blueprintSource = 'TENANT'
  } else if (isBlueprintId(env.blueprintId)) {
    academyBlueprint = env.blueprintId
    blueprintSource = 'ENV'
  }

  const blueprint = BLUEPRINTS[academyBlueprint]
  const planCaps = new Set(PLAN_ENTITLEMENTS[planTier])
  const blueprintCaps = new Set(blueprint.availableCapabilities)
  const intersection = uniqueCapabilities(
    Array.from(planCaps).filter((capability) => blueprintCaps.has(capability)),
  )
  const tenantExtras = uniqueCapabilities(tenant.enabledCapabilities ?? []).filter((capability) =>
    blueprintCaps.has(capability),
  )
  const enterpriseOverrides =
    planTier === 'enterprise' ? uniqueCapabilities(tenant.customCapabilities ?? []) : []

  const effectiveCapabilities = uniqueCapabilities([
    ...intersection,
    ...tenantExtras,
    ...enterpriseOverrides,
  ])

  const lockedCapabilities = uniqueCapabilities([
    ...blueprint.defaultLocked,
    ...(tenant.lockedCapabilities ?? []),
  ])

  return {
    planTier,
    planLabel: PLAN_MARKETING_ALIAS[planTier],
    deploymentMode,
    academyBlueprint,
    blueprintVersion: tenant.blueprintVersion || blueprint.version,
    academyModelLabel: blueprint.academyModelLabel,
    blueprintLabel: blueprint.blueprintLabel,
    customisationLabel: blueprint.customisationLabel,
    effectiveCapabilities,
    lockedCapabilities,
    sources: {
      planTier: planSource,
      deploymentMode: deploymentSource,
      academyBlueprint: blueprintSource,
    },
  }
}

export function operatingProfileFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): EnvOperatingInput {
  return {
    planTier: env.AKADEMATE_PLAN_TIER ?? null,
    deploymentMode: env.AKADEMATE_DEPLOYMENT_MODE ?? null,
    blueprintId: env.AKADEMATE_BLUEPRINT_ID ?? null,
  }
}

export function listToolsByCapability<T extends { name: string }>(
  tools: T[],
  profile: Pick<ResolvedOperatingProfile, 'effectiveCapabilities'>,
): T[] {
  return tools.filter((tool) => {
    const required = MCP_TOOL_CAPABILITIES[tool.name]
    return !required || hasCapability(profile, required)
  })
}

const SESSION_ENGINE_PATH =
  /\/api\/course-runs\/[^/]+\/(sessions|phases|recurrence|hours|conflicts)(\/|$)/
const SESSION_RECORD_PATH = /\/api\/sessions(\/|$)/

export function capabilityForPath(pathname: string): CapabilityId | null {
  const path = pathname.split('?')[0]
  const exact = ROUTE_CAPABILITIES[path]
  if (exact) return exact
  for (const [prefix, capability] of Object.entries(ROUTE_CAPABILITIES)) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return capability
  }
  if (SESSION_ENGINE_PATH.test(path) || SESSION_RECORD_PATH.test(path)) {
    return 'session_level_scheduling'
  }
  return null
}

export function planBadgeLabel(planTier: ResolvedOperatingProfile['planTier']): string {
  switch (planTier) {
    case 'enterprise':
      return 'ENTERPRISE'
    case 'pro':
      return 'BUSINESS'
    case 'starter':
      return 'LAUNCH'
    default: {
      const exhaustive: never = planTier
      return exhaustive
    }
  }
}

export function deploymentBadgeLabel(mode: ResolvedOperatingProfile['deploymentMode']): string {
  switch (mode) {
    case 'on_premise':
      return 'ON-PREMISE'
    case 'dedicated_cloud':
      return 'DEDICATED CLOUD'
    case 'managed_cloud':
      return 'MANAGED CLOUD'
    default: {
      const exhaustive: never = mode
      return exhaustive
    }
  }
}
