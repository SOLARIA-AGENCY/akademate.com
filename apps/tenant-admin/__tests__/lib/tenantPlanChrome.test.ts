import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TENANT_PLAN,
  chromePlanLabels,
  settingsPlanLabels,
} from '@/lib/tenantPlanChrome'

describe('tenant plan chrome', () => {
  it('hides ENTERPRISE and ON-PREMISE for a default tenant', () => {
    expect(settingsPlanLabels(DEFAULT_TENANT_PLAN)).toEqual([])
    expect(chromePlanLabels(DEFAULT_TENANT_PLAN)).toEqual([])
  })

  it('shows labels in Configuración only when that tenant has the values', () => {
    expect(
      settingsPlanLabels({ plan: 'enterprise', deploymentMode: 'on_premise' }),
    ).toEqual(['ENTERPRISE', 'ON-PREMISE'])
    expect(settingsPlanLabels({ plan: 'enterprise', deploymentMode: 'managed_cloud' })).toEqual([
      'ENTERPRISE',
    ])
    expect(settingsPlanLabels({ plan: 'pro', deploymentMode: 'on_premise' })).toEqual(['ON-PREMISE'])
  })

  it('never returns those labels for sidebar or footer chrome', () => {
    expect(
      chromePlanLabels({ plan: 'enterprise', deploymentMode: 'on_premise' }),
    ).toEqual([])
  })
})
