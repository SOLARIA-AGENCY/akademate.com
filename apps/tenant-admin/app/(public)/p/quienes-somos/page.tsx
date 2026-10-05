import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quiénes somos | CEP Formación',
  description:
    'CEP Formación es una empresa familiar en Tenerife, séptima generación dedicada a la docencia. Tres campus, ciclos oficiales, cursos y prácticas en empresa.',
}

export const dynamic = 'force-dynamic'

const history = [
  'El abuelo materno, maestro de escuela nacional, participó en las Misiones Pedagógicas. La abuela materna recorría caminos en bicicleta para enseñar corte y confección. En 1981, su madre abrió el primer CEP, Centro de Enseñanzas Profesionales, en una localidad de la península.',
  'En 1998 abrieron CEP Norte en La Orotava, con diez alumnos. El objetivo era colaborar en el desarrollo personal y profesional de quien eligiera el centro: en muchos casos, mujeres que habían quedado fuera del sistema educativo o habían dejado la vida profesional por la familiar.',
  'Ver cómo cambiaban aquellas vidas impulsó la apertura de CEP Santa Cruz en 2010, primero en un local pequeño. En 2017 se mudaron a las instalaciones actuales y el Ministerio de Educación reconoció al centro para impartir el ciclo superior de Higiene Bucodental.',
  'Hoy mantenemos ciclos formativos oficiales, cursos privados, formación para ocupados y desempleados, formación bonificada para empresas (FUNDAE) y talleres de inserción laboral. Seguimos siendo los mismos: sin perder de vista quiénes somos, por qué y para quién estamos.',
]

const milestones = [
  { year: '1981', text: 'Primer CEP en la península' },
  { year: '1998', text: 'CEP Norte abre en La Orotava, con diez alumnos' },
  { year: '2010', text: 'Abre CEP Santa Cruz' },
  { year: '2017', text: 'Sede actual y ciclo superior de Higiene Bucodental' },
  { year: 'Hoy', text: 'Tres campus en Tenerife, ciclos, cursos y agencia de colocación' },
]

const vision = [
  'Contribuir a las capacidades y competencias de cada alumno para afrontar el trabajo y la vida con una formación íntegra.',
  'Promover la igualdad de género en Tenerife.',
  'Colaborar en la educación de la responsabilidad social y medioambiental en la isla.',
  'Dar visibilidad a la realidad animal y ambiental de Tenerife.',
]

const values = [
  {
    title: 'Personas, respeto e inclusión',
    text: 'El alumnado y el equipo están en el centro. Atendemos necesidades educativas específicas y no admitimos discriminación.',
  },
  {
    title: 'Formación con valor social',
    text: 'Entendemos la enseñanza como una herramienta de transformación, con ética, empatía y responsabilidad.',
  },
  {
    title: 'Honestidad y transparencia',
    text: 'Coherencia entre lo que prometemos y lo que hacemos, también en la información y las condiciones de cada curso.',
  },
  {
    title: 'Mejora continua',
    text: 'El equipo se actualiza y el centro corrige a partir de la experiencia, el entorno laboral y la demanda social.',
  },
  {
    title: 'Innovación en el aula',
    text: 'Metodologías activas, tecnologías y creatividad al servicio del aprendizaje, no como decorado.',
  },
  {
    title: 'Responsabilidad social',
    text: 'Sostenibilidad, inclusión, conciliación y respeto al entorno forman parte del proyecto, no de un anexo.',
  },
]

const method = [
  'El docente observa al grupo, ajusta el ritmo al cronograma y no aplica el mismo molde a todas las aulas.',
  'Hay actividades de educación emocional y comunicación: exposiciones, debates, trabajo en equipo y resolución de conflictos.',
  'Las nuevas tecnologías entran en clase cuando aportan: ordenador, gamificación o realidad virtual para aprender de forma más clara.',
  'Durante el curso intervienen ONG o alumnado de otras formaciones sobre igualdad, pobreza, abandono animal o medioambiente en Canarias.',
  'Las jornadas de puertas abiertas relacionan distintas formaciones, visibilizan entidades sociales y ofrecen talleres y charlas abiertas.',
  'La práctica es pieza central: material en el aula y prácticas en empresa, también en la modalidad online.',
  'En ciclos y certificados de profesionalidad la evaluación sigue las pautas de la Consejería de Educación y del Servicio Canario de Empleo. En la formación no reglada la evaluación es continua, con más peso de la práctica, la actitud y la evolución en empresa.',
]

const quotes = [
  {
    text: 'Gracias a CEP he conseguido una estabilidad laboral y una profesión que me gusta, y con la que llego a casa feliz.',
    name: 'Pilar',
    course: 'Higiene bucodental',
  },
  {
    text: 'Las prácticas fueron beneficiosas para mi aprendizaje. Conocí gente fantástica y salí con una carta de recomendación.',
    name: 'Sonia',
    course: 'Técnico en odontología',
  },
  {
    text: 'Conseguí trabajo en la farmacia donde hice las prácticas profesionales.',
    name: 'Priscila',
    course: 'Auxiliar de farmacia',
  },
  {
    text: 'Agradecida a la docente que me tocó. No pude tener un mejor ejemplo.',
    name: 'Jennifer',
    course: 'Auxiliar de odontología',
  },
]

