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
      { kind: 'link', label: 'Inicio', href: '/' },
      { kind: 'link', label: 'Quiénes Somos', href: '/quienes-somos' },
      { kind: 'dropdown', source: 'cycles_by_level', label: 'Ciclos', href: '/ciclos' },
      { kind: 'dropdown', source: 'study_types', label: 'Cursos', href: '/cursos' },
      { kind: 'link', label: 'Nuevas formaciones', href: '/#nuevas-formaciones' },
      { kind: 'link', label: 'Convocatorias', href: '/convocatorias' },
      { kind: 'link', label: 'Agencia de colocación', href: '/agencia-colocacion' },
      { kind: 'dropdown', source: 'campuses', label: 'Sedes', href: '/sedes' },
      { kind: 'link', label: 'Blog', href: '/blog' },
      { kind: 'link', label: 'FAQ', href: '/faq' },
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
          title: 'Por qué elegir CEP',
          subtitle: 'Formación cercana, práctica y orientada a que avances con seguridad desde el primer contacto hasta el aula.',
          items: [
            {
              title: 'Formación pensada para trabajar',
              description: 'Programas conectados con sectores reales y competencias útiles para tu próximo paso profesional.',
            },
            {
              title: 'Docentes en activo',
              description: 'Aprende con profesionales que conocen el día a día del sector y trasladan esa experiencia al aula.',
            },
            {
              title: 'Sedes reales en Tenerife',
              description: 'Centros de atención y formación donde puedes resolver dudas, visitar instalaciones y recibir orientación.',
            },
            {
              title: 'Bolsa de empleo y orientación',
              description: 'Acompañamiento para enfocar tu búsqueda laboral y acceder a nuestra agencia de colocación autorizada.',
            },
            {
              title: 'Grupos reducidos',
              description: 'Un entorno de aprendizaje más cercano para seguir tu progreso y trabajar con más atención docente.',
            },
            {
              title: 'Acompañamiento desde la matrícula',
              description: 'Te guiamos en requisitos, documentación, horarios y opciones para elegir con claridad.',
            },
          ],
        },
        {
          kind: 'ctaBanner',
          title: '¿Buscas una formación subvencionada o quieres cambiar de rumbo profesional?',
          body: 'Consulta las convocatorias abiertas y reserva tu plaza con el equipo de CEP Formación.',
          cta: { label: 'Ver convocatorias abiertas', href: '/convocatorias' },
          theme: 'dark',
        },
        {
          id: 'agencia-colocacion',
          kind: 'jobPlacement',
          title: 'Agencia de colocación oficial',
          subtitle: 'Acompañamos tu formación con orientación laboral, acceso a oportunidades y registro como candidato en nuestra bolsa de empleo autorizada.',
          image: '/media/admin-1.jpg',
          cta: { label: 'Conocer la bolsa de empleo', href: '/agencia-colocacion' },
          secondaryCta: { label: 'Registrarme como candidato', href: 'https://cursostenerife.agenciascolocacion.com/candidatos/registro' },
          externalRegistrationUrl: 'https://cursostenerife.agenciascolocacion.com/candidatos/registro',
        },
        {
          kind: 'cycleList',
          title: 'Ciclos formativos oficiales',
          subtitle: 'Oferta oficial con foco en empleabilidad y continuidad académica.',
          limit: 6,
        },
        {
          id: 'nuevas-formaciones',
          kind: 'courseList',
          title: 'Nuevas formaciones',
          subtitle: 'Programas que estamos preparando para ampliar la oferta formativa de CEP.',
          limit: 3,
        },
        {
          kind: 'courseList',
          title: 'Cursos destacados',
          subtitle: 'Formaciones prácticas para especializarte, cambiar de sector o mejorar tu perfil profesional.',
          limit: 6,
        },
        {
          kind: 'convocationList',
          title: 'Convocatorias abiertas',
          subtitle: 'Elige tu próxima fecha de inicio y reserva plaza en las formaciones disponibles.',
          limit: 4,
        },
        {
          kind: 'categoryGrid',
          title: 'Áreas de formación',
          subtitle: 'Encuentra tu próxima formación por especialidad profesional.',
          items: [
            { title: 'Área Sanitaria y Clínica', image: '/media/farmacia-hero.png', href: '/p/areas/area-sanitaria-y-clinica' },
            { title: 'Área Veterinaria y Bienestar Animal', image: '/website/cep/categories/mundo-animal.jpg', href: '/p/areas/area-veterinaria-y-bienestar-animal' },
            { title: 'Área Salud, Bienestar y Deporte', image: '/website/cep/categories/salud-bienestar-y-deporte.jpg', href: '/p/areas/area-salud-bienestar-y-deporte' },
            { title: 'Área Tecnología, Digital y Diseño', image: '/media/dev-priv-0001.jpg', href: '/p/areas/area-tecnologia-digital-y-diseno' },
            { title: 'Área Empresa, Administración y Gestión', image: '/media/mkt-ocup-0001.jpg', href: '/p/areas/area-empresa-administracion-y-gestion' },
            { title: 'Área Seguridad, Vigilancia y Protección', image: '/media/dev-dese-0001.jpg', href: '/p/areas/area-seguridad-vigilancia-y-proteccion' },
          ],
        },
        {
          kind: 'campusList',
          title: 'Nuestras sedes',
          subtitle: 'Conoce nuestras sedes en Tenerife y ven a visitarnos. Te orientamos sobre el curso que mejor encaja contigo.',
          limit: 3,
        },
        {
          kind: 'teamGrid',
          title: 'Equipo docente',
          subtitle: 'Aprende con profesionales especializados que combinan experiencia docente y práctica real en su sector.',
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
          title: 'Hablemos de tu próxima formación',
          subtitle: 'Déjanos tus datos y un asesor de CEP te orientará sobre cursos, ciclos, convocatorias, horarios y opciones de matrícula.',
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
