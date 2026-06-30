import Link from 'next/link'

const scholarshipProfiles = [
  'Dificultades económicas acreditadas.',
  'Situación de desempleo o precariedad laboral.',
  'Personas con discapacidad.',
  'Familias monoparentales.',
  'Víctimas de violencia de género.',
  'Personas jóvenes con especiales dificultades de acceso a la formación.',
  'Personas en riesgo de exclusión social.',
  'Otras circunstancias personales, familiares o sociales valoradas por APROEM.',
]

const aidTypes = [
  {
    title: 'Becas completas',
    body: 'Cubren el 100% del importe del curso o formación cuando la situación lo justifica y existe disponibilidad.',
  },
  {
    title: 'Becas parciales',
    body: 'Cubren un porcentaje del importe del curso según la valoración individual de cada caso.',
  },
  {
    title: 'Descuentos sociales',
    body: 'Ayudas orientadas a facilitar el acceso a la formación en situaciones personales, familiares o económicas sensibles.',
  },
  {
    title: 'Ayudas extraordinarias',
    body: 'Respuestas específicas para situaciones excepcionales que requieren una valoración personalizada.',
  },
]

const processSteps = [
  {
    title: 'Infórmate',
    body: 'Consulta las becas y ayudas disponibles.',
  },
  {
    title: 'Cumplimenta la solicitud',
    body: 'Rellena el formulario con tus datos personales y la formación en la que tienes interés.',
  },
  {
    title: 'Prepara la documentación',
    body: 'Reúne la documentación económica, familiar, laboral o social que permita valorar tu caso.',
  },
  {
    title: 'Envía tu solicitud',
    body: 'Remite la solicitud a APROEM o a CEP Formación, según el canal indicado.',
  },
  {
    title: 'Valoración confidencial',
    body: 'La comisión estudia cada caso de forma individual, confidencial y respetuosa.',
  },
  {
    title: 'Resolución',
    body: 'Recibirás una respuesta con la resolución y, si procede, las condiciones de la ayuda concedida.',
  },
]

const values = [
  'Compromiso social',
  'Igualdad de oportunidades',
  'Inclusión',
  'Empleabilidad',
  'Excelencia',
  'Transparencia',
  'Cercanía',
  'Colaboración',
]

const impactStats = [
  { value: '235', label: 'acciones sociales en 2025' },
  { value: '32', label: 'becas y descuentos sociales en 2025' },
  { value: '+43%', label: 'crecimiento en acciones sociales 2022-2025' },
  { value: '12+', label: 'ODS de la ONU trabajados' },
]

const socialEvolution = [
  { year: '2022', actions: 164 },
  { year: '2023', actions: 188 },
  { year: '2024', actions: 205 },
  { year: '2025', actions: 235 },
]

const impulsaModules = [
  {
    title: 'Lo que nadie te cuenta sobre las prácticas',
    body: 'Preparación realista para afrontar el primer contacto con el entorno profesional.',
  },
  {
    title: 'No te lo tomes como algo personal',
    body: 'Herramientas para interpretar críticas, correcciones y situaciones difíciles desde una mirada constructiva.',
  },
  {
    title: 'Gestión emocional y estrés',
    body: 'Recursos para mantener la calma, regular la presión y actuar con mayor seguridad.',
  },
  {
    title: 'Comunicación asertiva',
    body: 'Claves para expresarse con claridad, respeto y profesionalidad.',
  },
  {
    title: 'Mentalidad profesional',
    body: 'Actitud, responsabilidad y compromiso como base para crecer en el mundo laboral.',
  },
]

export const metadata = {
  title: 'APROEM | Becas y acción social en CEP Formación',
  description:
    'Programa de Becas APROEM, Programa Impulsa y acciones sociales para facilitar el acceso a la formación profesional.',
}

export const dynamic = 'force-dynamic'

