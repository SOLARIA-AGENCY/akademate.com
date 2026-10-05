import Link from 'next/link'
import { displayCourseTitle } from './course-title'
import {
  cycleDescription,
  cycleFacts,
  cycleHoursLabel,
  cycleHref,
  cycleLevelMeta,
  type CycleCardModel,
} from './cycle-display'

export function CycleCard({ cycle }: { cycle: CycleCardModel }) {
  const href = cycleHref(cycle)
  const level = cycleLevelMeta(cycle.level)
  const facts = cycleFacts(cycle)
  const hours = cycleHoursLabel(cycle)
  const description = cycleDescription(cycle)
  const title = displayCourseTitle(cycle.name) || cycle.name
  const openRuns = (cycle.openRuns || []).slice(0, 3)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative min-h-64 overflow-hidden bg-[#3E091A]">
        {cycle.imageUrl ? (
          <img src={cycle.imageUrl} alt={title} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#3E091A]/85 via-[#3E091A]/25 to-transparent" />
        <div className="absolute left-5 right-5 top-5">
          {level ? (
            <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: level.bgColor }}>
              {level.label}
            </span>
          ) : null}
        </div>
        <div className="absolute bottom-5 left-5 right-5">
          <h2 className="text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">{title}</h2>
          <p className="mt-2 text-sm font-medium text-white/85">Ciclo formativo oficial</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        {description ? <p className="line-clamp-3 text-base leading-7 text-slate-600">{description}</p> : null}
        {facts.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">{fact.label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{fact.value}</p>
                {fact.hint ? <p className="mt-1 text-xs leading-5 text-slate-600">{fact.hint}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
        {openRuns.length ? (
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-[#ecfdf5] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-emerald-900">Convocatorias abiertas</p>
              <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white">
                Matrícula abierta
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {openRuns.map((run) => (
                <Link
                  key={run.href}
                  href={run.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white px-3 py-3 text-sm transition hover:border-emerald-400"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-950">{run.startLabel}</span>
                    {run.campusName ? <span className="mt-0.5 block truncate text-xs text-slate-600">{run.campusName}</span> : null}
                  </span>
                  <span className="shrink-0 font-semibold text-emerald-700">Reservar plaza</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-auto flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          {hours ? <p className="text-sm text-slate-600">{hours}</p> : <span />}
          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-full bg-[#f2014b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d0013f]"
          >
            Ver ciclo
          </Link>
        </div>
      </div>
    </article>
  )
}
