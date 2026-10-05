import { describe, expect, it } from 'vitest'
import { isFundedFreeSection, resolveCourseArea } from './home-course-areas'

describe('isFundedFreeSection', () => {
  it('marks ocupados and desempleados as 100% gratuito', () => {
    expect(isFundedFreeSection('ocupados')).toBe(true)
    expect(isFundedFreeSection('desempleados')).toBe(true)
    expect(isFundedFreeSection('privados')).toBe(false)
  })
})

describe('resolveCourseArea', () => {
  it('uses the defined CEP areas and their public colors', () => {
    expect(resolveCourseArea({ area: 'Área Sanitaria y Clínica', areaColor: '#E3003A' })).toMatchObject({
      code: 'SCLN',
      label: 'Sanitaria',
      color: '#E3003A',
    })
    expect(resolveCourseArea({ area: 'Área Veterinaria y Bienestar Animal' })).toMatchObject({
      code: 'VETA',
      label: 'Veterinaria',
      color: '#16A34A',
    })
    expect(resolveCourseArea({ area: 'Área Salud, Bienestar y Deporte', areaColor: '#2563EB' })).toMatchObject({
      code: 'SBD',
      label: 'Salud y deporte',
      color: '#7C3AED',
    })
    expect(resolveCourseArea({ area: 'Área Tecnología, Digital y Diseño' })).toMatchObject({
      code: 'TDD',
      label: 'Tecnología',
      color: '#0EA5E9',
    })
    expect(resolveCourseArea({ area: 'Área Empresa, Administración y Gestión' })).toMatchObject({
      code: 'EAG',
      label: 'Empresa',
      color: '#F59E0B',
    })
    expect(resolveCourseArea({ area: 'Área Seguridad, Vigilancia y Protección' })).toMatchObject({
      code: 'SVP',
      label: 'Seguridad',
      color: '#475569',
    })
  })

  it('infers a defined area from the course title when the catalog omits it', () => {
    expect(resolveCourseArea({ nombre: 'Adiestramiento Canino I' })?.label).toBe('Veterinaria')
    expect(resolveCourseArea({ nombre: 'Auxiliar de farmacia' })?.label).toBe('Sanitaria')
    expect(resolveCourseArea({ nombre: 'Dietética' })?.label).toBe('Salud y deporte')
    expect(resolveCourseArea({ nombre: 'Gestión de redes' })?.label).toBe('Empresa')
  })

  it('shortens idiomas area names to a compact badge', () => {
    expect(resolveCourseArea({ area: 'Idiomas y competencias lingüísticas' })?.label).toBe('Idiomas')
    expect(resolveCourseArea({ area: 'Área Idiomas y competencias lingüísticas' })?.label).toBe('Idiomas')
  })

  it('omits the badge when there is no defined area', () => {
    expect(resolveCourseArea({ nombre: 'ZUMBA CLÍNICA' })).toBeNull()
    expect(resolveCourseArea({ nombre: 'Curso genérico', area: 'Sin área' })).toBeNull()
    expect(resolveCourseArea({ nombre: 'Curso genérico' })).toBeNull()
  })
})
