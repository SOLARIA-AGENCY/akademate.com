import Link from 'next/link'
import { ArrowRight, BriefcaseBusiness, Building2 } from 'lucide-react'
import { PublicPageHero } from '../../_components/PublicPageHero'
import { CEP_PUBLIC_HERO_ASSETS } from '../../_components/public-hero-assets'
import { SYNTHETIC_PLACEMENT_AGENCIES } from '@/src/domain/placement-agency'

export default function AgenciaColocacionPage() {
  return (
    <div className="bg-white text-slate-950">
      <PublicPageHero
        eyebrow="Empleo"
        title="Agencia de colocación"
        description="Talento y empresas, en la sede que te queda cerca."
        imageSrc={CEP_PUBLIC_HERO_ASSETS.agencia}
        imageAlt="Atención profesional en una agencia de colocación"
      />

      <section className="bg-[#fff7fa] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Elige tu sede</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Tres agencias. El mismo servicio. De 11:00 a 16:00.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {SYNTHETIC_PLACEMENT_AGENCIES.map((agency) => (
              <Link
                key={agency.slug}
                href={`/p/agencia-colocacion/${agency.slug}`}
                className="group flex flex-col rounded-[1.6rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:border-[#f2014b]/40 hover:shadow-lg"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2014b]">
                  Agencia autorizada 0500000212
                </p>
                <h3 className="mt-4 text-2xl font-black">{agency.campusLabel}</h3>
                <p className="mt-2 text-sm font-semibold text-slate-600">{agency.hoursLabel}</p>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-black text-[#f2014b]">
                  Entrar
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <article className="rounded-[1.6rem] bg-slate-950 p-8 text-white">
            <BriefcaseBusiness className="h-9 w-9 text-[#f2014b]" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-black">Candidatos</h2>
            <p className="mt-4 text-base leading-7 text-white/75">
              Presenta tu perfil, recibe orientación y entra en procesos abiertos.
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-slate-200 p-8">
            <Building2 className="h-9 w-9 text-[#f2014b]" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-black">Empresas</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Publica la vacante y recibe candidatos preseleccionados.
            </p>
          </article>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <h2 className="text-2xl font-black">Formación con salida laboral</h2>
          <Link
            href="/convocatorias"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f2014b] px-6 text-sm font-black text-white hover:bg-[#d0013f]"
          >
            Ver convocatorias
          </Link>
        </div>
      </section>
    </div>
  )
}
