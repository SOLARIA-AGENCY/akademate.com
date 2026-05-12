import Link from 'next/link'
import { BriefcaseBusiness, Building2, CheckCircle2, MapPin, Phone, ShieldCheck, UserRoundSearch } from 'lucide-react'

const CANDIDATE_REGISTRATION_URL = 'https://cursostenerife.agenciascolocacion.com/candidatos/registro'
const CANDIDATE_ACCESS_URL = 'https://cursostenerife.agenciascolocacion.com/candidatos/acceso'
const COMPANY_REGISTRATION_URL = 'https://cursostenerife.agenciascolocacion.com/empresas/registro'
const JOB_OFFERS_URL = 'https://cursostenerife.agenciascolocacion.com/ofertas/'

const candidateSteps = [
  'Registro del perfil profesional y datos de contacto.',
  'Alta de formación, experiencia y ocupaciones de interés.',
  'Valoración de candidaturas para ofertas compatibles.',
  'Orientación para mejorar empleabilidad, CV y entrevista.',
]

const companyServices = [
  'Publicación de ofertas de empleo en el portal de la agencia.',
  'Preselección de candidatos inscritos según el perfil solicitado.',
  'Coordinación con empresas para entrevistas y seguimiento del proceso.',
]

const highlights = [
  {
    icon: ShieldCheck,
    title: 'Agencia autorizada',
    text: 'Servicio vinculado a la Agencia de Colocación 0500000212.',
  },
  {
    icon: UserRoundSearch,
    title: 'Candidatos',
    text: 'Registro externo para completar perfil, formación, experiencia y ocupaciones.',
  },
  {
    icon: Building2,
    title: 'Empresas',
    text: 'Canal para publicar ofertas y localizar perfiles profesionales adecuados.',
  },
]

export default function AgenciaColocacionPage() {
  return (
    <div className="bg-white text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(242,1,75,0.24),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit rounded-full bg-[#f2014b] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
              Empleo CEP Formación
            </span>
            <h1 className="mt-6 text-balance text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Agencia de colocación y bolsa de empleo para candidatos y empresas
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">
              CEP Formación conecta orientación laboral, formación y oportunidades profesionales a través de su agencia de colocación autorizada.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={CANDIDATE_REGISTRATION_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#f2014b] px-7 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5">
                Registrarme como candidato
              </a>
              <a href={JOB_OFFERS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-7 text-sm font-black text-slate-950 transition hover:-translate-y-0.5">
                Ver ofertas activas
              </a>
            </div>
          </div>
          <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl">
            <img src="/media/admin-1.jpg" alt="Orientación laboral y empleabilidad en CEP Formación" className="h-full min-h-[420px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/95 p-5 text-slate-950 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f2014b]">Agencia autorizada</p>
              <p className="mt-1 text-2xl font-black">0500000212</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">ACATEN 2020 S.L · Plaza José Antonio Barrios Olivero s/n, Santa Cruz de Tenerife.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fff7fa]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <Icon className="h-9 w-9 text-[#f2014b]" aria-hidden="true" />
                  <h2 className="mt-5 text-xl font-black">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <article className="rounded-2xl border border-slate-200 p-8 shadow-sm">
            <BriefcaseBusiness className="h-10 w-10 text-[#f2014b]" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-black">Para candidatos</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              El servicio permite registrar tu perfil profesional para participar en procesos de selección, recibir orientación y mejorar tus posibilidades de inserción laboral.
            </p>
            <ul className="mt-6 grid gap-3">
              {candidateSteps.map((step) => (
                <li key={step} className="flex gap-3 text-sm font-semibold leading-7 text-slate-700">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#f2014b]" aria-hidden="true" />
                  {step}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href={CANDIDATE_REGISTRATION_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f2014b] px-6 text-sm font-black text-white">
                Alta de candidato
              </a>
              <a href={CANDIDATE_ACCESS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 px-6 text-sm font-black text-slate-950">
                Acceder a mi perfil
              </a>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 p-8 shadow-sm">
            <Building2 className="h-10 w-10 text-[#f2014b]" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-black">Para empresas</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Las empresas pueden publicar ofertas y solicitar perfiles profesionales para cubrir vacantes con candidatos inscritos en la agencia.
            </p>
            <ul className="mt-6 grid gap-3">
              {companyServices.map((service) => (
                <li key={service} className="flex gap-3 text-sm font-semibold leading-7 text-slate-700">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#f2014b]" aria-hidden="true" />
                  {service}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href={COMPANY_REGISTRATION_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-black text-white">
                Alta de empresa
              </a>
              <a href={JOB_OFFERS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 px-6 text-sm font-black text-slate-950">
                Ver ofertas
              </a>
            </div>
          </article>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-black">Contacto de la agencia</h2>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Para gestiones de la agencia de colocación, usa el portal oficial o contacta con el equipo responsable.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <MapPin className="h-6 w-6 text-[#f2014b]" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold">Plaza José Antonio Barrios Olivero s/n, 38005 Santa Cruz de Tenerife</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Phone className="h-6 w-6 text-[#f2014b]" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold">922 219 257</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <ShieldCheck className="h-6 w-6 text-[#f2014b]" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold">carmen.diaz@cursostenerife.es</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div>
            <h2 className="text-2xl font-black">¿Quieres formarte antes de buscar empleo?</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Revisa convocatorias abiertas y cursos vinculados a sectores con demanda profesional.
            </p>
          </div>
          <Link href="/convocatorias" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f2014b] px-6 text-sm font-black text-white">
            Ver convocatorias abiertas
          </Link>
        </div>
      </section>
    </div>
  )
}
