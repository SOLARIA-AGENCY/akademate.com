import { describe, expect, it } from 'vitest'
import { safeInternalRedirect } from '../safe-internal-redirect'

describe('safeInternalRedirect', () => {
  it('keeps internal dashboard paths', () => {
    expect(safeInternalRedirect('/dashboard/cursos/convocatorias')).toBe(
      '/dashboard/cursos/convocatorias',
    )
  })

  it('rejects open redirects and auth loops', () => {
    expect(safeInternalRedirect('https://evil.example/phish')).toBe('/dashboard')
    expect(safeInternalRedirect('//evil.example')).toBe('/dashboard')
    expect(safeInternalRedirect('/auth/login')).toBe('/dashboard')
    expect(safeInternalRedirect(null)).toBe('/dashboard')
  })
})
