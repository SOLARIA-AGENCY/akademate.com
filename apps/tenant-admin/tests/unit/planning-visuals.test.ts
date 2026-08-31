import { describe, expect, it } from 'vitest'
import {
  COURSE_MODALITY_CONFIG,
  COURSE_TYPE_CONFIG,
  DIRECTORY_CAMPUS_PILL_CLASS,
} from '../../@payload-config/lib/courseTypeConfig'

describe('planning visuals', () => {
  it('funding pills stay solid with locked hover', () => {
    expect(COURSE_TYPE_CONFIG.privados.pillClass).toMatch(/hover:bg-red-600/)
    expect(COURSE_TYPE_CONFIG.ocupados.pillClass).toMatch(/hover:bg-emerald-600/)
    expect(COURSE_TYPE_CONFIG.desempleados.pillClass).toMatch(/hover:bg-blue-600/)
  })

  it('modality pastels match the closed contract', () => {
    expect(COURSE_MODALITY_CONFIG.presencial.pillClass).toContain('bg-emerald-50')
    expect(COURSE_MODALITY_CONFIG.teleformacion.pillClass).toContain('bg-yellow-300')
    expect(COURSE_MODALITY_CONFIG.mixto.pillClass).toContain('bg-teal-50')
  })

  it('campus chrome is a single corporate red', () => {
    expect(DIRECTORY_CAMPUS_PILL_CLASS).toBe(
      'border-red-600 bg-red-600 text-white hover:bg-red-600 hover:text-white',
    )
  })
})
