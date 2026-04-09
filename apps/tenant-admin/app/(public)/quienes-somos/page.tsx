import Link from 'next/link'

const testimonios = [
  {
    texto:
      'Gracias a CEP he conseguido encontrar una estabilidad laboral y una profesión que me gusta y que consigue hacerme llegar todas las noches a casa feliz.',
    nombre: 'Pilar',
    profesion: 'Técnico sup. higiene bucodental',
    imagen: '/website/cep/team/sara.jpg',
  },
  {
    texto:
      'Las prácticas han sido 100% beneficiosas para mi aprendizaje, he conocido gente fantástica y estoy feliz con mi carta de recomendación.',
    nombre: 'Sonia',
    profesion: 'Técnico en odontología',
    imagen: '/website/cep/team/cecilia.jpg',
  },
  {
    texto: 'Feliz porque conseguí trabajo en la farmacia donde realicé las prácticas profesionales.',
    nombre: 'Priscila',
    profesion: 'Auxiliar de farmacia',
    imagen: '/website/cep/team/esther.jpg',
  },
  {
    texto: 'Agradecida de la docente que me tocó, no pude tener un mejor ejemplo.',
    nombre: 'Jennifer',
    profesion: 'Auxiliar de odontología',
    imagen: '/website/cep/team/nuria.jpg',
  },
]

const fundadores = [
  {
    nombre: 'Fran de Amo Olivier',
    cargo: 'Director y Fundador',
    descripcion:
      'Séptima generación dedicada a la docencia. Impulsor del proyecto educativo CEP con más de 25 años de experiencia en formación profesional.',
    imagen: '/website/cep/team/luis.jpg',
  },
  {
    nombre: 'Carol de Amo Olivier',
    cargo: 'Directora y Co-fundadora',
    descripcion:
      'Especialista en metodologías innovadoras y desarrollo curricular. Lidera la implementación de valores educativos holísticos.',
    imagen: '/website/cep/team/livia.jpg',
  },
]

const valores = [
  'Respeto hacia nuestro alumnado.',
  'Compromiso de mejora continua.',
  'Vocación docente.',
  'Honestidad y transparencia.',
  'Escucha activa.',
  'Creatividad.',
  'Empatía.',
  'Innovación.',
  'Profesionalidad.',
]

const ongs = ['ADEPAC', 'ADDANCA', 'SOS Felina', 'Valle Colino', 'Sonrisas Canarias', 'Caretta Caretta']

export const dynamic = 'force-dynamic'

export default function QuienesSomosPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-r from-[#f2014b] to-[#ff4f84] py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h1 className="text-4xl font-bold sm:text-5xl">Nosotros</h1>
            <p className="mt-6 max-w-2xl text-lg text-white/95">
              Una empresa familiar dedicada a la enseñanza durante 7 generaciones, comprometida con el desarrollo personal y profesional del alumnado.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold">25+</p>
                <p className="text-sm text-white/85">Años de experiencia</p>
              </div>
              <div>
                <p className="text-3xl font-bold">7</p>
                <p className="text-sm text-white/85">Generaciones</p>
              </div>
              <div>
                <p className="text-3xl font-bold">1000+</p>
                <p className="text-sm text-white/85">Alumnos titulados</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl bg-white/95 p-8 shadow-2xl">
            <img src="/logos/cep-formacion-logo.png" alt="CEP Formación" className="mx-auto h-24 w-auto object-contain sm:h-28" />
            <p className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#f2014b]">
              Centro de Enseñanzas Profesionales
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-[#f2014b]">Nuestros Fundadores</h2>
          <p className="mt-3 text-center text-slate-600">Fran y Carol de Amo Olivier, séptima generación dedicada a la docencia.</p>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {fundadores.map((fundador) => (
              <article key={fundador.nombre} className="rounded-3xl bg-white p-7 shadow-sm">
                <div className="flex items-center gap-5">
                  <img src={fundador.imagen} alt={fundador.nombre} className="h-20 w-20 rounded-full object-cover ring-4 ring-[#f2014b]/20" />
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{fundador.nombre}</h3>
                    <p className="text-sm font-semibold text-[#f2014b]">{fundador.cargo}</p>
                  </div>
                </div>
                <p className="mt-5 text-slate-700">{fundador.descripcion}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-3xl font-bold text-[#f2014b]">Nuestra Historia</h2>
            <div className="mt-5 space-y-4 text-slate-700">
              <p>
                CEP Santa Cruz es una empresa familiar (Fran y Carol de Amo Olivier) rodeada de un magnífico equipo profesional. Llevamos la enseñanza en el ADN y somos la séptima generación dedicada a la docencia.
              </p>
              <p>
                En 1998, con 1% capital y 99% ilusión, nació CEP Orotava. En 2010 abrimos CEP Santa Cruz y en 2017 nos mudamos a las instalaciones actuales, siendo reconocidos para impartir el ciclo superior de Higiene Bucodental.
              </p>
              <p>
                Nuestra base es una formación práctica, humana y conectada con las necesidades reales del entorno laboral de Tenerife.
              </p>
            </div>
          </div>
          <div className="rounded-3xl bg-[#fff0f6] p-8">
            <h3 className="text-xl font-bold text-slate-900">Visión y Misión</h3>
            <ul className="mt-5 space-y-3 text-slate-700">
              <li>Contribuir al desarrollo de capacidades y competencias profesionales con impacto real.</li>
              <li>Promover igualdad, responsabilidad social y conciencia medioambiental.</li>
              <li>Consolidarnos como centro de referencia con proyectos innovadores y orientados al empleo.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-[#f2014b]">Nuestros Valores</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {valores.map((valor) => (
              <div key={valor} className="rounded-2xl bg-white p-5 text-sm font-medium text-slate-700 shadow-sm">
                {valor}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-[#f2014b]">Colaboramos con ONG&apos;s Canarias</h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-slate-600">
            Colaboramos durante todo el año para reforzar el compromiso social y ambiental en nuestro entorno.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {ongs.map((ong) => (
              <span key={ong} className="rounded-full bg-gradient-to-r from-[#f2014b] to-[#ff4f84] px-5 py-2 text-sm font-semibold text-white">
                {ong}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-[#f2014b]">La Opinión de Nuestros Alumnos</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {testimonios.map((testimonio) => (
              <article key={testimonio.nombre} className="rounded-3xl border-t-4 border-[#f2014b] bg-white p-6 text-center shadow-sm">
                <img src={testimonio.imagen} alt={testimonio.nombre} className="mx-auto h-20 w-20 rounded-full object-cover ring-4 ring-[#f2014b]/20" />
                <p className="mt-4 text-sm italic text-slate-700">&quot;{testimonio.texto}&quot;</p>
                <p className="mt-4 font-bold text-[#f2014b]">{testimonio.nombre}</p>
                <p className="text-xs text-slate-600">{testimonio.profesion}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#f2014b] to-[#ff4f84] py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">¿Quieres formar parte de nuestra familia educativa?</h2>
          <p className="mt-4 text-lg text-white/95">Descubre cómo podemos ayudarte a alcanzar tus metas profesionales.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/cursos" className="rounded-full bg-white px-8 py-3 text-sm font-bold text-[#f2014b] transition hover:bg-slate-100">
              Ver Todos los Cursos
            </Link>
            <Link href="/contacto" className="rounded-full border-2 border-white px-8 py-3 text-sm font-bold text-white transition hover:bg-white hover:text-[#f2014b]">
              Contactar Ahora
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
