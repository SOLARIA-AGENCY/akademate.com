import { legalTemplatePages } from './legal'
import type { WebsiteTemplate } from './types'

const AKADEMATE_HERO = '/website/akademate/hero-formacion.svg'
const AKADEMATE_CAMPUS = '/website/akademate/hero-campus.svg'
const AKADEMATE_CATEGORY = '/website/akademate/category.svg'
const AKADEMATE_PERSON = '/website/akademate/person.svg'

export const SPORTS_ACADEMY_TEMPLATE: WebsiteTemplate = {
  vertical: 'sports_academy',
  label: 'Academia deportiva',
  description: 'Disciplinas, equipo técnico, instalaciones y matrícula.',
  pages: [
    {
      slug: 'inicio',
      title: 'Inicio',
      path: '/',
      pageKind: 'home',
      modules: [
        {
          kind: 'heroCarousel',
          defaultProps: {
            eyebrow: 'Temporada abierta',
            title: 'Academia deportiva',
            subtitle: 'Disciplinas, equipo técnico e instalaciones. Matrícula en un mismo sitio.',
            slides: [
              {
                image: AKADEMATE_HERO,
                alt: 'Composición geométrica abstracta',
                title: 'Entrena con un plan claro',
                subtitle: 'Iniciación y rendimiento, con seguimiento del alumnado.',
              },
              {
                image: AKADEMATE_CAMPUS,
                alt: 'Composición arquitectónica abstracta',
                title: 'Instalaciones listas para entrenar',
                subtitle: 'Consulta horarios, pistas y cómo matricularte.',
              },
            ],
            primaryCta: { label: 'Ver disciplinas', href: '/disciplinas' },
            secondaryCta: { label: 'Matricularse', href: '/contacto' },
          },
        },
        {
          kind: 'categoryGrid',
          defaultProps: {
            title: 'Disciplinas',
            subtitle: 'Elige el deporte y el nivel que buscas.',
            items: [
              { title: 'Fútbol', image: AKADEMATE_CATEGORY, href: '/disciplinas' },
              { title: 'Natación', image: AKADEMATE_CATEGORY, href: '/disciplinas' },
              { title: 'Atletismo', image: AKADEMATE_CATEGORY, href: '/disciplinas' },
            ],
          },
        },
        {
          kind: 'teamGrid',
          defaultProps: {
            title: 'Equipo técnico',
            subtitle: 'Entrenadores que dirigen cada disciplina.',
            members: [
              { name: 'Entrenador de fútbol', role: 'Fútbol', image: AKADEMATE_PERSON },
              { name: 'Entrenador de natación', role: 'Natación', image: AKADEMATE_PERSON },
              { name: 'Entrenador de atletismo', role: 'Atletismo', image: AKADEMATE_PERSON },
            ],
          },
        },
        {
          kind: 'campusList',
          defaultProps: {
            title: 'Instalaciones',
            subtitle: 'Pistas, vasos y espacios de entrenamiento.',
            limit: 6,
          },
        },
        {
          kind: 'leadForm',
          defaultProps: {
            title: 'Matrícula',
            subtitle: 'Solicita plaza y te confirmamos grupo y horario.',
            source: 'website-enrollment',
          },
        },
      ],
    },
    {
      slug: 'disciplinas',
      title: 'Disciplinas',
      path: '/disciplinas',
      pageKind: 'standard',
      modules: [
        {
          kind: 'categoryGrid',
          defaultProps: {
            title: 'Disciplinas',
            subtitle: 'Oferta deportiva por modalidad.',
            items: [
              { title: 'Fútbol', image: AKADEMATE_CATEGORY, href: '/disciplinas' },
              { title: 'Natación', image: AKADEMATE_CATEGORY, href: '/disciplinas' },
              { title: 'Atletismo', image: AKADEMATE_CATEGORY, href: '/disciplinas' },
            ],
          },
        },
      ],
    },
    {
      slug: 'equipo',
      title: 'Equipo técnico',
      path: '/equipo',
      pageKind: 'standard',
      modules: [
        {
          kind: 'teamGrid',
          defaultProps: {
            title: 'Equipo técnico',
            subtitle: 'El staff que dirige los entrenamientos.',
            members: [
              { name: 'Entrenador de fútbol', role: 'Fútbol', image: AKADEMATE_PERSON },
              { name: 'Entrenador de natación', role: 'Natación', image: AKADEMATE_PERSON },
            ],
          },
        },
      ],
    },
    {
      slug: 'instalaciones',
      title: 'Instalaciones',
      path: '/instalaciones',
      pageKind: 'campuses_index',
      modules: [
        {
          kind: 'campusList',
          defaultProps: {
            title: 'Instalaciones',
            subtitle: 'Sedes y espacios de entrenamiento.',
            limit: 8,
          },
        },
      ],
    },
    {
      slug: 'faq',
      title: 'Preguntas frecuentes',
      path: '/faq',
      pageKind: 'faq_index',
      modules: [
        {
          kind: 'faqList',
          defaultProps: {
            title: 'Preguntas frecuentes',
            subtitle: 'Matrícula, horarios y material.',
          },
          bind: { collection: 'faqs' },
        },
      ],
    },
    {
      slug: 'contacto',
      title: 'Matrícula',
      path: '/contacto',
      pageKind: 'contact',
      modules: [
        {
          kind: 'leadForm',
          defaultProps: {
            title: 'Solicita matrícula',
            subtitle: 'Indica disciplina, edad y disponibilidad.',
            source: 'website-enrollment',
          },
        },
      ],
    },
    ...legalTemplatePages(),
  ],
}
