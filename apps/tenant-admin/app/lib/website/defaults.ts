import type { WebsiteConfig } from './types'

export const CEP_DEFAULT_WEBSITE: WebsiteConfig = {
  visualIdentity: {
    logoPrimary: '/logos/cep-formacion-logo.png',
    logoMark: '/logos/cep-formacion-isotipo.svg',
    favicon: '/logos/cep-formacion-isotipo.svg',
    fontPrimary: 'Poppins',
    fontSecondary: 'Montserrat',
    colorPrimary: '#f2014b',
    colorPrimaryDark: '#d0013f',
    colorAccent: '#1a1a2e',
    colorSurface: '#fff7fa',
    colorText: '#111827',
  },
  navigation: {
    items: [
      { label: 'Inicio', href: '/' },
      { label: 'Ciclos', href: '/ciclos' },
      { label: 'Cursos', href: '/cursos' },
      { label: 'Convocatorias', href: '/convocatorias' },
      { label: 'Sedes', href: '/sedes' },
      { label: 'Blog', href: '/blog' },
      { label: 'FAQ', href: '/faq' },
    ],
    cta: { label: 'Contacto', href: '/contacto' },
  },
  footer: {
    description:
      'Centro de estudios profesionales en Tenerife. Formación oficial, especializada y orientada a la inserción laboral.',
    columns: [
      {
        title: 'Oferta formativa',
        links: [
          { label: 'Ciclos formativos', href: '/ciclos' },
          { label: 'Cursos', href: '/cursos' },
          { label: 'Convocatorias', href: '/convocatorias' },
          { label: 'Sedes', href: '/sedes' },
        ],
      },
      {
        title: 'Información',
        links: [
          { label: 'Blog', href: '/blog' },
          { label: 'FAQ', href: '/faq' },
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
    legalNote: 'Plataforma pública de CEP Formación.',
  },
  redirects: [
    { from: '/p/formacion', to: '/' },
    { from: '/p/cursos', to: '/cursos' },
    { from: '/p/convocatorias', to: '/convocatorias' },
    { from: '/p/ciclos', to: '/ciclos' },
    { from: '/p/contacto', to: '/contacto' },
    { from: '/cursos-ocupados', to: '/convocatorias?audiencia=ocupados' },
    { from: '/cursos-desempleados', to: '/convocatorias?audiencia=desempleados' },
  ],
  pages: [
    {
      title: 'Inicio',
      path: '/',
      pageKind: 'home',
      seo: {
        title: 'CEP Formación | Cursos, ciclos y convocatorias en Tenerife',
        description:
          'Centro de estudios profesionales con ciclos formativos, cursos especializados y convocatorias activas en Tenerife.',
      },
      sections: [
        {
          kind: 'heroCarousel',
          eyebrow: 'Matrícula abierta',
          title: 'Formación profesional para moverte rápido en el mercado laboral',
          subtitle:
            'Ciclos oficiales, especialización sanitaria, mundo animal y formación subvencionada con campus, sedes y orientación real a empleabilidad.',
          slides: [
            { image: '/website/cep/hero/slideshow-1.jpg', alt: 'Creemos en el poder de la actitud' },
            { image: '/website/cep/hero/slideshow-2.jpg', alt: 'Creemos en ti' },
            { image: '/website/cep/hero/slideshow-3.jpg', alt: 'El momento es ahora' },
          ],
          primaryCta: { label: 'Ver convocatorias', href: '/convocatorias' },
          secondaryCta: { label: 'Solicitar información', href: '/contacto' },
        },
        {
          kind: 'statsStrip',
          items: [
            { value: '+25', label: 'Años de experiencia' },
            { value: '2', label: 'Sedes en Tenerife' },
            { value: '+50', label: 'Cursos y especialidades' },
            { value: '98%', label: 'Inserción laboral' },
          ],
        },
        {
          kind: 'featureStrip',
          title: 'Por qué CEP',
          subtitle: 'Mismo tono de marca, estructura más mantenible.',
          items: [
            { title: 'Prácticas reales', description: 'Programas conectados con empresas y entorno profesional.' },
            { title: 'Oferta mixta', description: 'Ciclos oficiales, cursos privados y formación subvencionada.' },
            { title: 'Sedes activas', description: 'Presencia física en Tenerife con atención académica continua.' },
          ],
        },
        {
          kind: 'ctaBanner',
          title: '¿Buscas formación subvencionada o cambio profesional?',
          body: 'Explora convocatorias abiertas y encuentra la modalidad que encaja contigo.',
          cta: { label: 'Explorar convocatorias', href: '/convocatorias' },
          theme: 'dark',
        },
        {
          kind: 'cycleList',
          title: 'Ciclos formativos oficiales',
          subtitle: 'Oferta oficial con foco en empleabilidad y continuidad académica.',
          limit: 6,
        },
        {
          kind: 'courseList',
          title: 'Cursos destacados',
          subtitle: 'Especialización orientada a profesiones con demanda.',
          limit: 6,
        },
        {
          kind: 'convocationList',
          title: 'Convocatorias abiertas',
          subtitle: 'Las plazas con inscripción activa se actualizan desde la base de datos.',
          limit: 4,
        },
        {
          kind: 'categoryGrid',
          title: 'Áreas de formación',
          subtitle: 'Bloques visuales editables, conservando la estructura del sitio original.',
          items: [
            { title: 'Ciclos formativos', image: '/website/cep/categories/ciclos-formativos.jpg', href: '/ciclos' },
            { title: 'Salud, bienestar y deporte', image: '/website/cep/categories/salud-bienestar-y-deporte.jpg', href: '/cursos' },
            { title: 'Mundo animal', image: '/website/cep/categories/mundo-animal.jpg', href: '/cursos' },
            { title: 'Especialización sanitaria', image: '/website/cep/categories/especializacion-sanitaria.jpg', href: '/cursos' },
          ],
        },
        {
          kind: 'campusList',
          title: 'Nuestras sedes',
          subtitle: 'Información, localización y detalle de cada centro.',
          limit: 3,
        },
        {
          kind: 'teamGrid',
          title: 'Equipo docente',
          subtitle: 'Presentación editorial del equipo mientras llega la colección dedicada.',
          members: [
            { name: 'Alexis Galán', role: 'Farmacia', image: '/website/cep/team/alexis.jpg' },
            { name: 'Livia Bernardi', role: 'Adiestramiento Canino', image: '/website/cep/team/livia.jpg' },
            { name: 'Nuria E. Ángel', role: 'Odontología', image: '/website/cep/team/nuria.jpg' },
            { name: 'Sara Jaquete', role: 'Veterinaria', image: '/website/cep/team/sara.jpg' },
            { name: 'Lali Hernández', role: 'Inglés', image: '/website/cep/team/cecilia.jpg' },
            { name: 'Goretti Valdés', role: 'Farmacia', image: '/website/cep/team/goreti.jpg' },
            { name: 'Luis J. González', role: 'Medicina estética', image: '/website/cep/team/luis.jpg' },
            { name: 'Esther González', role: 'Medicina estética', image: '/website/cep/team/esther.jpg' },
          ],
        },
        {
          kind: 'leadForm',
          title: 'Solicita información',
          subtitle: 'Formulario conectado con el flujo actual de leads.',
          source: 'website-home',
        },
      ],
    },
    {
      title: 'Cursos',
      path: '/cursos',
      pageKind: 'courses_index',
      seo: {
        title: 'Cursos | CEP Formación',
        description: 'Catálogo de cursos de CEP Formación con especializaciones por área y modalidad.',
      },
      sections: [],
    },
    {
      title: 'Ciclos',
      path: '/ciclos',
      pageKind: 'cycles_index',
      seo: {
        title: 'Ciclos Formativos | CEP Formación',
        description: 'Oferta de ciclos formativos oficiales con información actualizada por programa.',
      },
      sections: [],
    },
    {
      title: 'Convocatorias',
      path: '/convocatorias',
      pageKind: 'convocations_index',
      seo: {
        title: 'Convocatorias Abiertas | CEP Formación',
        description: 'Listado dinámico de convocatorias abiertas y plazas disponibles.',
      },
      sections: [],
    },
    {
      title: 'Sedes',
      path: '/sedes',
      pageKind: 'campuses_index',
      seo: {
        title: 'Sedes | CEP Formación',
        description: 'Información de sedes y campus activos de CEP Formación.',
      },
      sections: [],
    },
    {
      title: 'Blog',
      path: '/blog',
      pageKind: 'blog_index',
      seo: {
        title: 'Blog | CEP Formación',
        description: 'Noticias, artículos y contenido editorial de CEP Formación.',
      },
      sections: [],
    },
    {
      title: 'FAQ',
      path: '/faq',
      pageKind: 'faq_index',
      seo: {
        title: 'Preguntas Frecuentes | CEP Formación',
        description: 'Respuestas a las dudas más habituales sobre formación, matrícula y convocatorias.',
      },
      sections: [],
    },
    {
      title: 'Contacto',
      path: '/contacto',
      pageKind: 'contact',
      seo: {
        title: 'Contacto | CEP Formación',
        description: 'Contacta con CEP Formación para solicitar información de cursos y ciclos.',
      },
      sections: [],
    },
  ],
}