export default function AproemPage() {
  return (
    <main className="bg-white text-slate-950">
      <section className="relative overflow-hidden bg-[#fff7fa]">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[#f2014b]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-55" aria-hidden="true">
          <img
            src="/website/cep/aproem/aproem-hero.jpg"
            alt=""
            className="h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#fff7fa] via-[#fff7fa]/92 to-[#fff7fa]/54" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center rounded-[2rem] bg-white/72 p-6 shadow-sm backdrop-blur-sm sm:p-8">
            <p className="w-fit rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#f2014b] shadow-sm">
              Asociación profesional
            </p>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              APROEM
            </h1>
            <p className="mt-4 max-w-2xl text-xl font-bold text-slate-800">
              Creemos en el talento. Apostamos por las personas.
            </p>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
              En APROEM creemos que ninguna persona debería renunciar a su formación por motivos
              económicos, personales o sociales. Por eso impulsamos un programa de becas,
              descuentos sociales y acciones de acompañamiento orientado a abrir puertas, fortalecer
              procesos personales y transformar oportunidades en proyectos de vida.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:becas@aproem.es"
                className="inline-flex items-center justify-center rounded-full bg-[#f2014b] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#d0013f]"
              >
                Solicitar información
              </a>
              <a
                href="tel:+34952200065"
                className="inline-flex items-center justify-center rounded-full border border-[#f2014b]/25 bg-white px-6 py-3 text-sm font-black text-[#f2014b] shadow-sm transition hover:bg-[#ffe8f0]"
              >
                Hablar con APROEM
              </a>
            </div>
            <p className="mt-4 text-sm font-bold text-slate-600">
              becas@aproem.es · 952 20 00 65
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#f2014b]/15 bg-white/88 p-6 shadow-sm backdrop-blur-sm">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-[#f2014b]">
              Impacto social en 2025
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {impactStats.map((stat) => (
                <div key={stat.label} className="rounded-3xl bg-[#fff7fa] p-5">
                  <p className="text-3xl font-black text-[#f2014b]">{stat.value}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-3xl bg-slate-950 p-6 text-white">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-white/60">
                Compromiso social
              </p>
              <p className="mt-3 text-xl font-black">
                Formamos profesionales. Transformamos personas.
              </p>
              <p className="mt-3 text-sm leading-6 text-white/75">
                Trabajamos para que el talento no quede limitado por la falta de recursos y para que
                cada persona pueda crecer con acompañamiento real.
              </p>
            </div>
            <p className="mt-4 text-xs font-semibold text-slate-500">
              Datos internos APROEM / CEP Formación. Periodo 2022-2025.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">Qué es APROEM</h2>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                APROEM es la Asociación para el Fomento de las Enseñanzas Profesionales y la
                Orientación Profesional para el Empleo. Nace para promover formación, orientación,
                empleabilidad, igualdad de oportunidades y compromiso social.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">Misión</h2>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                Generar oportunidades reales a través de la formación, la orientación profesional, la
                educación emocional y proyectos de impacto social.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">Visión</h2>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                Ser una entidad de referencia en empleabilidad, desarrollo personal y transformación
                social, contribuyendo a una sociedad más justa, inclusiva y sostenible.
              </p>
            </article>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {values.map((value) => (
              <span
                key={value}
                className="rounded-full border border-[#f2014b]/20 bg-[#fff7fa] px-4 py-2 text-sm font-bold text-slate-800"
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2014b]">Becas APROEM</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              Ayudas para que ninguna persona renuncie a formarse
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-700">
              Las becas APROEM están dirigidas a personas que desean formarse y que, por
              circunstancias económicas, familiares, laborales o sociales, necesitan apoyo para
              acceder a una oportunidad formativa.
            </p>
            <p className="mt-3 text-base leading-8 text-slate-700">
              Cada solicitud se estudia de forma individualizada. La concesión de becas y descuentos
              estará sujeta a valoración interna, disponibilidad presupuestaria y cumplimiento de
              los criterios establecidos por APROEM.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h3 className="text-xl font-black text-slate-950">Quién puede solicitar una beca</h3>
              <ul className="mt-5 grid gap-3">
                {scholarshipProfiles.map((profile) => (
                  <li key={profile} className="flex gap-3 text-sm font-semibold leading-6 text-slate-700">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#f2014b]" aria-hidden="true" />
                    {profile}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {aidTypes.map((type) => (
                <article key={type.title} className="rounded-3xl border border-[#f2014b]/15 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-black text-[#f2014b]">{type.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{type.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-950">Cómo solicitar una beca</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {processSteps.map((step, index) => (
                <div key={step.title} className="rounded-2xl bg-[#fff7fa] p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2014b] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <h4 className="mt-4 text-sm font-black text-slate-950">{step.title}</h4>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2014b]">
              Programa Impulsa
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              Competencias emocionales para incorporarte al mundo laboral con seguridad
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-700">
              El Programa Impulsa es un taller gratuito de 3 horas, financiado por APROEM y dirigido
              al alumnado de CEP Formación. Es una formación transversal orientada a preparar al
              alumnado para afrontar sus prácticas y su futuro profesional con más confianza,
              equilibrio emocional y seguridad personal.
            </p>
            <div className="mt-6 rounded-3xl bg-slate-950 p-6 text-white">
              <p className="text-sm font-semibold text-white/70">Impartido por</p>
              <p className="mt-2 text-xl font-black">Carolina del Amo Olivier</p>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Directora General de CEP Formación, terapeuta transpersonal y especialista en
                inteligencia emocional y desarrollo personal.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {impulsaModules.map((module, index) => (
              <article key={module.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffe8f0] text-sm font-black text-[#f2014b]">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-black text-slate-950">{module.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{module.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fff7fa] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2014b]">
                Impacto social
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
                Acciones sociales 2022-2025
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-700">
                El crecimiento de APROEM refleja una apuesta sostenida por la formación, la
                empleabilidad, la acción social, el bienestar animal y la igualdad de oportunidades.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {socialEvolution.map((entry) => (
                <div key={entry.year} className="rounded-3xl bg-white p-5 text-center shadow-sm">
                  <p className="text-sm font-black text-slate-500">{entry.year}</p>
                  <p className="mt-2 text-3xl font-black text-[#f2014b]">{entry.actions}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">acciones</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <img
              src="/website/cep/aproem/premios-nacionales-educacion-aproem.jpeg"
              alt="Reconocimiento de APROEM y CEP Formación en los Premios Nacionales de Educación"
              className="h-full max-h-[560px] w-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2014b]">
              Premios Nacionales de Educación
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              Una mención que reconoce el valor de acompañar procesos reales
            </h2>
            <div className="mt-6 space-y-4 text-base leading-8 text-slate-700">
              <p>
                La Mención Honorífica y el 4.º puesto en la categoría de Fomento de los Aprendizajes
                Esenciales en los Premios Nacionales de Educación representan un reconocimiento al
                trabajo desarrollado por APROEM y CEP Formación en favor de la formación, la
                empleabilidad y el acompañamiento de las personas.
              </p>
              <p>
                Después de más de 28 años de trayectoria, CEP Formación ha aprendido que la
                excelencia consiste en enamorarse de los procesos, mejorar cada día y acompañar a las
                personas para que puedan vivir transformaciones reales y sostenibles.
              </p>
              <p>
                Este reconocimiento fue recibido en los Premios Nacionales de Educación celebrados en
                Madrid.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">Tu apoyo suma</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            En APROEM no solo concedemos becas. Creamos oportunidades.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-white/75">
            Cada solicitud representa una historia personal y será tratada con respeto,
            confidencialidad y sensibilidad. Si necesitas orientación, podemos ayudarte a revisar tu
            caso.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="mailto:becas@aproem.es"
              className="inline-flex items-center justify-center rounded-full bg-[#f2014b] px-6 py-3 text-sm font-black text-white transition hover:bg-[#d0013f]"
            >
              becas@aproem.es
            </a>
            <a
              href="tel:+34952200065"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
            >
              952 20 00 65
            </a>
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
            >
              Contactar con CEP
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
