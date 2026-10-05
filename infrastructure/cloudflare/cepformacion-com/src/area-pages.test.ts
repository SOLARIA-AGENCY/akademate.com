import { describe, expect, it } from 'vitest'
import { areaPageBody, areaSlugFromPath, rewriteAreaPage } from './area-pages'
import type { CatalogSnapshot } from './render'

const snapshot = {
  data: {
    courses: [
      {
        slug: 'fiscalidad-des',
        nombre: 'Fiscalidad en las pymes',
        studyType: 'desempleados',
        area: 'Área Empresa, Administración y Gestión',
        imageUrl: '/api/media/file/fiscalidad.webp',
      },
      { slug: 'nominas-ocu', nombre: 'Nóminas', studyType: 'ocupados', area: 'Área Empresa, Administración y Gestión', imageUrl: '/api/media/file/nominas.webp' },
      { slug: 'ingles-priv', nombre: 'Inglés A1', studyType: 'privados', area: 'Área Empresa, Administración y Gestión', imageUrl: '/api/media/file/ingles.webp' },
      { slug: 'aleman-tel', nombre: 'Alemán básico', studyType: 'teleformacion', area: 'Área Empresa, Administración y Gestión', imageUrl: '/api/media/file/aleman.webp' },
      { slug: 'farmacia-priv', nombre: 'Auxiliar de farmacia', studyType: 'privados', area: 'Área Sanitaria y Clínica', imageUrl: '/api/media/file/farmacia.webp' },
    ],
    cycles: [
      { slug: 'cfgm-farmacia', name: 'Farmacia y Parafarmacia', imageUrl: '/api/media/file/cfgm-farmacia.webp' },
      { slug: 'qa-ciclo', name: 'QA ciclo' },
    ],
    convocatorias: [
      {
        codigo: 'SC-2026-099',
        status: 'enrollment_open',
        startDate: '2026-10-20',
        course: { slug: 'fiscalidad-des', nombre: 'Fiscalidad en las pymes' },
        campus: { name: 'CEP Santa Cruz' },
      },
    ],
  },
} as CatalogSnapshot

describe('area pages', () => {
  it('reads the public area slug', () => {
    expect(areaSlugFromPath('/areas/area-empresa-administracion-y-gestion')).toBe('area-empresa-administracion-y-gestion')
    expect(areaSlugFromPath('/p/areas/area-empresa-administracion-y-gestion/')).toBe('area-empresa-administracion-y-gestion')
    expect(areaSlugFromPath('/cursos')).toBeNull()
  })

  it('lists only that area, split by cycles and course type', () => {
    const html = areaPageBody(snapshot, 'area-empresa-administracion-y-gestion')
    expect(html).toContain('Área Empresa, Administración y Gestión')
    expect(html).toContain('Privados')
    expect(html).toContain('Trabajadores ocupados')
    expect(html).toContain('Trabajadores desempleados/as')
    expect(html).toContain('Teleformación')
    expect(html).toContain('Inglés a1')
    expect(html).toContain('Nóminas')
    expect(html).toContain('Fiscalidad en las pymes')
    expect(html).toContain('Alemán básico')
    expect(html).toContain('data-cep-area-grid')
    expect(html).not.toContain('data-cep-course-list')
    expect(html).toContain('min-height:560px')
    expect(html).toContain('group h-full')
    expect(html).toContain('min-h-[560px]')
    expect(html).toContain('/media/area-empresa-administracion-gestion.webp')
    expect(html).toContain('data-cep-chip="area"')
    expect(html).not.toContain('cep-course-row')
    expect(html).toContain('/api/media/file/ingles.webp')
    expect(html).toContain('Ver convocatoria')
    expect(html).toContain('/convocatorias/SC-2026-099')
    expect(html).not.toContain('Auxiliar de farmacia')
    expect(html).not.toContain('cursos-privados-v2.jpg')
    expect(html).not.toContain('Ciclos formativos')
  })

  it('puts matching cycles in their own section', () => {
    const html = areaPageBody(snapshot, 'area-sanitaria-y-clinica')
    expect(html).toContain('Ciclos formativos')
    expect(html).toContain('Farmacia y Parafarmacia')
    expect(html).toContain('/api/media/file/cfgm-farmacia.webp')
    expect(html).toContain('Ver ciclo')
    expect(html).toContain('Auxiliar de farmacia')
    expect(html).not.toContain('QA ciclo')
    expect(html).not.toContain('Nóminas')
  })

  it('replaces the shell and drops the origin flight', () => {
    const shell = `<html><head><title>Viejo</title></head><body><header></header><main><p>Origen</p></main><script>self.__next_f.push(1)</script><footer></footer></body></html>`
    const html = rewriteAreaPage(shell, snapshot, '/areas/area-empresa-administracion-y-gestion')
    expect(html).toContain('data-cep-area-rendered="area-empresa-administracion-y-gestion"')
    expect(html).not.toContain('Origen')
    expect(html).not.toContain('__next_f')
    expect(html).toContain('<footer></footer>')
  })
})
