'use client'

import { useState } from 'react'
import { CheckCircle2, Code2, Copy, ExternalLink, Globe2, LayoutTemplate, Link2 } from 'lucide-react'
import { distributionModes } from '@/lib/marketing-content'

const modeIcons = [LayoutTemplate, Globe2, Code2, Link2] as const

export function WebsiteDistributionPreview() {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = distributionModes[activeIndex] ?? distributionModes[0]
  const ActiveIcon = modeIcons[activeIndex] ?? LayoutTemplate

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(7,22,51,.1)]">
      <div className="grid lg:grid-cols-[.38fr_.62fr]">
        <div className="border-b border-slate-200 bg-[#071633] p-4 text-white lg:border-b-0 lg:border-r lg:p-6">
          <p className="text-sm font-semibold text-blue-200">Publish your way</p>
          <div className="mt-5 grid gap-2" role="tablist" aria-label="Website distribution options">
            {distributionModes.map((mode, index) => {
              const Icon = modeIcons[index] ?? LayoutTemplate
              const selected = index === activeIndex
              return (
                <button key={mode.title} type="button" role="tab" aria-selected={selected} onClick={() => setActiveIndex(index)} className={`flex min-h-12 items-center gap-3 rounded-xl px-4 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${selected ? 'bg-white text-[#071633]' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />{mode.title}
                </button>
              )
            })}
          </div>
        </div>

        <div role="tabpanel" className="bg-[linear-gradient(145deg,#ffffff_0%,#f2f6ff_100%)] p-5 sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div className="max-w-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><ActiveIcon className="h-5 w-5" aria-hidden="true" /></div>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight">{active.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{active.text}</p>
            </div>
            <span className="hidden rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 sm:inline-flex">Connected</span>
          </div>

          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="text-xs font-semibold text-slate-500">Live destination</p>
            <div className="mt-3 flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#071633]">{active.label}</span>
              <button type="button" aria-label="Copy example address" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-blue-700"><Copy className="h-4 w-4" aria-hidden="true" /></button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <PreviewModule title="Course catalogue" text="Live availability and programme pages" />
              <PreviewModule title="Registration and payment" text="Forms, capacity and checkout" />
            </div>
          </div>

          <button type="button" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#071633] px-5 text-sm font-semibold text-white hover:bg-blue-800">Preview experience <ExternalLink className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  )
}

function PreviewModule({ title, text }: { title: string; text: string }) {
  return <div className="rounded-xl border border-slate-200 bg-[#f8faff] p-4"><p className="text-sm font-semibold">{title}</p><p className="mt-2 text-xs leading-5 text-slate-500">{text}</p></div>
}
