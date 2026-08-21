import { legalTemplatePages } from './legal'
import type { WebsiteTemplate } from './types'

const AKADEMATE_HERO = '/website/akademate/hero-formacion.svg'
const AKADEMATE_CATEGORY = '/website/akademate/category.svg'
const AKADEMATE_PERSON = '/website/akademate/person.svg'

export const WELLNESS_TEMPLATE: WebsiteTemplate = {
  vertical: 'wellness',
  label: 'Bienestar',
  description: 'Yoga, pilates y meditación. Clases, equipo y testimonios.',
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
            eyebrow: 'Reserva abierta',
            title: 'Yoga, pilates y meditación',
            subtitle: 'Clases para todos los niveles. Elige tu ritmo y reserva plaza.',
            slides: [
              {
                image: AKADEMATE_HERO,
                alt: 'Composición geométrica abstracta',
                title: 'Yoga, pilates y meditación',
                subtitle: 'Práctica guiada, grupos reducidos y horarios flexibles.',
              },
            ],
            primaryCta: { label: 'Ver clases', href: '/clases' },
            secondaryCta: { label: 'Reservar plaza', href: '/contacto' },
          },
        },
        {
          kind: 'categoryGrid',
          defaultProps: {
            title: 'Disciplinas',
            subtitle: 'Elige la práctica que mejor encaja contigo.',
            items: [
              { title: 'Yoga', image: AKADEMATE_CATEGORY, href: '/clases' },
              { title: 'Pilates', image: AKADEMATE_CATEGORY, href: '/clases' },
              { title: 'Meditación', image: AKADEMATE_CATEGORY, href: '/clases' },
            ],
          },
        },
        {
          kind: 'teamGrid',
          defaultProps: {
            title: 'Equipo',
            subtitle: 'Profesionales que acompañan cada sesión.',
            members: [
              { name: 'Instructor de yoga', role: 'Yoga', image: AKADEMATE_PERSON },
              { name: 'Instructor de pilates', role: 'Pilates', image: AKADEMATE_PERSON },
              { name: 'Guía de meditación', role: 'Meditación', image: AKADEMATE_PERSON },
            ],
          },
        },
        {
          kind: 'testimonialList',
          defaultProps: {
            title: 'Lo que dicen los alumnos',
            subtitle: 'Opiniones publicadas del centro.',
            limit: 6,
          },
          bind: { collection: 'testimonials' },
        },
        {
          kind: 'formEmbed',
          defaultProps: {
            title: 'Reserva tu clase',
            subtitle: 'Déjanos tus datos y te confirmamos disponibilidad.',
            source: 'website-home',
          },
          bind: { collection: 'forms' },
        },
      ],
    },
    {
      slug: 'quienes-somos',
      title: 'Quiénes somos',
      path: '/quienes-somos',
      pageKind: 'standard',
      modules: [
        {
          kind: 'richText',
          defaultProps: {
            title: 'Quiénes somos',
            body: 'Centro de yoga, pilates y meditación. Práctica cercana y grupos reducidos.',
          },
        },
        {
          kind: 'teamGrid',
          defaultProps: {
            title: 'Equipo',
            subtitle: 'Las personas que imparten las clases.',
            members: [
              { name: 'Instructor de yoga', role: 'Yoga', image: AKADEMATE_PERSON },
              { name: 'Instructor de pilates', role: 'Pilates', image: AKADEMATE_PERSON },
            ],
          },
        },
      ],
    },
    {
      slug: 'clases',
      title: 'Clases',
      path: '/clases',
      pageKind: 'standard',
      modules: [
        {
          kind: 'categoryGrid',
          defaultProps: {
            title: 'Clases',
            subtitle: 'Yoga, pilates y meditación por nivel.',
            items: [
              { title: 'Yoga', image: AKADEMATE_CATEGORY, href: '/clases' },
              { title: 'Pilates', image: AKADEMATE_CATEGORY, href: '/clases' },
              { title: 'Meditación', image: AKADEMATE_CATEGORY, href: '/clases' },
            ],
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
            subtitle: 'Horarios, niveles y cómo reservar.',
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
          kind: 'formEmbed',
          defaultProps: {
            title: 'Escríbenos',
            subtitle: 'Reserva o consulta disponibilidad.',
            source: 'website-contact',
          },
          bind: { collection: 'forms' },
        },
      ],
    },
    ...legalTemplatePages(),
  ],
}
