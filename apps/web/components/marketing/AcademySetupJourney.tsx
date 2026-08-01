'use client'

import Image from 'next/image'
import { Check, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { academySetupStages } from '@akademate/ui/academy-setup'

export function AcademySetupJourney() {
  const [activeId, setActiveId] = useState<(typeof academySetupStages)[number]['id']>('blueprint')
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const activeIndex = academySetupStages.findIndex((stage) => stage.id === activeId)
  const active = academySetupStages[activeIndex] ?? academySetupStages[0]

  const selectStage = (index: number) => {
    const next = (index + academySetupStages.length) % academySetupStages.length
    const stage = academySetupStages[next]
    if (!stage) return
    setActiveId(stage.id)
    tabs.current[next]?.focus()
  }

  return (
    <section className="product-texture overflow-hidden bg-[#06142f] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[.78fr_1.22fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-300">Guided academy setup</p>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Watch your academy take shape.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-blue-100/70">
            Build your model, campuses and identity step by step.
          </p>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-2xl border border-white/15 bg-[#081a3b] shadow-[0_30px_100px_rgba(0,0,0,.28)] lg:grid-cols-[.36fr_.64fr]">
          <div className="order-2 min-w-0 p-6 sm:p-8 lg:order-1 lg:p-9">
            <div
              role="tablist"
              aria-label="Academy setup stages"
              className="grid grid-cols-2 gap-1 lg:block lg:space-y-1"
            >
              {academySetupStages.map((stage, index) => {
                const selected = stage.id === active.id
                const complete = index < activeIndex
                return (
                  <button
                    key={stage.id}
                    ref={(node) => {
                      tabs.current[index] = node
                    }}
                    type="button"
                    role="tab"
                    id={`setup-tab-${stage.id}`}
                    aria-selected={selected}
                    aria-controls={`setup-panel-${stage.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActiveId(stage.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                        event.preventDefault()
                        selectStage(activeIndex + 1)
                      }
                      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                        event.preventDefault()
                        selectStage(activeIndex - 1)
                      }
                      if (event.key === 'Home') {
                        event.preventDefault()
                        selectStage(0)
                      }
                      if (event.key === 'End') {
                        event.preventDefault()
                        selectStage(academySetupStages.length - 1)
                      }
                    }}
                    className={`group flex min-w-0 w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 lg:gap-4 ${selected ? 'bg-white text-[#071633]' : 'text-blue-100/65 hover:bg-white/10 hover:text-white'}`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${selected ? 'border-blue-200 bg-blue-50 text-blue-700' : complete ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-white/20'}`}
                    >
                      {complete ? <Check className="h-4 w-4" aria-hidden="true" /> : stage.step}
                    </span>
                    <span className="min-w-0 text-xs font-semibold leading-5 sm:text-sm lg:text-base">
                      {stage.title}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="order-1 min-w-0 lg:order-2">
            <div className="relative h-[300px] overflow-hidden bg-[#030d20] sm:h-auto sm:aspect-[16/10] sm:min-h-[340px]">
              <div key={active.id} className="academy-stage-image absolute inset-0">
                <Image
                  src={active.image}
                  alt={active.imageAlt}
                  fill
                  priority={active.id === 'blueprint'}
                  sizes="(max-width: 1024px) 100vw, 65vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#03102a] via-[#03102a]/75 to-transparent px-5 pb-5 pt-20 sm:px-8 sm:pb-7">
                <div className="flex items-end justify-between gap-5 text-white">
                  <div>
                    <p className="text-xs font-semibold text-blue-300">Stage {active.step} of 06</p>
                    <p className="mt-2 text-2xl font-semibold">{active.visualLabel}</p>
                  </div>
                  <p className="hidden text-sm font-semibold text-blue-100/80 sm:block">
                    One academy. Six build states.
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-6 gap-1.5" aria-hidden="true">
                  {academySetupStages.map((stage, index) => (
                    <span
                      key={stage.id}
                      className={`h-1 rounded-full transition-colors duration-300 motion-reduce:transition-none ${index <= activeIndex ? 'bg-blue-400' : 'bg-white/20'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div
              role="tabpanel"
              id={`setup-panel-${active.id}`}
              aria-labelledby={`setup-tab-${active.id}`}
              className="grid min-w-0 gap-6 border-t border-white/15 p-6 sm:p-8 lg:grid-cols-[1fr_auto]"
              key={active.id}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-300">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span aria-live="polite">{active.title}</span>
                </div>
                <p className="mt-3 max-w-2xl break-words leading-7 text-blue-100/70">
                  {active.description}
                </p>
              </div>
              <div className="flex min-w-0 flex-wrap gap-2 lg:max-w-[260px] lg:justify-end">
                {active.capabilities.map((capability) => (
                  <span
                    key={capability}
                    className="max-w-full whitespace-normal rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-blue-100/80"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
