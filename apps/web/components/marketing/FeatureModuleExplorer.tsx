'use client'

import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useLocale } from '@/components/i18n/locale-provider'
import { ConnectorLogos } from '@/components/marketing/ConnectorLogos'
import {
  getSpanishFeatureModule,
  spanishFeatureExplorerCopy,
} from '@/lib/feature-module-catalogue.es'
import { featureModuleDetailById } from '@/lib/feature-module-details'
import { featureGroups } from '@/lib/marketing-content'

export function FeatureModuleExplorer() {
  const locale = useLocale()
  const [activeId, setActiveId] = useState<(typeof featureGroups)[number]['id']>(
    featureGroups[0]?.id ?? 'website-catalogue-embeds'
  )
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const group = featureGroups.find((item) => item.id === activeId) ?? featureGroups[0]
  const detail = group ? featureModuleDetailById[group.id] : undefined
  if (!group || !detail) return null
  const spanishModule = locale === 'es' ? getSpanishFeatureModule(group.id) : undefined
  const explorerCopy = locale === 'es' ? spanishFeatureExplorerCopy : undefined
  const title = spanishModule?.title ?? group.title
  const eyebrow = spanishModule?.eyebrow ?? group.eyebrow
  const description = spanishModule?.description ?? group.description
  const features = spanishModule?.features ?? group.features
  const audiences = spanishModule?.audiences ?? detail.audiences
  const previewTitle = spanishModule?.preview.title ?? detail.previewTitle
  const signalLabel = spanishModule?.preview.signalLabel ?? detail.signalLabel
  const previewRows = spanishModule?.preview.rows ?? detail.previewRows

  const selectFeature = (id: (typeof featureGroups)[number]['id'], focus = false) => {
    setActiveId(id)
    if (!focus) return
    const index = featureGroups.findIndex((item) => item.id === id)
    tabRefs.current[index]?.focus()
  }

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold text-blue-700">
            {explorerCopy?.eyebrow ?? 'Complete module catalogue'}
          </p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
            {explorerCopy?.title ?? 'Explore every module.'}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            {explorerCopy?.description ??
              'Choose a module. See its workflow, audience and connections.'}
          </p>
        </div>

        <div
          data-testid="feature-catalogue"
          className="mt-12 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(7,22,51,.08)] lg:grid-cols-[.34fr_.66fr]"
        >
          <div
            role="tablist"
            aria-label={explorerCopy?.tablistAria ?? 'Akademate feature modules'}
            className="flex gap-1 overflow-x-auto border-b border-slate-200 p-3 lg:grid lg:grid-cols-2 lg:gap-1 lg:overflow-visible lg:border-b-0 lg:border-r"
          >
            {featureGroups.map((item, index) => {
              const selected = item.id === group.id
              return (
                <button
                  key={item.id}
                  ref={(node) => {
                    tabRefs.current[index] = node
                  }}
                  id={`feature-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="feature-panel"
                  aria-label={
                    locale === 'es' ? getSpanishFeatureModule(item.id).aria.tab : undefined
                  }
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectFeature(item.id)}
                  onMouseEnter={() => selectFeature(item.id)}
                  onFocus={() => selectFeature(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                      event.preventDefault()
                      selectFeature(
                        featureGroups[(index + 1) % featureGroups.length]?.id ?? group.id,
                        true
                      )
                    }
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                      event.preventDefault()
                      selectFeature(
                        featureGroups[(index - 1 + featureGroups.length) % featureGroups.length]
                          ?.id ?? group.id,
                        true
                      )
                    }
                    if (event.key === 'Home') {
                      event.preventDefault()
                      selectFeature(featureGroups[0]?.id ?? group.id, true)
                    }
                    if (event.key === 'End') {
                      event.preventDefault()
                      selectFeature(featureGroups.at(-1)?.id ?? group.id, true)
                    }
                  }}
                  className={`flex w-[260px] shrink-0 items-center gap-4 rounded-xl px-4 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:w-full ${selected ? 'bg-[#071633] text-white' : 'text-slate-700 hover:bg-blue-50'}`}
                >
                  <span
                    className={`text-xs font-semibold ${selected ? 'text-blue-300' : 'text-blue-700'}`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-semibold">
                    {locale === 'es' ? getSpanishFeatureModule(item.id).title : item.title}
                  </span>
                </button>
              )
            })}
          </div>

          <article
            role="tabpanel"
            id="feature-panel"
            aria-labelledby={`feature-tab-${group.id}`}
            aria-label={spanishModule?.aria.panel}
            className="p-6 sm:p-9 lg:p-12"
            key={group.id}
          >
            <div className="flex flex-wrap gap-2">
              {audiences.map((audience) => (
                <span
                  key={audience}
                  className="rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800"
                >
                  {audience}
                </span>
              ))}
            </div>
            <p className="mt-8 text-sm font-semibold text-blue-700">{eyebrow}</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">{title}</h3>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{description}</p>

            <div className="mt-10 grid gap-8 xl:grid-cols-[.92fr_1.08fr]">
              <div>
                <h4 className="text-sm font-semibold text-slate-500">
                  {explorerCopy?.capabilitiesHeading ?? 'What your team can do'}
                </h4>
                <ul className="mt-5 space-y-4">
                  {features.map((feature) => (
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

              <div
                className="rounded-2xl bg-[#071633] p-5 text-white sm:p-7"
                role={spanishModule ? 'img' : undefined}
                aria-label={spanishModule?.aria.preview}
              >
                <div className="flex items-start justify-between gap-5 border-b border-white/15 pb-6">
                  <div>
                    <p className="text-xs font-semibold text-blue-300">{previewTitle}</p>
                    {spanishModule && (
                      <p className="mt-2 max-w-sm text-xs leading-5 text-blue-100/60">
                        {spanishModule.preview.description}
                      </p>
                    )}
                    <p className="mt-3 text-4xl font-semibold">{detail.signal}</p>
                    <p className="mt-1 text-sm text-blue-100/60">{signalLabel}</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15">
                    <ArrowRight className="h-5 w-5 text-blue-300" aria-hidden="true" />
                  </span>
                </div>
                {spanishModule && (
                  <p className="pt-5 text-xs font-semibold uppercase tracking-wider text-blue-300">
                    {spanishModule.preview.tableHeading}
                  </p>
                )}
                <div className="divide-y divide-white/10">
                  {previewRows.map((row, index) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-4 py-4 text-sm"
                    >
                      <span className="text-blue-100/60">{row.label}</span>
                      <span className="text-right">
                        <span className="block font-semibold">{row.value}</span>
                        {spanishModule?.preview.rows[index]?.action && (
                          <span className="mt-1 block text-xs font-semibold text-blue-300">
                            {spanishModule.preview.rows[index]?.action}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                {spanishModule && (
                  <p className="border-t border-white/10 pt-4 text-xs leading-5 text-blue-100/60">
                    {spanishModule.preview.note}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-10 border-t border-slate-200 pt-8">
              <h4 className="text-sm font-semibold text-slate-500">
                {explorerCopy?.connectorsHeading ?? 'Connected services and methods'}
              </h4>
              <div className="mt-4">
                <ConnectorLogos ids={detail.connectors} />
              </div>
              {group.title === 'Payments, billing and finance' && (
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  {explorerCopy?.paymentMethodsNote ??
                    'Card and wallet marks describe payment methods delivered through the configured payment provider.'}
                </p>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
