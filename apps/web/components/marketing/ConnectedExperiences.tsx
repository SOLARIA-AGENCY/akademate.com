'use client'

import Image from 'next/image'
import { Check, GraduationCap, Presentation, UsersRound } from 'lucide-react'
import { useRef, useState } from 'react'
import { academyExperiences } from '@/lib/marketing-content'

const icons = [UsersRound, Presentation, GraduationCap] as const

export function ConnectedExperiences() {
  const [activeId, setActiveId] = useState<(typeof academyExperiences)[number]['id']>('operations')
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const activeIndex = academyExperiences.findIndex((experience) => experience.id === activeId)
  const active = academyExperiences[activeIndex] ?? academyExperiences[0]

  const selectTab = (index: number) => {
    const next = (index + academyExperiences.length) % academyExperiences.length
    const experience = academyExperiences[next]
    if (!experience) return
    setActiveId(experience.id)
    tabs.current[next]?.focus()
  }

  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              One academy, connected around its people
            </p>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
              One workspace for every role.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            One academy record. A focused workspace for every role.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-[#071633] shadow-[0_28px_80px_rgba(7,22,51,.16)]">
          <div className="grid lg:grid-cols-[.38fr_.62fr]">
            <div className="flex flex-col p-6 text-white sm:p-9 lg:min-h-[640px] lg:p-10">
              <div
                role="tablist"
                aria-label="Akademate experiences"
                className="grid grid-cols-3 gap-2 border-b border-white/15 pb-6 lg:grid-cols-1 lg:gap-1"
              >
                {academyExperiences.map((experience, index) => {
                  const Icon = icons[index] ?? UsersRound
                  const selected = experience.id === active.id
                  return (
                    <button
                      key={experience.id}
                      ref={(node) => {
                        tabs.current[index] = node
                      }}
                      type="button"
                      role="tab"
                      id={`experience-tab-${experience.id}`}
                      aria-selected={selected}
                      aria-controls={`experience-panel-${experience.id}`}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setActiveId(experience.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                          event.preventDefault()
                          selectTab(activeIndex + 1)
                        }
                        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                          event.preventDefault()
                          selectTab(activeIndex - 1)
                        }
                        if (event.key === 'Home') {
                          event.preventDefault()
                          selectTab(0)
                        }
                        if (event.key === 'End') {
                          event.preventDefault()
                          selectTab(academyExperiences.length - 1)
                        }
                      }}
                      className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 lg:justify-start lg:px-4 ${selected ? 'bg-white text-[#071633]' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{experience.label}</span>
                    </button>
                  )
                })}
              </div>

              <div
                role="tabpanel"
                id={`experience-panel-${active.id}`}
                aria-labelledby={`experience-tab-${active.id}`}
                className="flex flex-1 flex-col pt-9"
                key={active.id}
              >
                <p className="text-sm font-semibold text-blue-300">{active.eyebrow}</p>
                <h3 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                  {active.title}
                </h3>
                <p className="mt-5 leading-7 text-blue-100/70">{active.description}</p>
                <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-auto lg:grid-cols-1">
                  {active.capabilities.map((capability) => (
                    <li
                      key={capability}
                      className="flex items-center gap-3 text-sm font-semibold text-white/90"
                    >
                      <Check className="h-4 w-4 shrink-0 text-blue-300" aria-hidden="true" />
                      {capability}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="relative min-h-[360px] bg-slate-100 sm:min-h-[520px] lg:min-h-[640px]">
              <Image
                key={active.image}
                src={active.image}
                alt={active.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 62vw"
                className="object-cover motion-safe:animate-[fadeIn_.3s_ease-out]"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#071633]/45 to-transparent lg:hidden" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
