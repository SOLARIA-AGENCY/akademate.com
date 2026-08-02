'use client'

import Image from 'next/image'
import { BarChart3, CalendarDays, CheckCircle2, MapPin, UsersRound } from 'lucide-react'
import { useLocale } from '@/components/i18n/locale-provider'
import { getHomeExperienceContent } from '@/lib/home-experience-i18n'

export function AcademyOperationsStory() {
  const locale = useLocale()
  const { operations } = getHomeExperienceContent(locale)
  return (
    <section
      data-testid="academy-operations-story"
      className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">{operations.eyebrow}</p>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              {operations.title}
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">{operations.description}</p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-[#071633] shadow-[0_28px_80px_rgba(7,22,51,.16)]">
          <div className="grid lg:grid-cols-[.38fr_.62fr]">
            <div className="relative min-h-[320px] lg:min-h-[620px]">
              <Image
                src="/images/marketing/home-modules/growth-admissions.jpg"
                alt={operations.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 38vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071633] via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                <p className="text-sm font-semibold text-blue-200">{operations.imageEyebrow}</p>
                <p className="mt-3 max-w-sm text-2xl font-semibold tracking-tight">
                  {operations.imageTitle}
                </p>
              </div>
            </div>

            <div className="bg-[#f7f9fc] p-4 sm:p-7 lg:p-9">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-blue-700">
                      {operations.overviewEyebrow}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                      {operations.overviewTitle}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />{' '}
                    {operations.connectedSites}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {operations.metrics.map((metric, index) => {
                    const Icon = [UsersRound, CalendarDays, BarChart3][index] ?? BarChart3
                    return (
                      <div key={metric.label} className="rounded-xl border border-slate-200 p-4">
                        <Icon className="h-5 w-5 text-blue-700" aria-hidden="true" />
                        <p className="mt-5 text-2xl font-semibold">{metric.value}</p>
                        <div className="mt-1 flex justify-between gap-2 text-xs text-slate-500">
                          <span>{metric.label}</span>
                          <span className="font-semibold text-blue-700">{metric.trend}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
                  <div className="rounded-xl border border-slate-200 p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{operations.scheduleTitle}</h4>
                      <span className="text-xs font-semibold text-blue-700">
                        {operations.calendarLabel}
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {operations.sessions.map((session) => (
                        <div
                          key={session.name}
                          className="grid grid-cols-[52px_1fr] gap-3 rounded-lg bg-slate-50 p-3"
                        >
                          <span className="text-sm font-semibold text-blue-700">
                            {session.time}
                          </span>
                          <div>
                            <p className="text-sm font-semibold">{session.name}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3 w-3" aria-hidden="true" /> {session.place}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#071633] p-5 text-white">
                    <p className="text-sm font-semibold text-blue-200">
                      {operations.admissionsEyebrow}
                    </p>
                    <p className="mt-5 text-4xl font-semibold">42</p>
                    <p className="mt-1 text-sm text-blue-100/70">{operations.activeApplications}</p>
                    <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[68%] rounded-full bg-blue-400" />
                    </div>
                    <div className="mt-3 flex justify-between text-xs text-blue-100/70">
                      <span>{operations.qualified}</span>
                      <span>68%</span>
                    </div>
                    <p className="mt-8 border-t border-white/10 pt-5 text-sm leading-6 text-blue-100/75">
                      {operations.applicationsVisible}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
