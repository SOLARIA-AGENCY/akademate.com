import { existsSync } from 'fs'
import path from 'path'

import { describe, expect, test } from 'vitest'

import {
  CEP_COURSE_PROGRAM_ENTRIES,
  cleanPublicCourseLines,
  cleanPublicCourseText,
} from './cep-course-programs-data'

const generatedImages = path.resolve(process.cwd(), 'public/website/cep/courses/generated')

describe('CEP course program source contract', () => {
  test('keeps the three newly ingested programs distinct', () => {
    const bySlug = new Map(CEP_COURSE_PROGRAM_ENTRIES.map((entry) => [entry.courseSlug, entry]))

    expect(bySlug.get('seminario-gestorvet-priv')).toMatchObject({
      courseName: 'Seminario Práctico de Gestión Gestorvet',
      pdfFilename: 'SEMINARIO GESTORVET.pdf',
      areaCode: 'VETA',
      durationHours: 9,
    })
    expect(bySlug.get('nutricosmetica-priv')).toMatchObject({
      courseName: 'Nutricosmética y Complementos Alimenticios',
      pdfFilename: 'NUTRICOSMÉTICA (2).pdf',
      durationHours: 48,
    })
    expect(bySlug.get('quiromasaje-11-meses-priv')).toMatchObject({
      courseName: 'Quiromasaje Holístico',
      pdfFilename: 'QUIROMASAJE HOLISTO (1).pdf',
      durationHours: 176,
    })
    expect(bySlug.has('quiromasaje-priv')).toBe(false)
  })

  test('removes extraction wording from public course copy', () => {
    expect(cleanPublicCourseText('Duración detectada: 176 h.')).toBe('Duración: 176 h.')
    expect(cleanPublicCourseText('Salidas profesionales detectadas: clínicas y spas.')).toBe(
      'Salidas profesionales: clínicas y spas.',
    )
    expect(cleanPublicCourseLines(['Contenido detectado: masaje', ''])).toEqual(['Contenido: masaje'])
  })

  test('ships generated cover assets for the new visual catalog', () => {
    expect(existsSync(path.join(generatedImages, 'seminario-gestorvet.png'))).toBe(true)
    expect(existsSync(path.join(generatedImages, 'nutricosmetica.png'))).toBe(true)
    expect(existsSync(path.join(generatedImages, 'quiromasaje-holistico.png'))).toBe(true)
  })
})
