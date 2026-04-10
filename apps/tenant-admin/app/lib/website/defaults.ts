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
      { label: 'Quiénes Somos', href: '/quienes-somos' },
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
            {
              image: '/website/cep/hero/cepformacion-hero-01.png',
              alt: 'Alumna con diploma en centro educativo',
              title: 'Impulsa tu futuro profesional',
              subtitle: 'Programas orientados a titulación, prácticas reales y empleabilidad.',
            },
            {
              image: '/website/cep/hero/cepformacion-hero-02.png',
              alt: 'Mujer con certificado en entorno de estudio',
              title: 'Formación flexible para cada etapa',
              subtitle: 'Aprende a tu ritmo con acompañamiento docente y objetivos claros.',
            },
            {
              image: '/website/cep/hero/cepformacion-hero-03.png',
              alt: 'Estudiante de diseño con tablet en aula',
              title: 'Especialízate en áreas con demanda',
              subtitle: 'Contenidos prácticos para entrar rápido en el mercado laboral.',
            },
            {
              image: '/website/cep/hero/cepformacion-hero-04.png',
              alt: 'Profesional de recepción en entorno corporativo',
              title: 'Competencias para atención y gestión',
              subtitle: 'Capacitación profesional para sectores de servicios y empresa.',
            },
            {
              image: '/website/cep/hero/cepformacion-hero-05.png',
              alt: 'Docente infantil leyendo en aula',
              title: 'Vocación educativa con salida laboral',
              subtitle: 'Cursos y ciclos para trabajar en educación y apoyo escolar.',
            },
            {
              image: '/website/cep/hero/cepformacion-hero-06.png',
              alt: 'Técnico sanitario frente a ambulancia',
              title: 'Prepárate para emergencias sanitarias',
              subtitle: 'Entrenamiento técnico con enfoque real y operativo.',
            },
            {
              image: '/website/cep/hero/cepformacion-hero-07.png',
              alt: 'Auxiliar de cuidados con persona mayor',
              title: 'Cuidados y atención sociosanitaria',
              subtitle: 'Formación humana y profesional para el ámbito asistencial.',
            },
            {
              image: '/website/cep/hero/cepformacion-hero-08.png',
              alt: 'Alumno de enfermería en simulación clínica',
              title: 'Aprende con simulación clínica',
              subtitle: 'Práctica guiada para dominar protocolos y habilidades técnicas.',
            },
            {
              image: '/website/cep/hero/cepformacion-hero-09.png',
              alt: 'Entrenadora en actividad deportiva al aire libre',
              title: 'Salud, deporte y bienestar',
              subtitle: 'Capacitación para dinamizar grupos y mejorar el rendimiento físico.',
            },
            {
              image: '/website/cep/hero/cepformacion-hero-10.png',
              alt: 'Profesional en oficina de trabajo colaborativo',
              title: 'Gestión administrativa y empresarial',
              subtitle: 'Conocimientos aplicados para entornos corporativos modernos.',
            },
            {
              image: '/website/cep/hero/cepformacion-hero-11.png',
              alt: 'Estudiante trabajando con tablet en cafetería',
              title: 'Competencias digitales aplicadas',
              subtitle: 'Herramientas actuales para trabajar en equipos y proyectos.',
            },
            {
              image: '/website/cep/hero/cepformacion-hero-12.png',
              alt: 'Camarero profesional en restaurante',
              title: 'Profesionalización en hostelería',
              subtitle: 'Programas enfocados en atención al cliente y excelencia en servicio.',
            },
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
          title: '¿Por qué elegir CEP Formación?',
          subtitle:
            'Más de 25 años formando profesionales en Tenerife. Con nosotros no estudias para aprobar, estudias para trabajar.',
          items: [
            {
              title: 'Formación conectada con el sector',
              description:
                'Nuestros programas incluyen prácticas en empresas reales del entorno canario. Saldrás preparado para incorporarte desde el primer día.',
            },
            {
              title: 'Toda la formación en un solo centro',
              description:
                'Ciclos formativos oficiales (CFGM y CFGS), cursos privados de especialización y formación subvencionada por el Servicio Canario de Empleo.',
            },
            {
              title: 'Presencia física en toda la isla',
              description:
                'Contamos con dos sedes en Tenerife —Santa Cruz y La Orotava Norte— con atención académica presencial y equipo docente especializado.',
            },
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
          subtitle: 'Dos centros en Tenerife con atención académica personalizada, instalaciones propias y equipo docente especializado.',
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
    {
      title: 'Quiénes Somos',
      path: '/quienes-somos',
      pageKind: 'standard',
      seo: {
        title: 'Quiénes Somos | CEP Formación',
        description: 'Historia, misión, visión y valores de CEP Formación en Tenerife.',
      },
      sections: [],
    },
  ],
}
