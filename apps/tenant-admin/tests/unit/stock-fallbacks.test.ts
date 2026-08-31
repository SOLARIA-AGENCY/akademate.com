import { describe, expect, it } from 'vitest'
import { STOCK_FALLBACK_IMAGES, stockFallbackSrc } from '../../app/lib/stock-fallbacks'

describe('stock fallback photographs', () => {
  it('maps each listing kind to a /stock jpg', () => {
    expect(stockFallbackSrc('book')).toBe('/stock/cursos.jpg')
    expect(stockFallbackSrc('page')).toBe('/stock/convocatoria.jpg')
    expect(stockFallbackSrc('cycle')).toBe('/stock/ciclos.jpg')
    expect(stockFallbackSrc('campus')).toBe('/stock/sedes.jpg')
    expect(stockFallbackSrc('student')).toBe('/stock/alumno.jpg')
    expect(stockFallbackSrc('person')).toBe('/stock/profesor.jpg')
    expect(stockFallbackSrc('admin')).toBe('/stock/administrativa.jpg')
    expect(Object.values(STOCK_FALLBACK_IMAGES).every((src) => src.startsWith('/stock/'))).toBe(true)
  })
})
