'use client'

import Image from 'next/image'
import {
  BarChart3,
  ChevronRight,
  CircleCheck,
  FileText,
  LockKeyhole,
  Megaphone,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useMarketingText } from '@/components/i18n/use-marketing-text'
import {
  agenticControls,
  agenticProviders,
  campaignFunnel,
  campaignMetrics,
} from '@/lib/agentic-growth-content'

type ShowcaseTab = 'mcp' | 'growth'

const tabs: Array<{ id: ShowcaseTab; label: string; icon: typeof Sparkles; panelId: string }> = [
  { id: 'mcp', label: 'AI workspace and MCP', icon: Sparkles, panelId: 'mcp-agentic-operations' },
  {
    id: 'growth',
    label: 'Campaign intelligence',
    icon: BarChart3,
    panelId: 'growth-ads-intelligence',
  },
]

export function AgenticGrowthShowcase() {
  const t = useMarketingText()
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('mcp')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    const syncHash = () => {
      const target = tabs.find((tab) => `#${tab.panelId}` === window.location.hash)
      if (!target) return
      setActiveTab(target.id)
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document.getElementById(target.panelId)?.scrollIntoView({ block: 'start' })
        })
      })
    }
    syncHash()
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  const selectTab = (id: ShowcaseTab, focus = false) => {
    setActiveTab(id)
    if (!focus) return
    const index = tabs.findIndex((tab) => tab.id === id)
    tabRefs.current[index]?.focus()
  }

  return (
    <section
      id="agentic-growth"
      aria-labelledby="agentic-growth-title"
      className="border-y border-blue-200 bg-[#eaf1ff] px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">{t('Assisted operations and growth')}</p>
            <h2
              id="agentic-growth-title"
              className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl"
            >
              {t('Assisted operations. Measurable growth.')}
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            {t('Connect governed AI workflows and paid growth signals to the academy record.')}
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-[0_24px_70px_rgba(7,22,51,.08)]">
          <div
            role="tablist"
            aria-label={t('Agentic and growth examples')}
            className="grid border-b border-slate-200 sm:grid-cols-2"
          >
            {tabs.map(({ id, label, icon: Icon, panelId }, index) => {
              const selected = activeTab === id
              return (
                <button
                  key={id}
                  ref={(node) => {
                    tabRefs.current[index] = node
                  }}
                  type="button"
                  role="tab"
                  id={`${id}-tab`}
                  aria-selected={selected}
                  aria-controls={panelId}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectTab(id)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                      event.preventDefault()
                      selectTab(tabs[(index + 1) % tabs.length]?.id ?? 'mcp', true)
                    }
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                      event.preventDefault()
                      selectTab(tabs[(index - 1 + tabs.length) % tabs.length]?.id ?? 'mcp', true)
                    }
                    if (event.key === 'Home') {
                      event.preventDefault()
                      selectTab(tabs[0]?.id ?? 'mcp', true)
                    }
                    if (event.key === 'End') {
                      event.preventDefault()
                      selectTab(tabs.at(-1)?.id ?? 'growth', true)
                    }
                  }}
                  className={`flex min-h-14 items-center justify-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:justify-start sm:px-6 ${selected ? 'border-blue-600 bg-blue-50 text-[#071633]' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-[#071633]'}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {t(label)}
                </button>
              )
            })}
          </div>

          <McpPanel hidden={activeTab !== 'mcp'} t={t} />
          <GrowthPanel hidden={activeTab !== 'growth'} t={t} />
        </div>
      </div>
    </section>
  )
}

function McpPanel({ hidden, t }: { hidden: boolean; t: (source: string) => string }) {
  return (
    <div
      id="mcp-agentic-operations"
      role="tabpanel"
      aria-labelledby="mcp-tab"
      hidden={hidden}
      className={`${hidden ? 'hidden' : 'grid'} scroll-mt-24 gap-8 p-5 sm:p-8 lg:grid-cols-[1.05fr_.95fr] lg:p-10`}
    >
      <div>
        <div className="rounded-2xl bg-[#071633] p-5 text-white sm:p-7">
          <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20">
                <Sparkles className="h-4 w-4 text-blue-200" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">{t('Ask Akademate')}</p>
                <p className="text-xs text-blue-100/60">{t('MCP workspace preview')}</p>
              </div>
            </div>
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
              {t('Illustrative roadmap')}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold">
            <span className="rounded-full bg-white/10 px-3 py-1.5">{t('Northstar Academy')}</span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">{t('Admissions lead')}</span>
            <span className="rounded-full bg-blue-500/20 px-3 py-1.5 text-blue-100">
              leads:read · campaigns:draft
            </span>
          </div>

          <div className="mt-7 space-y-4">
            <div className="ml-auto max-w-[86%] rounded-2xl rounded-br-sm bg-blue-600 px-4 py-3 text-sm text-white">
              {t('Summarise unanswered enrolment questions from this week.')}
            </div>
            <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3 text-sm text-blue-50">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">{t('Draft ready · 12 conversations')}</span>
                <CircleCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              </div>
              <p className="mt-2 text-xs leading-5 text-blue-100/65">
                {t('Read-only summary. No message was sent.')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <LockKeyhole className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
            {t('Target: tenant-scoped tools')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
            {t('Target: human confirmation')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
            {t('Target: auditable trail')}
          </span>
        </div>
      </div>

      <div className="flex flex-col">
        <div>
          <p className="text-sm font-semibold text-blue-700">{t('Planned client options')}</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight">
            {t('Your permissions stay in the room.')}
          </h3>
          <p className="mt-4 leading-7 text-slate-600">
            {t('Explore how approved AI clients could prepare work inside each role’s scope.')}
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-2">
          {agenticProviders.map((provider) => (
            <div
              key={provider.id}
              className="flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
              title={`${provider.label}: ${provider.status}`}
            >
              {provider.asset ? (
                <span className="relative h-6 w-6 shrink-0">
                  <Image src={provider.asset} alt="" fill sizes="24px" className="object-contain" />
                </span>
              ) : (
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#071633] text-[10px] font-bold text-white"
                  aria-hidden="true"
                >
                  G
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-[#071633]">
                  {provider.label}
                </span>
                <span className="block truncate text-[11px] text-slate-500">
                  {provider.provider}
                </span>
                <span className="mt-0.5 block truncate text-[10px] font-semibold text-blue-700">
                  {t(provider.status)}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-7 space-y-3">
          {agenticControls.map((control) => (
            <div
              key={control.title}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                  {t(control.title)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#071633]">{t(control.label)}</p>
                  <p className="truncate text-xs text-slate-500">{t(control.detail)}</p>
                </div>
              </div>
              <span className="shrink-0 text-right text-[11px] font-semibold text-slate-500">
                {t(control.action)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-6">
          <p className="text-xs leading-5 text-slate-500">{t('Planned integration.')}</p>
        </div>
      </div>
    </div>
  )
}

function GrowthPanel({ hidden, t }: { hidden: boolean; t: (source: string) => string }) {
  return (
    <div
      id="growth-ads-intelligence"
      role="tabpanel"
      aria-labelledby="growth-tab"
      hidden={hidden}
      className={`${hidden ? 'hidden' : 'grid'} scroll-mt-24 gap-8 p-5 sm:p-8 lg:grid-cols-[.85fr_1.15fr] lg:p-10`}
    >
      <div className="flex flex-col">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <Image
            src="/images/marketing/akademate-growth-ads-mobile-v1.jpg"
            alt={t('Academy operator viewing a social course promotion and campaign dashboard')}
            width={1200}
            height={1499}
            sizes="(max-width: 1024px) 100vw, 36vw"
            className="h-auto w-full object-cover"
          />
          <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-[#071633] shadow-lg backdrop-blur">
            {t('Social promotion preview')}
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          {t('Illustrative creative; provider formats and availability vary by account.')}
        </p>
      </div>

      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-700">{t('Paid growth intelligence')}</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">
              {t('See the path from campaign to enrolment.')}
            </h3>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800">
            {t('Illustrative example')}
          </span>
        </div>
        <p className="mt-4 leading-7 text-slate-600">
          {t('Bring paid media and CRM signals together with visible freshness and attribution rules.')}
        </p>

        <div className="mt-6 rounded-2xl bg-[#071633] p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
            <div>
              <p className="text-sm font-semibold">{t('Autumn intake')}</p>
              <p className="mt-1 text-xs text-blue-100/60">{t('Last sync · 2h ago · EUR')}</p>
            </div>
            <div className="flex gap-2 text-[11px] font-semibold">
              <span className="rounded-full bg-white/10 px-2.5 py-1">Meta Ads</span>
              <span className="rounded-full bg-white/10 px-2.5 py-1">Google Ads</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-4">
            {campaignMetrics.map((metric) => (
              <div key={metric.label}>
                <p className="text-[11px] leading-4 text-blue-100/55">{t(metric.label)}</p>
                <p className="mt-1 text-xl font-semibold tracking-tight">{metric.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 border-t border-white/10 pt-4 text-[11px] leading-5 text-blue-100/55">
            {t('Reach is shown as N/D when the provider does not return it. Attribution follows your configured model.')}
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#071633]">{t('Illustrative funnel')}</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <MousePointerClick className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
              {t('Source and freshness shown')}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-1.5">
            {campaignFunnel.map((step, index) => (
              <div key={step.label} className="min-w-0">
                <div className="flex items-center gap-1">
                  <div
                    className="h-1.5 flex-1 rounded-full bg-blue-600"
                    style={{ opacity: 1 - index * 0.14 }}
                  />
                  {index < campaignFunnel.length - 1 && (
                    <ChevronRight
                      className="hidden h-3 w-3 shrink-0 text-slate-400 sm:block"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <p className="mt-2 truncate text-[10px] font-semibold text-slate-500">
                  {t(step.label)}
                </p>
                <p className="mt-0.5 truncate text-xs font-bold text-[#071633]">{step.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
          <p className="text-xs leading-5 text-blue-950">
            {t('Rules can prepare a follow-up or alert. Budget and campaign changes require approval.')}
          </p>
        </div>
      </div>
    </div>
  )
}
