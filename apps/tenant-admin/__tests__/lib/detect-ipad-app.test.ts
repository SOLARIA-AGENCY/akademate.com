import { describe, expect, it } from 'vitest'
import { isIpadAppRuntime } from '@/lib/detect-ipad-app'

describe('isIpadAppRuntime', () => {
  it('does not treat a desktop viewport as an iPad app', () => {
    expect(isIpadAppRuntime({ matchMedia: () => ({ matches: false }) })).toBe(false)
  })
})
