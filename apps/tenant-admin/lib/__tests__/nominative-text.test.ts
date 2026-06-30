import { describe, expect, it } from 'vitest'
import { normalizeNominativeText } from '../nominative-text'

describe('normalizeNominativeText', () => {
  it('normalizes person names with Spanish particles', () => {
    expect(normalizeNominativeText('NURIA ESTHER ÁNGEL RAMOS')).toBe('Nuria Esther Ángel Ramos')
    expect(normalizeNominativeText('MARÍA DE LOS ÁNGELES RODRÍGUEZ PÉREZ')).toBe(
      'María de los Ángeles Rodríguez Pérez'
    )
  })

  it('normalizes course titles while preserving acronyms and roman numerals', () => {
    expect(normalizeNominativeText('CFGS HIGIENE BUCODENTAL')).toBe('CFGS Higiene Bucodental')
    expect(normalizeNominativeText('ADIESTRAMIENTO CANINO II')).toBe('Adiestramiento Canino II')
    expect(normalizeNominativeText('AYUDANTE TÉCNICO VETERINARIO (ATV)')).toBe(
      'Ayudante Técnico Veterinario (ATV)'
    )
  })

  it('collapses spacing and returns undefined for empty values', () => {
    expect(normalizeNominativeText('  ÁREA   SANITARIA Y CLÍNICA  ')).toBe(
      'Área Sanitaria y Clínica'
    )
    expect(normalizeNominativeText('   ')).toBeUndefined()
    expect(normalizeNominativeText(null)).toBeUndefined()
  })
})
