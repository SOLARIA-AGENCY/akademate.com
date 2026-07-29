import Link from 'next/link'
import { ShieldCheck, Sparkles } from 'lucide-react'
import React from 'react'

const regulatoryNotice = 'Regulatory information; not a certification or official seal'

export function ComplianceBadges() {
  return (
    <div className="flex flex-col items-center gap-2" aria-label={regulatoryNotice}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/legal/privacidad"
          aria-label={`Privacy and GDPR. ${regulatoryNotice}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Privacy and GDPR
        </Link>
        <Link
          href="/legal/ia"
          aria-label={`AI transparency. ${regulatoryNotice}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          AI transparency
        </Link>
      </div>
      <p className="text-center text-[11px] leading-4 text-blue-100/45">{regulatoryNotice}</p>
    </div>
  )
}
