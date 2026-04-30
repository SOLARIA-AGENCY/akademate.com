import { describe, expect, test } from 'vitest'

import {
  CEP_PRIVATE_COURSE_IMAGE_PROMPTS,
  CEP_TELEFORMACION_COURSE_IMAGE_PROMPTS,
} from './cep-course-image-prompts'
import {
  getCatalogForCourseType,
  getDefaultOutputDir,
  parseManagedCourseType,
} from './course-image-catalog'

describe('cep-course-image-prompts', () => {
  test('private healthcare presencial prompts keep white clinical dominance with subtle red accents', () => {
    const nursing = CEP_PRIVATE_COURSE_IMAGE_PROMPTS.find((course) => course.slug === 'auxiliar-de-enfermeria-priv')
    expect(nursing?.prompt).toContain('base visual clinica blanca y neutra')
    expect(nursing?.prompt).toContain('rojo editorial elegante solo como acento sutil')
    expect(nursing?.prompt).not.toContain('acento visual principal rojo')
  })

  test('private healthcare teleformacion prompts add orange secondary overlay', () => {
    const dentalOnline = CEP_PRIVATE_COURSE_IMAGE_PROMPTS.find(
      (course) => course.slug === 'auxiliar-de-odontologia-e-higiene-online-priv',
    )
    expect(dentalOnline?.prompt).toContain('base visual clinica blanca y neutra')
    expect(dentalOnline?.prompt).toContain('naranja calido y tecnologico propio de teleformacion')
  })

  test('ocupados catalog is available for future green-accent prompts', () => {
    expect(getCatalogForCourseType('ocupados')).toEqual([])
  })

  test('desempleados catalog is available for future blue-accent prompts', () => {
    expect(getCatalogForCourseType('desempleados')).toEqual([])
  })

  test('teleformacion catalog is available for future orange-accent prompts', () => {
    expect(CEP_TELEFORMACION_COURSE_IMAGE_PROMPTS).toEqual([])
  })
})

describe('course-image-catalog helpers', () => {
  test('normalizes managed course types from cli values', () => {
    expect(parseManagedCourseType('privado')).toBe('privado')
    expect(parseManagedCourseType('ocupados')).toBe('ocupados')
    expect(parseManagedCourseType('desempleados')).toBe('desempleados')
    expect(parseManagedCourseType('teleformación')).toBe('teleformacion')
    expect(parseManagedCourseType('tel')).toBe('teleformacion')
  })

  test('resolves default output directories by course type', () => {
    expect(getDefaultOutputDir('privado')).toBe('output/private-course-images')
    expect(getDefaultOutputDir('ocupados')).toBe('output/ocupados-course-images')
    expect(getDefaultOutputDir('desempleados')).toBe('output/desempleados-course-images')
    expect(getDefaultOutputDir('teleformacion')).toBe('output/teleformacion-course-images')
  })
})
