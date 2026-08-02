'use client'

import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { ConnectorLogos } from '@/components/marketing/ConnectorLogos'
import type { Locale } from '@/lib/i18n/routing'
import { getLocalizedVerticalProductStory, verticalPageChrome } from '@/lib/vertical-i18n'

export function VerticalProductExperience({ slug, locale }: { slug: string; locale: Locale }) {
  const story = getLocalizedVerticalProductStory(slug, locale)
  const chrome = verticalPageChrome[locale]
  const [activeId, setActiveId] = useState(story?.moments[0]?.id ?? '')
  if (!story) return null
  const moment = story.moments.find((item) => item.id === activeId) ?? story.moments[0]
  if (!moment) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(7,22,51,.09)]">
      <div
        role="tablist"
        aria-label={`Akademate ${chrome.designedFor.toLowerCase()} ${story.noun}`}
        className="grid grid-cols-2 border-b border-slate-200 sm:grid-cols-4"
      >
        {story.moments.map((item) => (
          <button
            key={item.id}
            id={`vertical-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={item.id === moment.id}
            aria-controls={`vertical-panel-${item.id}`}
            onClick={() => setActiveId(item.id)}
            onPointerEnter={() => setActiveId(item.id)}
            onMouseEnter={() => setActiveId(item.id)}
            onFocus={() => setActiveId(item.id)}
            className={`min-h-14 px-4 py-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${item.id === moment.id ? 'bg-[#071633] text-white' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-800'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`vertical-panel-${moment.id}`}
        aria-labelledby={`vertical-tab-${moment.id}`}
        className="grid lg:grid-cols-[.42fr_.58fr]"
        key={moment.id}
      >
        <div className="bg-[#071633] p-7 text-white sm:p-10">
          <span className="inline-flex rounded-full border border-blue-300/30 bg-blue-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-100">
            {chrome.illustrativeExample}
          </span>
          <p className="text-sm font-semibold text-blue-300">
            {chrome.designedFor} {story.noun}
          </p>
          <h3 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            {moment.title}
          </h3>
          <p className="mt-5 leading-7 text-blue-100/70">{moment.text}</p>
          <div className="mt-9 border-t border-white/15 pt-7">
            <p className="text-4xl font-semibold">{moment.metric}</p>
            <p className="mt-2 text-sm text-blue-100/60">{moment.metricLabel}</p>
          </div>
        </div>

        <div className="p-6 sm:p-9">
          <div className="grid gap-5 sm:grid-cols-3">
            {moment.fields.map((field) => (
              <label key={field.label} className="text-sm font-semibold text-slate-700">
                {field.label}
                <select
                  aria-label={field.label}
                  defaultValue={field.options[0]}
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {field.options.map((option, optionIndex) => (
                    <option key={`${field.label}-${optionIndex}`}>{option}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="mt-8 rounded-2xl bg-slate-50 p-5 sm:p-6">
            <p className="text-sm font-semibold text-slate-500">{chrome.operatingContext}</p>
            <div className="mt-4 grid gap-3">
              {moment.activity.map((item, activityIndex) => (
                <p
                  key={`${moment.id}-activity-${activityIndex}`}
                  className="flex items-center gap-3 text-sm font-semibold text-slate-800"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                  {item}
                </p>
              ))}
            </div>
          </div>
          {moment.connectors && (
            <div className="mt-7">
              <ConnectorLogos ids={moment.connectors} compact />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
