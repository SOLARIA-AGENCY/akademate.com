'use client'

import { useState } from 'react'
import {
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  FileCode2,
  Globe2,
  LayoutTemplate,
  Link2,
  LockKeyhole,
  Share2,
} from 'lucide-react'
import { distributionModes } from '@/lib/marketing-content'
import { usePreviewCopy } from '@/components/i18n/use-preview-copy'

const modeIcons = [LayoutTemplate, Globe2, Code2, Link2] as const

export function WebsiteDistributionPreview() {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = distributionModes[activeIndex] ?? distributionModes[0]
  const copy = usePreviewCopy()
  const activeCopy = copy.distribution[activeIndex] ?? copy.distribution[0]
  const ActiveIcon = modeIcons[activeIndex] ?? LayoutTemplate

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(7,22,51,.1)]">
      <div className="grid lg:grid-cols-[.34fr_.66fr]">
        <div className="border-b border-slate-200 bg-[#071633] p-4 text-white lg:border-b-0 lg:border-r lg:p-6">
          <p className="text-sm font-semibold text-blue-200">{copy.website.publishYourWay}</p>
          <div
            className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-1"
            role="tablist"
            aria-label={copy.website.distributionOptions}
          >
            {distributionModes.map((mode, index) => {
              const Icon = modeIcons[index] ?? LayoutTemplate
              const selected = index === activeIndex
              return (
                <button
                  key={mode.title}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  className={`flex min-h-14 items-center gap-3 rounded-xl px-3 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 sm:px-4 sm:text-sm ${selected ? 'bg-white text-[#071633]' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'}`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {copy.distribution[index]?.title ?? mode.title}
                </button>
              )
            })}
          </div>
        </div>

        <div
          role="tabpanel"
          className="min-w-0 bg-[linear-gradient(145deg,#ffffff_0%,#eef4ff_100%)] p-5 sm:p-8"
        >
          <div className="flex min-h-[118px] items-start justify-between gap-5">
            <div className="max-w-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <ActiveIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight">{activeCopy.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{activeCopy.text}</p>
            </div>
            <span className="hidden rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 sm:inline-flex">
              {copy.website.connected}
            </span>
          </div>

          <div className="mt-7 h-[620px] sm:h-[330px]">
            {renderMode(activeIndex, active.label, copy)}
          </div>
        </div>
      </div>
    </div>
  )
}

function renderMode(index: number, label: string, copy: ReturnType<typeof usePreviewCopy>) {
  if (index === 1) return <DomainConnection domain={label} copy={copy} />
  if (index === 2) return <EmbedBuilder copy={copy} />
  if (index === 3) return <OfferShare copy={copy} />
  return <AcademyWebsite domain={label} copy={copy} />
}

function AcademyWebsite({
  domain,
  copy,
}: {
  domain: string
  copy: ReturnType<typeof usePreviewCopy>
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <BrowserBar address={domain} copy={copy} />
      <div className="grid min-h-0 flex-1 grid-cols-[.72fr_.28fr] bg-[#f8faff]">
        <div className="p-5 sm:p-7">
          <span className="text-xs font-semibold text-blue-700">{copy.website.academyOnline}</span>
          <div className="mt-3 h-7 w-3/4 rounded bg-[#071633]" />
          <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
          <div className="mt-6 grid grid-cols-2 gap-3">
            {copy.website.programmeCards.map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="h-12 rounded-lg bg-blue-100" />
                <p className="mt-3 text-xs font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-l border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">{copy.website.liveCms}</p>
          <ul className="mt-4 space-y-3 text-xs font-semibold text-slate-700">
            {copy.website.cmsItems.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-blue-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function DomainConnection({
  domain,
  copy,
}: {
  domain: string
  copy: ReturnType<typeof usePreviewCopy>
}) {
  return (
    <div className="grid h-full gap-4 sm:grid-cols-[.56fr_.44fr]">
      <div className="rounded-2xl bg-[#071633] p-6 text-white">
        <Globe2 className="h-7 w-7 text-blue-300" />
        <p className="mt-8 text-xs font-semibold text-blue-300">{copy.website.domainMapping}</p>
        <p className="mt-3 text-xl font-semibold">{domain}</p>
        <div className="mt-7 space-y-3">
          {copy.website.domainChecks.map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold text-slate-500">{copy.website.guidedDns}</p>
        <div className="mt-5 space-y-4">
          <DnsRow label="CNAME" value="sites.akademate.com" />
          <DnsRow label={copy.website.statusLabel} value={copy.website.status} />
          <DnsRow label={copy.website.securityLabel} value={copy.website.security} />
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <LockKeyhole className="h-4 w-4" />
          {copy.website.secureExperience}
        </div>
      </div>
    </div>
  )
}

function EmbedBuilder({ copy }: { copy: ReturnType<typeof usePreviewCopy> }) {
  return (
    <div className="grid h-full gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <FileCode2 className="h-4 w-4" />
          {copy.website.existingWebsite}
        </div>
        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <div className="h-5 w-2/3 rounded bg-slate-300" />
          <div className="mt-3 h-3 w-full rounded bg-slate-200" />
          <div className="mt-5 rounded-xl border-2 border-blue-500 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-blue-700">{copy.website.liveClasses}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="h-16 rounded bg-blue-50" />
              <div className="h-16 rounded bg-blue-50" />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-[#071633] p-5 text-white">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
          <Code2 className="h-4 w-4" />
          {copy.website.embedBuilder}
        </div>
        <div className="mt-5 rounded-xl bg-[#020a1c] p-4 font-mono text-xs leading-6 text-blue-100/75">
          &lt;akademate-classes
          <br />
          academy=&quot;your-academy&quot;
          <br />
          mode=&quot;booking&quot; /&gt;
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
          {copy.website.embedOptions.map((item) => (
            <div key={item} className="rounded-lg bg-white/10 px-2 py-3">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function OfferShare({ copy }: { copy: ReturnType<typeof usePreviewCopy> }) {
  return (
    <div className="grid h-full gap-4 sm:grid-cols-[.62fr_.38fr]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <BrowserBar address="academy.akademate.com/creative-leadership" copy={copy} />
        <div className="p-5">
          <div className="h-28 rounded-xl bg-[linear-gradient(135deg,#071633,#2563eb)]" />
          <p className="mt-4 text-lg font-semibold">{copy.website.offerTitle}</p>
          <p className="mt-2 text-xs text-slate-500">{copy.website.offerDetail}</p>
          <div className="mt-5 flex gap-2">
            <span className="rounded-full bg-[#071633] px-4 py-2 text-xs font-semibold text-white">
              {copy.website.reserve}
            </span>
            <span className="rounded-full border px-4 py-2 text-xs font-semibold">
              {copy.website.share}
            </span>
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-[#071633] p-5 text-white">
        <Share2 className="h-6 w-6 text-blue-300" />
        <p className="mt-5 text-sm font-semibold">{copy.website.readyToShare}</p>
        <div className="mt-4 space-y-2 text-xs font-semibold">
          {copy.website.shareChecks.map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-3">
              <Check className="h-3.5 w-3.5 text-blue-300" />
              {item}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-blue-200"
        >
          {copy.website.previewOffer} <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function BrowserBar({
  address,
  copy,
}: {
  address: string
  copy: ReturnType<typeof usePreviewCopy>
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-slate-600">
        <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <span className="truncate">{address}</span>
      </div>
      <button type="button" aria-label={copy.website.copyExampleAddress} className="text-slate-500">
        <Copy className="h-4 w-4" />
      </button>
    </div>
  )
}

function DnsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 pb-3">
      <p className="text-[10px] font-semibold text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}
