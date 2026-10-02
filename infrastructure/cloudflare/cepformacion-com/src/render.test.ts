import { describe, expect, it } from 'vitest'
import {
  asPositiveInt,
  displayNameFor,
  hostColor,
  isForbiddenBlue,
  renderSitePage,
  type CatalogSnapshot,
} from './render'

const snapshot: CatalogSnapshot = {
  meta: {
    tenant: 'cep-formacion',
    host: 'cepformacion.akademate.com',
    generatedAt: '2026-09-03T00:00:00.000Z',
    version: 'test',
    cacheTtlSeconds: 60,
  },
  data: {
    branding: {
      academyName: 'CEP Formación',
      primaryColor: '#f2014b',
      contact: { phone: ['922 21 92 57'] },
    },
    navigation: {
      items: [
        { kind: 'link', label: 'Cursos', href: '/cursos' },
        { kind: 'link', label: 'Convocatorias', href: '/convocatorias' },
      ],
      cta: { label: 'Contacto', href: '/contacto' },
    },
    seo: {
      defaultTitle: 'CEP Formación',
      defaultDescription: 'Formación profesional en Tenerife.',
      canonicalOrigin: 'https://cepformacion.com',
    },
    courses: [
      {
        id: '10',
        slug: 'auxiliar-farmacia',
        nombre: 'Auxiliar de Farmacia',
        studyType: 'privados',
        studyTypeLabel: 'Privados',
        studyTypeColor: '#2563eb',
        enrollmentStatus: 'open',
        landingFaqs: [],
      },
      {
        id: '11',
        slug: 'alemán-a1',
        nombre: 'Alemán A1',
        studyType: 'desempleados',
        studyTypeLabel: 'Desempleados',
        studyTypeColor: '#2563EB',
        enrollmentStatus: 'published',
        landingFaqs: [{ question: '¿Hay plaza?', answer: 'Sí, consulta en secretaría.' }],
      },
    ],
    cycles: [{ slug: 'cfgm-farmacia', name: 'Farmacia y Parafarmacia', level: 'grado_medio' }],
    convocatorias: [
      {
        id: '125',
        codigo: 'CONV-125',
        classroomHours: 120,
        companyHours: null,
        classFrequency: 1,
        schedule: { days: ['friday'], start: '09:00', end: '14:00' },
        price: { label: 'Consultar' },
        course: { id: '10', slug: 'auxiliar-farmacia', nombre: 'Auxiliar de Farmacia', landingFaqs: [] },
        campus: { slug: 'santa-cruz', name: 'Santa Cruz', city: 'Tenerife' },
        cycle: null,
        imageUrl: '/api/media/file/farmacia.jpg',
      },
      {
        id: '200',
        codigo: 'CONV-200',
        classroomHours: 160,
        companyHours: 80,
        schedule: { days: ['monday', 'wednesday'], start: '16:00', end: '20:00' },
        price: { label: 'Consultar' },
        course: {
          id: '12',
          slug: 'higiene',
          nombre: 'Higiene Bucodental',
          landingFaqs: [{ question: '¿Requisitos?', answer: 'ESO o prueba de acceso.' }],
        },
        cycle: { slug: 'cfgs-higiene', name: 'Higiene Bucodental', level: 'grado_superior' },
        campus: { slug: 'la-laguna', name: 'La Laguna', city: 'Tenerife' },
      },
    ],
    campuses: [{ slug: 'santa-cruz', name: 'Santa Cruz', city: 'Tenerife', phone: '922 21 92 57' }],
    teachers: [{ slug: 'ana', name: 'Ana' }],
    website: { pages: [] },
    sitemap: [{ path: '/', changefreq: 'daily', lastmod: null }],
  },
}

