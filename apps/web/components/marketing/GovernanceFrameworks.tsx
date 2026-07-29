import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { governanceFrameworks } from '@/lib/marketing-content'

export function GovernanceFrameworks() {
  return (
    <section aria-labelledby="governance-title" className="bg-[#eff5ff] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="section-kicker">Privacy, security & AI governance</p>
            <h2 id="governance-title" className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.04em] text-[#071633] sm:text-5xl">
              Trust is an operating discipline.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            Akademate helps teams organise the controls, visibility and human oversight that responsible academy operations demand.
          </p>
        </div>

        <div className="mt-12 grid border-y border-blue-200 md:grid-cols-5">
          {governanceFrameworks.map((framework) => (
            <article key={framework.short} className="border-b border-blue-200 py-7 md:border-b-0 md:border-r md:px-5 first:md:pl-0 last:md:border-r-0">
              <p className="text-sm font-bold text-blue-700">{framework.short}</p>
              <h3 className="mt-4 font-semibold text-[#071633]">{framework.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{framework.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>Reference frameworks for operational alignment. No certification or official endorsement is implied.</p>
          <Link href="/legal/ia" className="inline-flex min-h-11 items-center gap-2 font-semibold text-blue-700 hover:text-blue-900">
            Read our AI transparency information <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
