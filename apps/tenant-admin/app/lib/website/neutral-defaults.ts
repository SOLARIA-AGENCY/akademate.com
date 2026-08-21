import {
  AKADEMATE_ACCENT,
  AKADEMATE_PRIMARY,
  AKADEMATE_SECONDARY,
  AKADEMATE_SIDEBAR,
} from '@/src/domain/academy-brand'
import { DEFAULT_WEBSITE_CONSENT } from './consent'
import type { WebsiteConfig } from './types'

/**
 * The Akademate website template.
 *
 * This is the base every tenant starts from and the base `mergeWebsiteConfig`
 * merges stored tenant configuration onto. It must stay free of any single
 * academy's identity: no client names, addresses, phone numbers, photographs,
 * accreditation marks or programme catalogues.
 *
 * Client content belongs in the tenant record, not here. `CEP_DEFAULT_WEBSITE`
 * is kept only as the seed payload used to populate the CEP tenant.
 */
export const NEUTRAL_DEFAULT_WEBSITE: WebsiteConfig = {
  visualIdentity: {
    logoPrimary: '/logos/akademate-logo-official.png',
    logoMark: '/logos/akademate-favicon.svg',
    favicon: '/logos/akademate-favicon.svg',
    fontPrimary: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif',
    fontSecondary: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif',
    colorPrimary: AKADEMATE_PRIMARY,
    colorPrimaryDark: AKADEMATE_SIDEBAR,
    colorAccent: AKADEMATE_ACCENT,
    colorSurface: '#f8fafc',
    colorText: AKADEMATE_SECONDARY,
  },
  academyName: 'Akademate',
  legalName: '',
  seo: {
    keywords: [],
    concepts: [],
  },
  contact: {
    email: '',
    phone: '',
    schedule: '',
    whatsapp: [],
  },
  navigation: {
    items: [
      { kind: 'link', label: 'Inicio', href: '/' },
      { kind: 'dropdown', source: 'study_types', label: 'Cursos', href: '/cursos' },
      { kind: 'dropdown', source: 'cycles_by_level', label: 'Ciclos', href: '/ciclos' },
      { kind: 'link', label: 'Convocatorias', href: '/convocatorias' },
      { kind: 'dropdown', source: 'campuses', label: 'Sedes', href: '/sedes' },
      { kind: 'link', label: 'Blog', href: '/blog' },
      { kind: 'link', label: 'FAQ', href: '/faq' },
      { kind: 'link', label: 'Campus', href: '/acceso' },
    ],
    cta: { label: 'Solicitar información', href: '/contacto' },
  },
  footer: {
    description:
      'Plataforma de formación gestionada con Akademate. Catálogo, convocatorias y matrícula en un mismo sitio.',
    columns: [
      {
        title: 'Oferta formativa',
        links: [
          { label: 'Cursos', href: '/cursos' },
          { label: 'Ciclos', href: '/ciclos' },
          { label: 'Convocatorias', href: '/convocatorias' },
          { label: 'Sedes', href: '/sedes' },
        ],
      },
      {
        title: 'Información',
        links: [
          { label: 'Blog', href: '/blog' },
          { label: 'FAQ', href: '/faq' },
          { label: 'Campus', href: '/acceso' },
          { label: 'Contacto', href: '/contacto' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Privacidad', href: '/legal/privacidad' },
          { label: 'Términos', href: '/legal/terminos' },
          { label: 'Cookies', href: '/legal/cookies' },
        ],
      },
    ],
    locations: [],
    badges: [],
  },
  redirects: [
    { from: '/p/formacion', to: '/' },
    { from: '/p/cursos', to: '/cursos' },
    { from: '/p/ciclos', to: '/ciclos' },
    { from: '/p/convocatorias', to: '/convocatorias' },
    { from: '/p/contacto', to: '/contacto' },
  ],
  pages: [
    {
      title: 'Inicio',
      path: '/',
      pageKind: 'home',
      seo: {
        title: 'Formación profesional, cursos y convocatorias',
        description:
          'Consulta el catálogo formativo, las convocatorias abiertas y solicita información sin compromiso.',
      },
      sections: [
        {
          kind: 'heroCarousel',
          eyebrow: 'Matrícula abierta',
          title: 'Formación profesional orientada al empleo',
          subtitle:
            'Consulta el catálogo, revisa las convocatorias abiertas y solicita información sin compromiso.',
          slides: [
            {
              image: '/website/akademate/hero-formacion.svg',
              alt: 'Composición geométrica abstracta',
              title: 'Formación profesional orientada al empleo',
              subtitle: 'Programas actualizados, matrícula sencilla y seguimiento del alumnado.',
            },
            {
              image: '/website/akademate/hero-campus.svg',
              alt: 'Composición arquitectónica abstracta',
              title: 'Aprende donde te venga mejor',
              subtitle: 'Modalidad presencial, semipresencial y en línea según cada programa.',
            },
          ],
          primaryCta: { label: 'Ver catálogo', href: '/cursos' },
          secondaryCta: { label: 'Solicitar información', href: '/contacto' },
        },
        {
          kind: 'featureStrip',
          title: 'Por qué formarte aquí',
          items: [
            {
              title: 'Catálogo actualizado',
              description: 'Programas, requisitos y plazos siempre al día en un único sitio.',
            },
            {
              title: 'Matrícula sencilla',
              description: 'Solicita plaza en línea y sigue el estado de tu inscripción.',
            },
            {
              title: 'Acompañamiento',
              description: 'Orientación durante el proceso de admisión y a lo largo del curso.',
            },
          ],
        },
        {
          kind: 'cycleList',
          title: 'Ciclos formativos',
          subtitle: 'Titulaciones oficiales con matrícula abierta.',
          limit: 6,
        },
        {
          kind: 'courseList',
          title: 'Cursos destacados',
          subtitle: 'Formación especializada de corta duración.',
          limit: 6,
        },
        {
          kind: 'convocationList',
          title: 'Convocatorias abiertas',
          subtitle: 'Plazos y plazas disponibles actualmente.',
          limit: 6,
        },
        {
          kind: 'campusList',
          title: 'Sedes',
          subtitle: 'Consulta las sedes disponibles.',
          limit: 6,
        },
        {
          kind: 'leadForm',
          title: 'Solicita información',
          subtitle: 'Cuéntanos qué te interesa y te respondemos.',
          source: 'website-home',
        },
      ],
    },
    {
      title: 'Cursos',
      path: '/cursos',
      pageKind: 'courses_index',
      seo: {
        title: 'Cursos',
        description: 'Catálogo de cursos por área formativa y modalidad.',
      },
      sections: [],
    },
    {
      title: 'Ciclos',
      path: '/ciclos',
      pageKind: 'cycles_index',
      seo: {
        title: 'Ciclos formativos',
        description: 'Oferta de ciclos formativos con información actualizada por programa.',
      },
      sections: [],
    },
    {
      title: 'Convocatorias',
      path: '/convocatorias',
      pageKind: 'convocations_index',
      seo: {
        title: 'Convocatorias abiertas',
        description: 'Listado de convocatorias abiertas y plazas disponibles.',
      },
      sections: [],
    },
    {
      title: 'Sedes',
      path: '/sedes',
      pageKind: 'campuses_index',
      seo: {
        title: 'Sedes',
        description: 'Información de las sedes y campus activos.',
      },
      sections: [],
    },
    {
      title: 'Blog',
      path: '/blog',
      pageKind: 'blog_index',
      seo: {
        title: 'Blog',
        description: 'Noticias y artículos publicados por el centro.',
      },
      sections: [],
    },
    {
      title: 'FAQ',
      path: '/faq',
      pageKind: 'faq_index',
      seo: {
        title: 'Preguntas frecuentes',
        description: 'Respuestas a las dudas más habituales sobre matrícula y convocatorias.',
      },
      sections: [],
    },
    {
      title: 'Contacto',
      path: '/contacto',
      pageKind: 'contact',
      seo: {
        title: 'Contacto',
        description: 'Solicita información sobre la oferta formativa.',
      },
      sections: [],
    },
  ],
  consent: DEFAULT_WEBSITE_CONSENT,
}
