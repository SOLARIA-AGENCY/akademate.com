import { describe, expect, it } from 'vitest'
import { normalizeStudyType } from '../study-types'

describe('normalizeStudyType', () => {
  it('normalizes main CEP study types', () => {
    expect(normalizeStudyType('privado')).toBe('privados')
    expect(normalizeStudyType('PRIVADOS')).toBe('privados')
    expect(normalizeStudyType('ocupados')).toBe('ocupados')
    expect(normalizeStudyType('desempleados')).toBe('desempleados')
    expect(normalizeStudyType('teleformación')).toBe('teleformacion')
    expect(normalizeStudyType('TEL')).toBe('teleformacion')
  })

  it('normalizes cycle levels', () => {
    expect(normalizeStudyType('grado_medio')).toBe('ciclo_medio')
    expect(normalizeStudyType('cfgm')).toBe('ciclo_medio')
    expect(normalizeStudyType('grado_superior')).toBe('ciclo_superior')
    expect(normalizeStudyType('CFGS')).toBe('ciclo_superior')
  })

  it('returns null for unknown values', () => {
    expect(normalizeStudyType('')).toBeNull()
    expect(normalizeStudyType('random')).toBeNull()
    expect(normalizeStudyType(null)).toBeNull()
  })
})
