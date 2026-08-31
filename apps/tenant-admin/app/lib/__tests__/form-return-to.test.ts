import { describe, expect, it } from 'vitest'
import { convocatoriaNuevaHref, safeFormReturnTo } from '@/app/lib/form-return-to'

describe('safeFormReturnTo', () => {
  it('keeps an internal dashboard origin', () => {
    expect(safeFormReturnTo('/web/convocatorias', '/programacion')).toBe('/web/convocatorias')
    expect(safeFormReturnTo('/cursos/convocatorias', '/programacion')).toBe(
      '/cursos/convocatorias'
    )
    expect(safeFormReturnTo('/programacion', '/programacion')).toBe('/programacion')
  })

  it('rejects open redirects and public/auth/api paths', () => {
    expect(safeFormReturnTo('https://evil.test', '/programacion')).toBe('/programacion')
    expect(safeFormReturnTo('//evil.test', '/programacion')).toBe('/programacion')
    expect(safeFormReturnTo('/api/staff', '/programacion')).toBe('/programacion')
    expect(safeFormReturnTo('/auth/login', '/programacion')).toBe('/programacion')
    expect(safeFormReturnTo('/p/cursos', '/programacion')).toBe('/programacion')
    expect(safeFormReturnTo(null, '/programacion')).toBe('/programacion')
  })
})

describe('convocatoriaNuevaHref', () => {
  it('always stamps returnTo', () => {
    expect(convocatoriaNuevaHref('/web/convocatorias')).toBe(
      '/programacion/nueva?returnTo=%2Fweb%2Fconvocatorias'
    )
    expect(convocatoriaNuevaHref('/cursos/12', { curso: '12' })).toContain('curso=12')
    expect(convocatoriaNuevaHref('/cursos/12', { curso: '12' })).toContain(
      'returnTo=%2Fcursos%2F12'
    )
  })
})
