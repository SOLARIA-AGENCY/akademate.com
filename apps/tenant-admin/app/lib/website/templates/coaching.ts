import { legalTemplatePages } from './legal'
import type { WebsiteTemplate } from './types'

const AKADEMATE_HERO = '/website/akademate/hero-formacion.svg'

export const COACHING_TEMPLATE: WebsiteTemplate = {
  vertical: 'coaching',
  label: 'Coaching',
  description: 'Programas, método, testimonios y formulario de orientación.',
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
            eyebrow: 'Plazas abiertas',
            title: 'Programas de coaching',
            subtitle: 'Acompañamiento individual y grupal con un método claro.',
            slides: [
              {
                image: AKADEMATE_HERO,
                alt: 'Composición geométrica abstracta',
                title: 'Programas de coaching',
                subtitle: 'Objetivos, seguimiento y sesiones guiadas.',
              },
            ],
            primaryCta: { label: 'Ver programas', href: '/programas' },
            secondaryCta: { label: 'Solicitar información', href: '/contacto' },
          },
        },
        {
          kind: 'courseList',
          defaultProps: {
            title: 'Programas',
            subtitle: 'Itinerarios de corta y media duración.',
            limit: 6,
          },
        },
        {
          kind: 'featureStrip',
          defaultProps: {
            title: 'Método',
            subtitle: 'Cómo trabajamos con cada persona.',
            items: [
              {
                title: 'Diagnóstico',
                description: 'Definimos el punto de partida y el objetivo de la etapa.',
              },
              {
                title: 'Plan de sesiones',
                description: 'Un calendario breve, con tareas entre encuentros.',
              },
              {
                title: 'Seguimiento',
                description: 'Revisamos avances y ajustamos el plan cuando hace falta.',
              },
            ],
          },
        },
        {
          kind: 'testimonialList',
          defaultProps: {
            title: 'Testimonios',
            subtitle: 'Experiencias publicadas de quienes ya han pasado por un programa.',
            limit: 6,
          },
          bind: { collection: 'testimonials' },
        },
        {
          kind: 'leadForm',
          defaultProps: {
            title: 'Solicita información',
            subtitle: 'Cuéntanos qué buscas y te orientamos.',
            source: 'website-home',
          },
        },
      ],
    },
    {
      slug: 'programas',
      title: 'Programas',
      path: '/programas',
      pageKind: 'courses_index',
      modules: [
        {
          kind: 'courseList',
          defaultProps: {
            title: 'Programas',
            subtitle: 'Catálogo de itinerarios de coaching.',
            limit: 12,
          },
        },
      ],
    },
    {
      slug: 'metodo',
      title: 'Método',
      path: '/metodo',
      pageKind: 'standard',
      modules: [
        {
          kind: 'featureStrip',
          defaultProps: {
            title: 'Método',
            items: [
              {
                title: 'Claridad',
                description: 'Un objetivo por etapa y criterios de avance visibles.',
              },
              {
                title: 'Práctica',
                description: 'Cada sesión termina con una acción concreta.',
              },
              {
                title: 'Cierre',
                description: 'Al final del programa revisamos resultados y siguientes pasos.',
              },
            ],
          },
        },
        {
          kind: 'richText',
          defaultProps: {
            title: 'Cómo son las sesiones',
            body: 'Encuentros individuales o grupales, con material de apoyo y tareas entre sesiones.',
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
            subtitle: 'Duración, formato y cómo empezar.',
          },
          bind: { collection: 'faqs' },
        },
      ],
    },
    {
      slug: 'contacto',
      title: 'Contacto',
      path: '/contacto',
      pageKind: 'contact',
      modules: [
        {
          kind: 'leadForm',
          defaultProps: {
            title: 'Solicita información',
            subtitle: 'Te ayudamos a elegir el programa adecuado.',
            source: 'website-contact',
          },
        },
      ],
    },
    ...legalTemplatePages(),
  ],
}
