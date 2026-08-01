'use client'

import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { ConnectorLogos } from '@/components/marketing/ConnectorLogos'
import { featureModuleDetailByTitle } from '@/lib/feature-module-details'
import { featureGroups } from '@/lib/marketing-content'

export function FeatureModuleExplorer() {
  const [activeTitle, setActiveTitle] = useState<string>(featureGroups[0]?.title ?? '')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const group = featureGroups.find((item) => item.title === activeTitle) ?? featureGroups[0]
  const detail = group ? featureModuleDetailByTitle[group.title] : undefined
  if (!group || !detail) return null

  const selectFeature = (title: string, focus = false) => {
    setActiveTitle(title)
    if (!focus) return
    const index = featureGroups.findIndex((item) => item.title === title)
    tabRefs.current[index]?.focus()
  }

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold text-blue-700">Complete module catalogue</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
            Explore every module.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Choose a module. See its workflow, audience and connections.
          </p>
        </div>

        <div
          data-testid="feature-catalogue"
          className="mt-12 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(7,22,51,.08)] lg:grid-cols-[.34fr_.66fr]"
        >
          <div
            role="tablist"
            aria-label="Akademate feature modules"
            className="flex gap-1 overflow-x-auto border-b border-slate-200 p-3 lg:block lg:max-h-[760px] lg:overflow-y-auto lg:border-b-0 lg:border-r"
          >
            {featureGroups.map((item, index) => {
              const selected = item.title === group.title
              return (
                <button
                  key={item.title}
                  ref={(node) => {
                    tabRefs.current[index] = node
                  }}
                  id={`feature-tab-${slugify(item.title)}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="feature-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectFeature(item.title)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                      event.preventDefault()
                      selectFeature(
                        featureGroups[(index + 1) % featureGroups.length]?.title ?? group.title,
                        true
                      )
                    }
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                      event.preventDefault()
                      selectFeature(
                        featureGroups[(index - 1 + featureGroups.length) % featureGroups.length]
                          ?.title ?? group.title,
                        true
                      )
                    }
                    if (event.key === 'Home') {
                      event.preventDefault()
                      selectFeature(featureGroups[0]?.title ?? group.title, true)
                    }
                    if (event.key === 'End') {
                      event.preventDefault()
                      selectFeature(featureGroups.at(-1)?.title ?? group.title, true)
                    }
                  }}
                  className={`flex w-[260px] shrink-0 items-center gap-4 rounded-xl px-4 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:w-full ${selected ? 'bg-[#071633] text-white' : 'text-slate-700 hover:bg-blue-50'}`}
                >
                  <span
                    className={`text-xs font-semibold ${selected ? 'text-blue-300' : 'text-blue-700'}`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-semibold">{item.title}</span>
                </button>
              )
            })}
          </div>

          <article
            role="tabpanel"
            id="feature-panel"
            aria-labelledby={`feature-tab-${slugify(group.title)}`}
            className="p-6 sm:p-9 lg:p-12"
            key={group.title}
          >
            <div className="flex flex-wrap gap-2">
              {detail.audiences.map((audience) => (
                <span
                  key={audience}
                  className="rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800"
                >
                  {audience}
                </span>
              ))}
            </div>
            <p className="mt-8 text-sm font-semibold text-blue-700">{group.eyebrow}</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
              {group.title}
            </h3>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{group.description}</p>

            <div className="mt-10 grid gap-8 xl:grid-cols-[.92fr_1.08fr]">
              <div>
                <h4 className="text-sm font-semibold text-slate-500">What your team can do</h4>
                <ul className="mt-5 space-y-4">
                  {group.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-800"
                    >
                      <CheckCircle2
                        className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-[#071633] p-5 text-white sm:p-7">
                <div className="flex items-start justify-between gap-5 border-b border-white/15 pb-6">
                  <div>
                    <p className="text-xs font-semibold text-blue-300">{detail.previewTitle}</p>
                    <p className="mt-3 text-4xl font-semibold">{detail.signal}</p>
                    <p className="mt-1 text-sm text-blue-100/60">{detail.signalLabel}</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15">
                    <ArrowRight className="h-5 w-5 text-blue-300" aria-hidden="true" />
                  </span>
                </div>
                <div className="divide-y divide-white/10">
                  {detail.previewRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-4 py-4 text-sm"
                    >
                      <span className="text-blue-100/60">{row.label}</span>
                      <span className="text-right font-semibold">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-slate-200 pt-8">
              <h4 className="text-sm font-semibold text-slate-500">
                Connected services and methods
              </h4>
              <div className="mt-4">
                <ConnectorLogos ids={detail.connectors} />
              </div>
              {group.title === 'Payments, billing and finance' && (
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Card and wallet marks describe payment methods delivered through the configured
                  payment provider.
                </p>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
