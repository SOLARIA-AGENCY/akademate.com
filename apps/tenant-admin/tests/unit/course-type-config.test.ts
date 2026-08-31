import { describe, expect, it } from 'vitest'
import {
  COURSE_MODALITY_CONFIG,
  COURSE_TYPE_CONFIG,
  DIRECTORY_CAMPUS_PILL_CLASS,
  getDirectoryAreaTone,
  parseDirectoryHexColor,
  resolveCourseFundingType,
  resolveCourseModality,
} from '../../@payload-config/lib/courseTypeConfig'

describe('course type config', () => {
  it('maps privados to solid red with hover lock', () => {
    expect(COURSE_TYPE_CONFIG.privados.bgColor).toBe('bg-red-600')
    expect(COURSE_TYPE_CONFIG.privados.pillClass).toContain('text-white')
    expect(COURSE_TYPE_CONFIG.privados.pillClass).toContain('hover:bg-red-600')
    expect(COURSE_TYPE_CONFIG.privados.pillClass).not.toContain('bg-slate-100')
  })

  it('maps ocupados and desempleados to solid greens and blues', () => {
    expect(COURSE_TYPE_CONFIG.ocupados.pillClass).toContain('bg-emerald-600')
    expect(COURSE_TYPE_CONFIG.desempleados.pillClass).toContain('bg-blue-600')
  })

  it('treats teleformacion as modality, not funding', () => {
    expect(resolveCourseFundingType('teleformacion')).toBe('privados')
    expect(resolveCourseModality('teleformacion')).toBe('teleformacion')
    expect(COURSE_MODALITY_CONFIG.teleformacion.pillClass).toContain('bg-yellow-50')
    expect(COURSE_MODALITY_CONFIG.teleformacion.pillClass).toContain('text-amber-700')
    expect(COURSE_MODALITY_CONFIG.teleformacion.pillClass).not.toContain('bg-yellow-300')
  })

  it('keeps mixto off slate', () => {
    expect(COURSE_MODALITY_CONFIG.mixto.pillClass).toContain('bg-teal-50')
    expect(COURSE_MODALITY_CONFIG.mixto.pillClass).not.toContain('slate')
  })

  it('hashes the same area name to the same pastel', () => {
    const a = getDirectoryAreaTone('Nutricosmétika')
    const b = getDirectoryAreaTone('nutricosmetika')
    expect(a.pillClass).toBe(b.pillClass)
    expect(a.pillClass).toMatch(/bg-(rose|orange|amber|lime|emerald|teal|sky|indigo|violet|fuchsia)-100/)
  })

  it('accepts valid hex colors for areas', () => {
    expect(parseDirectoryHexColor('#E3003A')).toBe('#E3003A')
    expect(parseDirectoryHexColor('red')).toBeNull()
  })

  it('uses a single corporate red for campuses', () => {
    expect(DIRECTORY_CAMPUS_PILL_CLASS).toContain('bg-red-600')
    expect(DIRECTORY_CAMPUS_PILL_CLASS).toContain('text-white')
  })
})
