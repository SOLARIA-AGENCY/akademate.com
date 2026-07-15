import { describe, expect, it } from 'vitest'
import { isCampusEnrollmentModuleEnabled } from '../campus-enrollment-module'

describe('isCampusEnrollmentModuleEnabled', () => {
  it('keeps the unfinished campus enrollment collection out of production', () => {
    expect(isCampusEnrollmentModuleEnabled({
      nodeEnv: 'production',
      campusEnvironment: 'staging',
    })).toBe(false)
  })

  it('only enables the collection in an explicitly marked non-production campus environment', () => {
    expect(isCampusEnrollmentModuleEnabled({
      nodeEnv: 'development',
      campusEnvironment: 'staging',
    })).toBe(true)
    expect(isCampusEnrollmentModuleEnabled({
      nodeEnv: 'development',
      campusEnvironment: undefined,
    })).toBe(false)
  })
})
