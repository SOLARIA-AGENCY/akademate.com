import { describe, expect, it } from 'vitest'
import {
  capabilityForPath,
  deploymentBadgeLabel,
  filterByCapability,
  hasCapability,
  listToolsByCapability,
  MCP_TOOL_CAPABILITIES,
  planBadgeLabel,
  resolveOperatingProfile,
} from '../os'

describe('plan is independent from deployment', () => {
  it('allows Enterprise Dedicated Cloud without On-Premise', () => {
    const profile = resolveOperatingProfile({
      tenant: {
        planTier: 'enterprise',
        deploymentMode: 'dedicated_cloud',
        academyBlueprint: 'professional_training',
      },
    })
    expect(profile.planTier).toBe('enterprise')
    expect(profile.planLabel).toBe('Enterprise')
    expect(profile.deploymentMode).toBe('dedicated_cloud')
    expect(profile.deploymentMode).not.toBe('on_premise')
  })

  it('allows Enterprise On-Premise as a separate axis', () => {
    const profile = resolveOperatingProfile({
      env: {
        planTier: 'enterprise',
        deploymentMode: 'on_premise',
        blueprintId: 'cep-professional-training-enterprise-v1',
      },
    })
    expect(profile.planTier).toBe('enterprise')
    expect(profile.deploymentMode).toBe('on_premise')
    expect(profile.academyBlueprint).toBe('cep-professional-training-enterprise-v1')
    expect(profile.customisationLabel).toBe('CEP Formación')
    expect(profile.sources.planTier).toBe('ENV')
  })

  it('does not infer enterprise from missing tenant fields', () => {
    const profile = resolveOperatingProfile({})
    expect(profile.planTier).toBe('starter')
    expect(profile.deploymentMode).toBe('managed_cloud')
    expect(profile.planLabel).toBe('Launch')
  })
})

describe('blueprint capabilities', () => {
  it('hides professional-training capabilities from yoga', () => {
    const yoga = resolveOperatingProfile({
      tenant: { planTier: 'pro', deploymentMode: 'managed_cloud', academyBlueprint: 'yoga_pilates_wellness' },
    })
    expect(hasCapability(yoga, 'session_level_scheduling')).toBe(false)
    expect(hasCapability(yoga, 'course_cycles')).toBe(false)
    expect(hasCapability(yoga, 'external_practices')).toBe(false)
    expect(hasCapability(yoga, 'memberships')).toBe(true)
    expect(hasCapability(yoga, 'recurring_sessions')).toBe(true)
  })

  it('keeps session scheduling on CEP enterprise on-premise', () => {
    const cep = resolveOperatingProfile({
      tenant: {
        planTier: 'enterprise',
        deploymentMode: 'on_premise',
        academyBlueprint: 'cep-professional-training-enterprise-v1',
      },
    })
    expect(hasCapability(cep, 'session_level_scheduling')).toBe(true)
    expect(hasCapability(cep, 'external_practices')).toBe(true)
    expect(cep.lockedCapabilities).toContain('session_level_scheduling')
  })

  it('filters MCP tools server-side by capability', () => {
    const yoga = resolveOperatingProfile({
      tenant: { planTier: 'pro', academyBlueprint: 'yoga_pilates_wellness' },
    })
    const tools = Object.entries(MCP_TOOL_CAPABILITIES).filter(([, capability]) =>
      hasCapability(yoga, capability),
    )
    expect(tools.map(([name]) => name)).not.toContain('list_cycles')
  })

  it('filters navigation items without CSS-only hiding', () => {
    const yoga = resolveOperatingProfile({
      tenant: { planTier: 'pro', academyBlueprint: 'yoga_pilates_wellness' },
    })
    const items = filterByCapability(
      [
        { href: '/cursos', capability: 'courses' as const },
        { href: '/ciclos', capability: 'course_cycles' as const },
        { href: '/dashboard' },
      ],
      yoga,
    )
    expect(items.map((item) => item.href)).toEqual(['/cursos', '/dashboard'])
  })

  it('prefers tenant fields over env', () => {
    const profile = resolveOperatingProfile({
      tenant: { planTier: 'pro', deploymentMode: 'managed_cloud', academyBlueprint: 'language_academy' },
      env: { planTier: 'enterprise', deploymentMode: 'on_premise', blueprintId: 'cep-professional-training-enterprise-v1' },
    })
    expect(profile.planTier).toBe('pro')
    expect(profile.planLabel).toBe('Business')
    expect(profile.academyBlueprint).toBe('language_academy')
    expect(hasCapability(profile, 'academic_levels')).toBe(true)
    expect(hasCapability(profile, 'session_level_scheduling')).toBe(false)
  })
})

describe('capability routes and badges', () => {
  it('maps occupancy and ciclos without gating generic course-runs', () => {
    expect(capabilityForPath('/api/occupancy')).toBe('session_level_scheduling')
    expect(capabilityForPath('/api/occupancy?date=2026-09-01')).toBe('session_level_scheduling')
    expect(capabilityForPath('/api/course-runs/12/sessions')).toBe('session_level_scheduling')
    expect(capabilityForPath('/api/course-runs')).toBeNull()
    expect(capabilityForPath('/dashboard/programas-formativos')).toBe('course_cycles')
    expect(planBadgeLabel('enterprise')).toBe('ENTERPRISE')
    expect(deploymentBadgeLabel('on_premise')).toBe('ON-PREMISE')
    expect(deploymentBadgeLabel('dedicated_cloud')).toBe('DEDICATED CLOUD')
  })

  it('filters MCP tools by capability', () => {
    const yoga = resolveOperatingProfile({
      tenant: { planTier: 'pro', academyBlueprint: 'yoga_pilates_wellness' },
    })
    const advertised = [{ name: 'list_courses' }, { name: 'list_cycles' }, { name: 'list_placement_agencies' }]
    expect(listToolsByCapability(advertised, yoga).map((tool) => tool.name)).toEqual(['list_courses'])
    expect(MCP_TOOL_CAPABILITIES.list_cycles).toBe('course_cycles')
  })
})
