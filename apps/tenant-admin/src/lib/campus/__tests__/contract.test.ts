import { describe, expect, it, afterEach } from 'vitest'
import { campusEnvironmentError, campusJwtSecret } from '../environment'
import { hashCampusAuthToken, normalizedCampusEmail } from '../auth'

describe('Campus isolation and auth contract', () => {
  const original = { ...process.env }

  afterEach(() => {
    process.env = { ...original }
  })

  it('removes invisible characters and normalizes email', () => {
    expect(normalizedCampusEmail('  ALUMNO\u00a0@Ejemplo.COM\u200b ')).toBe('alumno@ejemplo.com')
  })

  it('does not allow a weak or missing campus secret to pass the environment gate', () => {
    process.env.CAMPUS_INTERNAL_ENABLED = 'true'
    process.env.CAMPUS_ENVIRONMENT = 'staging'
    expect(campusEnvironmentError()).toBeNull()
    expect(campusJwtSecret()).toBeNull()
  })

  it('fails closed in production even when the feature flag is enabled', () => {
    process.env.CAMPUS_INTERNAL_ENABLED = 'true'
    process.env.CAMPUS_ENVIRONMENT = 'production'
    expect(campusEnvironmentError()?.status).toBe(404)
  })

  it('fails closed when the explicit campus environment label is missing', () => {
    process.env.CAMPUS_INTERNAL_ENABLED = 'true'
    delete process.env.CAMPUS_ENVIRONMENT
    process.env.NODE_ENV = 'production'
    expect(campusEnvironmentError()?.status).toBe(404)
  })

  it('hashes the same token deterministically without storing the raw credential', () => {
    const first = hashCampusAuthToken('staging-token')
    expect(first).toHaveLength(64)
    expect(first).toBe(hashCampusAuthToken('staging-token'))
    expect(first).not.toContain('staging-token')
  })
})
