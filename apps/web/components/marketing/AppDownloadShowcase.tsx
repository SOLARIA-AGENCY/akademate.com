'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Check, Laptop, Smartphone, Tablet } from 'lucide-react'
import { useRef, useState } from 'react'
import { useLocale } from '@/components/i18n/locale-provider'
import { getSecondaryPublicContent, type AppDownloadId } from '@/lib/secondary-public-content'
import { localizedHref } from '@/lib/i18n/routing'

const icons = [Laptop, Smartphone, Tablet] as const

export function AppDownloadShowcase({ compact = false }: { compact?: boolean }) {
  const locale = useLocale()
  const content = getSecondaryPublicContent(locale).apps
  const appDownloadOptions = content.options
  const [activeId, setActiveId] = useState<AppDownloadId>('mac')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activeIndex = appDownloadOptions.findIndex((option) => option.id === activeId)
  const active = appDownloadOptions[activeIndex] ?? appDownloadOptions[0]

  if (!active) {
    throw new Error('App download content must provide at least one application preview.')
  }

  const selectApp = (id: AppDownloadId, focus = false) => {
    setActiveId(id)
    if (!focus) return
    const index = appDownloadOptions.findIndex((option) => option.id === id)
    tabRefs.current[index]?.focus()
  }

  return (
    <section
      aria-labelledby="apps-download-title"
      className={`${compact ? 'px-4 py-16 sm:px-6 lg:px-8 lg:py-20' : 'px-4 py-20 sm:px-6 lg:px-8 lg:py-28'} bg-white`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">{content.kicker}</p>
            <h2
              id="apps-download-title"
              className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl"
            >
              {content.title}
            </h2>
          </div>
          <div className="lg:justify-self-end">
            <p className="max-w-xl text-lg leading-8 text-slate-600">{content.description}</p>
            {compact ? (
              <Link
                href={localizedHref('/download', locale)}
                className="mt-5 inline-flex min-h-11 items-center font-semibold text-blue-700 hover:text-blue-900"
              >
                {content.roadmapLink}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-[#071633] shadow-[0_28px_90px_rgba(7,22,51,.16)]">
          <div className="grid lg:grid-cols-[.36fr_.64fr]">
            <div className="flex flex-col p-5 text-white sm:p-8 lg:min-h-[620px] lg:p-10">
              <div
                role="tablist"
                aria-label={content.tabListLabel}
                className="grid grid-cols-3 gap-2 border-b border-white/15 pb-6 lg:grid-cols-1"
              >
                {appDownloadOptions.map((option, index) => {
                  const Icon = icons[index] ?? Laptop
                  const selected = option.id === active.id
                  return (
                    <button
                      key={option.id}
                      ref={(node) => {
                        tabRefs.current[index] = node
                      }}
                      id={`download-tab-${option.id}`}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-controls="download-panel"
                      tabIndex={selected ? 0 : -1}
                      onClick={() => selectApp(option.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                          event.preventDefault()
                          selectApp(
                            appDownloadOptions[(index + 1) % appDownloadOptions.length]?.id ??
                              'mac',
                            true
                          )
                        }
                        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                          event.preventDefault()
                          selectApp(
                            appDownloadOptions[
                              (index - 1 + appDownloadOptions.length) % appDownloadOptions.length
                            ]?.id ?? 'mac',
                            true
                          )
                        }
                        if (event.key === 'Home') {
                          event.preventDefault()
                          selectApp(appDownloadOptions[0]?.id ?? 'mac', true)
                        }
                        if (event.key === 'End') {
                          event.preventDefault()
                          selectApp(appDownloadOptions.at(-1)?.id ?? 'ipad', true)
                        }
                      }}
                      className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 lg:justify-start lg:px-4 ${selected ? 'bg-white text-[#071633]' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {option.label}
                    </button>
                  )
                })}
              </div>

              <div
                key={active.id}
                role="tabpanel"
                id="download-panel"
                aria-labelledby={`download-tab-${active.id}`}
                className="flex flex-1 flex-col pt-8"
              >
                <span className="w-fit rounded-full border border-blue-300/30 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold text-blue-200">
                  {active.status}
                </span>
                <h3 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {active.title}
                </h3>
                <p className="mt-4 leading-7 text-blue-100/70">{active.description}</p>
                <ul className="mt-8 grid gap-3 lg:mt-auto">
                  {active.capabilities.map((capability) => (
                    <li key={capability} className="flex items-center gap-3 text-sm font-semibold">
                      <Check className="h-4 w-4 text-blue-300" aria-hidden="true" />
                      {capability}
                    </li>
                  ))}
                </ul>
                <p className="mt-8 text-xs leading-5 text-blue-100/50">{content.previewOnly}</p>
              </div>
            </div>

            <div className="relative min-h-[360px] bg-slate-100 sm:min-h-[520px] lg:min-h-[620px]">
              <Image
                key={active.image}
                src={active.image}
                alt={active.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 64vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
