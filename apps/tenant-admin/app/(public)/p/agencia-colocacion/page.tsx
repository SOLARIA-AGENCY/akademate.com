import Link from 'next/link'

const REGISTRATION_URL = 'https://cursostenerife.agenciascolocacion.com/candidatos/registro'

const services = [
  {
    title: 'Registro de candidatos',
    description: 'Alta en la bolsa de empleo para participar en procesos de selección ajustados al perfil profesional.',
  },
  {
    title: 'Orientación laboral',
    description: 'Acompañamiento para enfocar objetivos, mejorar la presentación profesional y preparar el acceso al mercado laboral.',
  },
  {
    title: 'Intermediación con empresas',
    description: 'Conexión entre candidatos formados y oportunidades de empleo vinculadas a las áreas profesionales de CEP Formación.',
  },
]

const roadmap = [
  'Ficha interna de candidato conectada al dashboard CEP.',
  'Seguimiento de estado de inscripción y derivaciones.',
  'Sincronización de ofertas, cursos y perfiles recomendados.',
]

export default function AgenciaColocacionPage() {
  return (
    <div className="bg-white text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 opacity-80" style={{ background: 'radial-gradient(circle at 80% 10%, rgba(242,1,75,0.28), transparent 34%), linear-gradient(135deg, rgba(255,255,255,0.08), transparent 45%)' }} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit rounded-full bg-[#f2014b] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
              Agencia de colocación oficial
            </span>
            <h1 className="mt-6 text-balance text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Tu formación también puede abrirte nuevas oportunidades laborales
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">
              CEP Formación cuenta con agencia de colocación autorizada para acompañar a candidatos y empresas en procesos de inserción laboral.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={REGISTRATION_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#f2014b] px-7 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5">
                Registrarme como candidato
              </a>
              <Link href="/convocatorias" className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-7 text-sm font-black text-slate-950 transition hover:-translate-y-0.5">
                Ver convocatorias
              </Link>
            </div>
          </div>
          <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl">
            <img src="/media/admin-1.jpg" alt="Orientación laboral CEP Formación" className="h-full min-h-[420px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-3xl bg-white/95 p-5 text-slate-950 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f2014b]">Autorización</p>
              <p className="mt-1 text-2xl font-black">0500000212</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Servicio orientado a candidatos, formación e intermediación laboral.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fff7fa]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Cómo te ayuda la bolsa de empleo</h2>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">
            Un punto de apoyo para pasar de la formación a la búsqueda activa, con orientación y acceso a oportunidades vinculadas a perfiles profesionales reales.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {services.map((service) => (
              <article key={service.title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-[#f2014b]">✓</span>
                <h3 className="mt-5 text-xl font-black">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{service.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Integración interna planificada</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              En esta fase mantenemos el registro en la plataforma oficial. La siguiente evolución será integrar la experiencia dentro del ecosistema CEP para centralizar candidatos, ofertas y seguimiento.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
            <ul className="grid gap-4">
              {roadmap.map((item) => (
                <li key={item} className="flex gap-3 text-sm font-semibold leading-7 text-slate-700">
                  <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f2014b] text-xs font-black text-white">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <a href={REGISTRATION_URL} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex min-h-14 items-center justify-center rounded-full bg-[#f2014b] px-6 text-sm font-black text-white">
              Ir al registro oficial
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