describe('CEP worker render', () => {
  it('keeps host tokens and rejects Akademate blue', () => {
    const html = renderSitePage(snapshot, '/', '/preview').html
    expect(html).toContain('#f2014b')
    expect(html).toContain('#3E091A')
    expect(html).toContain('Manrope')
    expect(html).toContain('cep-formacion-logo-rectangular.png')
    expect(html).toContain('brand-disk')
    expect(html).not.toContain('#2563eb')
    expect(html).not.toContain('#2563EB')
    expect(html).not.toContain('#0066CC')
    expect(html).not.toContain('#3b82f6')
    expect(html).not.toContain('#1a1a2e')
    expect(html).not.toContain('__NEXT_DATA__')
    expect(html).not.toContain('whatsapp')
    expect(html).not.toContain('te confirmamos horario')
    expect(html).not.toContain('incluido mock')
    expect(isForbiddenBlue('#2563eb')).toBe(true)
    expect(hostColor('#2563EB', '#3E091A')).toBe('#3E091A')
  })

  it('paints edition fields from JSON and omits empty marketing fallbacks', () => {
    const home = renderSitePage(snapshot, '/', '/preview').html
    expect(home).toContain('120 h')
    expect(home).toContain('Consultar')
    expect(home).toContain('Viernes')
    expect(home).toContain('Auxiliar de Farmacia')
    expect(home).toContain('Prácticas 80 h')
    expect(home).not.toContain('Formación profesional para moverte rápido')
    expect(home).not.toContain('Próximamente disponibles')

    const privateRun = renderSitePage(snapshot, '/convocatorias/CONV-125', '/preview').html
    expect(privateRun).toContain('120 h')
    expect(privateRun).not.toContain('Prácticas')
    expect(privateRun).not.toContain('Preguntas frecuentes')
    expect(privateRun).toContain('Consultar')
    expect(privateRun).toContain('Viernes')
    expect(privateRun).toContain('Auxiliar de Farmacia')
    expect(asPositiveInt(0)).toBeNull()

    const cycleRun = renderSitePage(snapshot, '/convocatorias/CONV-200', '/preview').html
    expect(cycleRun).toContain('Higiene Bucodental')
    expect(cycleRun).toContain('160 h')
    expect(cycleRun).toContain('>Prácticas</b><span>80 h</span>')
    expect(cycleRun).toContain('¿Requisitos?')
    expect(cycleRun).not.toContain('240')
    expect(displayNameFor(snapshot.data.convocatorias[1])).toBe('Higiene Bucodental')
    expect(displayNameFor(snapshot.data.convocatorias[0])).toBe('Auxiliar de Farmacia')
  })

  it('paints CMS sections from the live catalog container and respects limits', () => {
    const composed: CatalogSnapshot = {
      ...snapshot,
      data: {
        ...snapshot.data,
        website: {
          pages: [
            {
              path: '/',
              pageKind: 'home',
              sections: [
                {
                  kind: 'heroCarousel',
                  title: 'Impulsa tu futuro profesional',
                  subtitle: 'Programas con prácticas reales',
                  slides: [{ image: '/website/cep/hero/cepformacion-hero-01.png', alt: 'Aula CEP', title: 'Impulsa tu futuro profesional' }],
                },
                { kind: 'statsStrip', items: [{ value: '+25', label: 'Años' }] },
                { kind: 'cycleList', title: 'Ciclos formativos oficiales', limit: 1 },
                { kind: 'convocationList', title: 'Convocatorias abiertas', limit: 1, enabled: true },
                { kind: 'courseList', title: 'Cursos destacados', limit: 1 },
                { kind: 'leadForm', title: 'Hablemos de tu próxima formación', source: 'website-home', enabled: false },
              ],
            },
            {
              path: '/quienes-somos',
              pageKind: 'standard',
              title: 'Quiénes somos',
              sections: [{ kind: 'ctaBanner', title: 'Centro de estudios en Tenerife', body: 'Formación profesional.', theme: 'dark' }],
            },
          ],
        },
      },
    }
    const home = renderSitePage(composed, '/', '/preview').html
    expect(home).toContain('Impulsa tu futuro profesional')
    expect(home).toContain('+25')
    expect(home).toContain('Ciclos formativos oficiales')
    expect(home).toContain('Convocatorias abiertas')
    expect(home).toContain('Auxiliar de Farmacia')
    expect(home).not.toContain('Higiene Bucodental')
    expect(home).not.toContain('Hablemos de tu próxima formación')
    expect(home).not.toContain('#2563eb')
    const about = renderSitePage(composed, '/quienes-somos', '/preview')
    expect(about.status).toBe(200)
    expect(about.html).toContain('Centro de estudios en Tenerife')
  })
})
