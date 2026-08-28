import { describe, expect, it } from 'vitest'
import { hasCapability, missingCapabilities } from '../src/capabilities'

describe('tenant capabilities', () => {
  it('checks product capabilities, not feature flags', () => {
    const enabled = ['academic.courses', 'finance.funding']
    expect(hasCapability(enabled, 'academic.courses')).toBe(true)
    expect(hasCapability(enabled, 'agents.mcp')).toBe(false)
    expect(missingCapabilities(enabled, ['academic.courses', 'academic.phases'])).toEqual([
      'academic.phases',
    ])
  })
})
