import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quiénes somos | CEP Formación',
  description:
    'Conoce CEP Formación: más de 25 años de experiencia en Tenerife, formación orientada a la empleabilidad y compromiso con la calidad.',
}

export const dynamic = 'force-dynamic'

const certifications = [
  'Centro de formación profesional con más de 25 años de trayectoria en Tenerife.',
  'Sistema de gestión certificado por LRQA en ISO 9001 e ISO 14001.',
  'Programas cofinanciados por Fondo Social Europeo y Servicio Canario de Empleo.',
]

const values = [
  {
    title: 'Empleabilidad real',
    text: 'Diseñamos itinerarios formativos orientados a incorporarte al mercado laboral con competencias prácticas.',
  },
  {
    title: 'Docencia cercana',
    text: 'Acompañamiento continuo, tutorías y seguimiento personalizado para que avances con seguridad.',
  },
  {
    title: 'Conexión local',
    text: 'Presencia en Tenerife con dos sedes activas y relación directa con el tejido empresarial de Canarias.',
  },
]

const campuses = [
  {
    name: 'Sede Santa Cruz',
    image: '/images/sedes/sede-cep-santa-cruz.png',
    description:
      'Nuestra sede de Santa Cruz está situada en el Bajo Estadio Heliodoro Rodríguez López, en el corazón de la capital. Instalaciones modernas con aulas equipadas para la formación sanitaria práctica.',
  },
  {
    name: 'Sede Norte – La Orotava',
    image: '/images/sedes/sede-cep-norte.png',
    description:
      'La sede Norte se encuentra en el Centro Comercial El Trompo, en La Orotava, en la última planta. Una ubicación estratégica para estudiantes del norte de Tenerife, con parking y acceso cómodo.',
  },
]

export default function QuienesSomosPage() {
  return (
    <div className="bg-white text-gray-900">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#111827_0%,#1f2937_55%,#374151_100%)] py-16 sm:py-20">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_top_left,#e3003a,transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              CEP Formación
            </p>
            <h1 className="mt-4 text-3xl font-bold text-white sm:text-5xl">
              Formación profesional con propósito y trayectoria en Tenerife
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/85 sm:text-lg">
              En CEP Formación llevamos más de dos décadas formando profesionales para sectores con alta demanda.
              Combinamos metodología práctica, equipo docente especializado y conexión directa con la realidad laboral de Canarias.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:px-8">
          <article>
            <h2 className="text-2xl font-bold sm:text-3xl">Nuestra historia</h2>
            <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
              CEP Formación nace con una visión clara: ofrecer formación útil, actualizada y orientada a resultados profesionales.
              Desde entonces, hemos acompañado a miles de alumnos en su proceso de capacitación y mejora laboral, manteniendo una relación cercana con empresas e instituciones del entorno.
            </p>
            <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
              Nuestro modelo combina ciclos formativos oficiales, cursos de especialización y programas subvencionados.
              La prioridad es siempre la misma: que cada alumno salga preparado para trabajar.
            </p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
            <h3 className="text-lg font-semibold">Compromisos CEP</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              {certifications.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#e3003a]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="bg-gray-50 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Cómo trabajamos</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {values.map((value) => (
              <article key={value.title} className="rounded-xl border bg-white p-5">
                <h3 className="text-base font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{value.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Nuestras sedes</h2>
          <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-gray-600 sm:text-base">
            Dos centros en Tenerife con atención académica personalizada, instalaciones propias y equipo docente especializado.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {campuses.map((campus) => (
              <article key={campus.name} className="overflow-hidden rounded-2xl border bg-white">
                <img
                  src={campus.image}
                  alt={campus.name}
                  className="h-56 w-full object-cover"
                  loading="lazy"
                />
                <div className="p-5">
                  <h3 className="text-lg font-semibold">{campus.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{campus.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(135deg,#111827_0%,#1f2937_55%,#374151_100%)] py-14 text-white sm:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">¿Quieres estudiar con CEP Formación?</h2>
          <p className="mt-3 text-sm text-white/85 sm:text-base">
            Te ayudamos a elegir el itinerario adecuado según tu perfil y tus objetivos profesionales.
          </p>
          <a
            href="/contacto"
            className="mt-6 inline-flex rounded-lg bg-[#e3003a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#c70034]"
          >
            Contactar con admisiones
          </a>
        </div>
      </section>
    </div>
  )
}