const campuses = [
  {
    name: 'CEP Santa Cruz',
    href: '/p/sedes/sede-santa-cruz',
    image: '/images/sedes/sede-cep-santa-cruz.png',
    text: 'Plaza José Antonio Barrios Olivero, Bajo Estadio Heliodoro, 38005 Santa Cruz de Tenerife.',
  },
  {
    name: 'CEP Norte',
    href: '/p/sedes/sede-norte',
    image: '/images/sedes/sede-cep-norte.png',
    text: 'Molinos de Gofio 2, C.C. El Trompo, última planta, 38312 La Orotava.',
  },
  {
    name: 'CEP Sur',
    href: '/p/sedes/cep-sur',
    image: '/images/sedes/sede-cep-sur.png',
    text: 'Calle Arguayoda 3, 38611 San Isidro, Tenerife.',
  },
]

export default function QuienesSomosPage() {
  return (
    <div data-cep-about="1" className="bg-white text-slate-950">
      <section className="relative overflow-hidden bg-[#3E091A] py-16 sm:py-20">
        <img
          src="/media/cep-formacion-tenerife-hero.webp"
          alt="Alumnado de CEP Formación en Tenerife"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#3E091A]/92 via-[#3E091A]/55 to-[#3E091A]/20" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-white">Empresa familiar en Tenerife</p>
          <h1 className="mt-3 max-w-[18ch] text-3xl font-semibold text-white sm:text-5xl">Quiénes somos</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white sm:text-lg">
            CEP Formación es una empresa familiar de Fran y Carol de Amo Olivier, con un equipo docente a su alrededor.
            Llevamos la enseñanza en el ADN: somos la séptima generación dedicada a la docencia.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.25fr_.8fr] lg:px-8">
          <article>
            <h2 className="text-2xl font-semibold sm:text-3xl">Nuestra historia</h2>
            {history.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="mt-4 text-base leading-7 text-slate-600">
                {paragraph}
              </p>
            ))}
          </article>
          <ol className="border border-slate-200 bg-white px-5 py-5">
            {milestones.map((item) => (
              <li key={item.year} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 border-b border-slate-100 py-3 text-sm leading-6 text-slate-700 last:border-b-0 last:pb-0">
                <strong className="font-semibold text-[#f2014b]">{item.year}</strong>
                <span>{item.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="reconocimiento" className="border-y border-orange-100 bg-orange-50/70 py-14 sm:py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[12rem_minmax(0,1fr)] lg:px-8">
          <img
            src="/website/cep/recognition/mencion-honorifica-premios-nacionales-educacion-2026.png"
            alt="Mención Honorífica en los I Premios Nacionales de Educación 2026"
            className="mx-auto h-auto w-44 rounded-full bg-white p-3"
            loading="lazy"
          />
          <div>
            <p className="text-sm font-semibold text-[#f2014b]">Reconocimiento nacional</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Mención Honorífica en los I Premios Nacionales de Educación 2026
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              La distinción corresponde a la categoría indicada en el emblema oficial: Promoción del aprendizaje esencial.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">Visión</h2>
            <ul className="mt-4 space-y-3 text-base leading-7 text-slate-600">
              {vision.map((item) => (
                <li key={item} className="pl-4 relative before:absolute before:left-0 before:top-[0.7em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#f2014b]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">Misión</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Consolidarnos como un centro de referencia impulsando proyectos educativos alineados con las empresas, el entorno social y el medioambiente, y potenciando valores y capacidades que sumen al crecimiento personal, profesional y a la sostenibilidad de nuestro entorno.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold sm:text-3xl">Valores</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <article key={value.title} className="border border-slate-200 bg-white p-5">
                <h3 className="text-base font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{value.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold sm:text-3xl">Metodología</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Partimos de la persona como un ser completo, con inteligencias múltiples. En el aula se acompaña para que cada alumno desarrolle sus potencialidades, con valores transversales: respeto, igualdad, solidaridad humana y animal, y cuidado del medioambiente.
          </p>
          <ul className="mt-5 max-w-3xl space-y-3 text-base leading-7 text-slate-600">
            {method.map((item) => (
              <li key={item} className="relative pl-4 before:absolute before:left-0 before:top-[0.7em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#f2014b]">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-lg font-semibold leading-7 text-[#3E091A]">
            Educar la mente sin educar el corazón no es educar en absoluto.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold sm:text-3xl">Compromiso con el entorno</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Durante el año colaboramos con entidades canarias. Entre ellas: ADEPAC, ADDANCA, SOS felina, Valle Colino, Sonrisas Canarias y Caretta Caretta.
          </p>
        </div>
      </section>

      <section className="bg-slate-50 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold sm:text-3xl">La opinión del alumnado</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {quotes.map((quote) => (
              <article key={quote.name} className="border border-[#eadadd] bg-white p-5">
                <p className="text-base leading-7 text-slate-700">«{quote.text}»</p>
                <p className="mt-4 text-sm font-semibold text-[#3E091A]">
                  {quote.name} · {quote.course}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold sm:text-3xl">Campus en Tenerife</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">Tres centros propios, con el mismo proyecto y atención cercana.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {campuses.map((campus) => (
              <a key={campus.name} href={campus.href} className="flex h-full flex-col overflow-hidden border border-slate-200 bg-white text-inherit no-underline">
                <img src={campus.image} alt={campus.name} className="h-44 w-full object-cover" loading="lazy" />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-semibold">{campus.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{campus.text}</p>
                  <span className="mt-auto pt-4 text-sm font-semibold text-[#f2014b]">Ver sede</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#3E091A] py-14 text-white sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold sm:text-3xl">¿Quieres estudiar con CEP Formación?</h2>
          <p className="mt-4 text-base leading-7 text-white/90">
            Te orientamos sobre el itinerario que encaja con tu perfil y con las fechas abiertas.
          </p>
          <a
            href="/p/contacto"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#f2014b] px-5 text-sm font-semibold text-white"
          >
            Pedir información
          </a>
        </div>
      </section>
    </div>
  )
}
